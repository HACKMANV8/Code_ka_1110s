import psList from 'ps-list';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { SUSPICIOUS_PROCESS_SIGNATURES, DEFAULT_SCAN_CONFIG } from './suspiciousApps.js';

const dedupe = (array) => Array.from(new Set(array.filter(Boolean)));
const sanitize = (value) => (value ?? '').toString().trim();
const stripExtension = (value) => value.replace(/\.[^./\\\s]+$/u, '');
const normalize = (value) => sanitize(value).toLowerCase();
const execFileAsync = promisify(execFile);

const addVariants = (list, raw) => {
  const sanitized = sanitize(raw);
  if (!sanitized) {
    return;
  }

  const normalized = sanitized.toLowerCase();
  if (normalized) {
    list.push(normalized);
  }

  const stripped = stripExtension(sanitized).toLowerCase();
  if (stripped && stripped !== normalized) {
    list.push(stripped);
  }
};

const buildHaystacks = (processInfo, includeCommandLine) => {
  const haystacks = [];

  if (processInfo?.name) {
    addVariants(haystacks, processInfo.name);
  }

  if (includeCommandLine && processInfo?.cmd) {
    const command = sanitize(processInfo.cmd);
    if (command) {
      addVariants(haystacks, command.split(/\s+/)[0]);
      haystacks.push(command.toLowerCase());
    }
  }

  return dedupe(haystacks);
};

const matchesPattern = (candidate, target) => {
  if (!candidate) return false;
  if (candidate === target) return true;

  const tokens = candidate.split(/[^a-z0-9]+/gi).map((token) => token.trim()).filter(Boolean);
  return tokens.some((token) => token === target);
};

function checkSignatureAgainstProcess(signature, processInfo, { includeCommandLine }) {
  const haystacks = buildHaystacks(processInfo, includeCommandLine);

  const matchedPatterns = signature.patterns.filter((pattern) => {
    const target = normalize(pattern);
    if (!target) {
      return false;
    }
    return haystacks.some((candidate) => matchesPattern(candidate, target));
  });

  if (matchedPatterns.length === 0) {
    return null;
  }

  return {
    signature: signature.label,
    matchedPatterns: dedupe(matchedPatterns),
    confidence: 1.0,
  };
}

const parsePsOutput = (stdout) => {
  return stdout
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const firstSpace = line.indexOf(' ');
      if (firstSpace === -1) {
        return null;
      }
      const pidPart = line.slice(0, firstSpace).trim();
      const rest = line.slice(firstSpace + 1).trim();
      const secondSpace = rest.indexOf(' ');
      const command = secondSpace === -1 ? rest : rest.slice(0, secondSpace);
      const args = secondSpace === -1 ? '' : rest.slice(secondSpace + 1);
      const pid = Number(pidPart);
      if (!Number.isFinite(pid)) {
        return null;
      }
      return {
        pid,
        name: command,
        cmd: args || command,
      };
    })
    .filter((item) => item !== null);
};

const listProcesses = async () => {
  const isRoot = typeof process.getuid === 'function' && process.getuid() === 0;
  if (process.platform === 'darwin' && isRoot && process.env.SUDO_UID) {
    try {
      const { stdout } = await execFileAsync('launchctl', ['asuser', process.env.SUDO_UID, '/bin/ps', '-axo', 'pid=,comm=,args=']);
      return parsePsOutput(stdout);
    } catch (error) {
      console.warn('launchctl asuser ps failed, falling back to ps-list:', error);
    }
  } else if (process.platform === 'linux' && isRoot && process.env.SUDO_USER) {
    try {
      const { stdout } = await execFileAsync('sudo', ['-u', process.env.SUDO_USER, 'ps', '-axo', 'pid=,comm=,args=']);
      return parsePsOutput(stdout);
    } catch (error) {
      console.warn('sudo -u ps failed, falling back to ps-list:', error);
    }
  }

  return psList({ all: false });
};

export async function scanProcesses(options = {}) {
  const config = { ...DEFAULT_SCAN_CONFIG, ...options };

  const processes = await listProcesses();

  const suspiciousFindings = [];

  for (const processInfo of processes) {
    const matches = [];

    for (const signature of SUSPICIOUS_PROCESS_SIGNATURES) {
      const matchResult = checkSignatureAgainstProcess(signature, processInfo, config);
      if (matchResult) {
        matches.push(matchResult);
      }
    }

    if (matches.length >= config.matchesRequired) {
      const bestMatch = matches.reduce((prev, current) =>
        current.confidence > prev.confidence ? current : prev
      );

      if (bestMatch.confidence >= config.minimumConfidence) {
        suspiciousFindings.push({
          pid: processInfo.pid,
          name: processInfo.name,
          cmd: processInfo.cmd,
          match: bestMatch,
          allMatches: matches,
        });
      }
    }
  }

  const signatureSummary = SUSPICIOUS_PROCESS_SIGNATURES.map((signature) => {
    const hits = suspiciousFindings.filter((finding) =>
      finding.allMatches.some((match) => match.signature === signature.label)
    );
    return {
      signature: signature.label,
      hits: hits.length,
      pids: hits.map((hit) => hit.pid),
    };
  }).filter((summary) => summary.hits > 0);

  return {
    timestamp: new Date().toISOString(),
    platform: {
      type: os.type(),
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
    },
    totalProcesses: processes.length,
    flaggedProcessCount: suspiciousFindings.length,
    findings: suspiciousFindings,
    summary: signatureSummary,
  };
}
