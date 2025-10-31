import psList from 'ps-list';
import os from 'os';
import { SUSPICIOUS_PROCESS_SIGNATURES, DEFAULT_SCAN_CONFIG } from './suspiciousApps.js';

const dedupe = (array) => Array.from(new Set(array));
const sanitize = (value) => (value ?? '').toString().trim();
const stripExtension = (value) => value.replace(/\.[^./\\\s]+$/u, '');

const addVariants = (list, raw) => {
  const sanitized = sanitize(raw);
  if (!sanitized) {
    return;
  }
  list.push(sanitized);
  list.push(stripExtension(sanitized));
};

const buildHaystacks = (processInfo, includeCommandLine) => {
  const haystacks = [];

  if (processInfo?.name) {
    addVariants(haystacks, processInfo.name);
  }

  if (includeCommandLine && processInfo?.cmd) {
    const command = sanitize(processInfo.cmd);
    if (command) {
      const executable = command.split(/\s+/)[0];
      addVariants(haystacks, executable);
    }
  }

  return dedupe(haystacks);
};

function checkSignatureAgainstProcess(signature, processInfo, { includeCommandLine }) {
  const haystacks = buildHaystacks(processInfo, includeCommandLine);

  const matchedPatterns = signature.patterns.filter((pattern) => {
    const target = sanitize(pattern);
    if (!target) {
      return false;
    }
    return haystacks.includes(target) || haystacks.includes(stripExtension(target));
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

export async function scanProcesses(options = {}) {
  const config = { ...DEFAULT_SCAN_CONFIG, ...options };

  const processes = await psList({ all: false });

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
