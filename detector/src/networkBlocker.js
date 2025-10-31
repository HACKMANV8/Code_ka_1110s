import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const BLOCK_TAG = '# camera-detector-block';
const execFileAsync = promisify(execFile);

const getHostsPath = () => {
  if (process.platform === 'win32') {
    const systemRoot = process.env.SystemRoot || 'C:\\\\Windows';
    return path.join(systemRoot, 'System32', 'drivers', 'etc', 'hosts');
  }
  return '/etc/hosts';
};

const readHosts = async (hostsPath) => {
  try {
    return await fs.readFile(hostsPath, 'utf8');
  } catch (error) {
    if (error?.code === 'EACCES' || error?.code === 'EPERM') {
      const permissionError = new Error(`Permission denied reading hosts file (${hostsPath}).`);
      permissionError.code = 'EACCES';
      throw permissionError;
    }
    throw new Error(`Unable to read hosts file (${hostsPath}): ${error.message}`);
  }
};

const writeHosts = async (hostsPath, content) => {
  try {
    await fs.writeFile(hostsPath, content, 'utf8');
  } catch (error) {
    if (error?.code === 'EACCES' || error?.code === 'EPERM') {
      const permissionError = new Error(`Permission denied writing hosts file (${hostsPath}).`);
      permissionError.code = 'EACCES';
      throw permissionError;
    }
    throw new Error(`Unable to write hosts file (${hostsPath}): ${error.message}`);
  }
};

const hasTaggedEntry = (line, domain) =>
  line.includes(BLOCK_TAG) && line.split(/\s+/).includes(domain);

export async function blockDomains(domains = []) {
  if (!Array.isArray(domains) || domains.length === 0) {
    return { applied: false, reason: 'no_domains' };
  }

  const hostsPath = getHostsPath();
  let current;
  try {
    current = await readHosts(hostsPath);
  } catch (error) {
    if (error?.code === 'EACCES') {
      return {
        applied: false,
        error: error.message,
        reason: 'permission_denied',
        path: hostsPath,
      };
    }
    throw error;
  }
  const lines = current.split(/\r?\n/);
  const additions = [];

  for (const domain of domains) {
    if (!domain) continue;
    const alreadyPresent = lines.some((line) => hasTaggedEntry(line, domain));
    if (alreadyPresent) {
      continue;
    }
    additions.push(`127.0.0.1 ${domain} ${BLOCK_TAG}`);
    additions.push(`::1 ${domain} ${BLOCK_TAG}`);
  }

  if (additions.length === 0) {
    return { applied: true, reason: 'already_blocked', path: hostsPath };
  }

  const nextContent = [...lines, ...additions].filter(Boolean).join('\n') + '\n';
  try {
    await writeHosts(hostsPath, nextContent);
  } catch (error) {
    if (error?.code === 'EACCES') {
      return {
        applied: false,
        error: error.message,
        reason: 'permission_denied',
        path: hostsPath,
      };
    }
    throw error;
  }

  const flush = await flushDnsCache();

  return {
    applied: true,
    added: additions,
    path: hostsPath,
    flush,
  };
}

export async function unblockDomains(domains = []) {
  if (!Array.isArray(domains) || domains.length === 0) {
    return { removed: false, reason: 'no_domains' };
  }

  const hostsPath = getHostsPath();
  let current;
  try {
    current = await readHosts(hostsPath);
  } catch (error) {
    if (error?.code === 'EACCES') {
      return {
        removed: false,
        error: error.message,
        reason: 'permission_denied',
        path: hostsPath,
      };
    }
    throw error;
  }
  const lines = current.split(/\r?\n/);
  const domainSet = new Set(domains.filter(Boolean));

  let removedAny = false;
  const filtered = lines.filter((line) => {
    if (!line.includes(BLOCK_TAG)) {
      return true;
    }
    for (const domain of domainSet) {
      if (hasTaggedEntry(line, domain)) {
        removedAny = true;
        return false;
      }
    }
    return true;
  });

  if (!removedAny) {
    return { removed: false, reason: 'not_blocked', path: hostsPath };
  }

  const nextContent = filtered.filter(Boolean).join('\n');
  try {
    await writeHosts(hostsPath, nextContent ? `${nextContent}\n` : '');
  } catch (error) {
    if (error?.code === 'EACCES') {
      return {
        removed: false,
        error: error.message,
        reason: 'permission_denied',
        path: hostsPath,
      };
    }
    throw error;
  }

  const flush = await flushDnsCache();

  return {
    removed: true,
    path: hostsPath,
    flush,
  };
}

export function getHostsFilePath() {
  return getHostsPath();
}

export async function flushDnsCache() {
  const platform = process.platform;
  const commands = [];

  if (platform === 'win32') {
    commands.push({ cmd: 'ipconfig', args: ['/flushdns'] });
  } else if (platform === 'darwin') {
    commands.push({ cmd: 'killall', args: ['-HUP', 'mDNSResponder'] });
  } else {
    commands.push({ cmd: 'systemd-resolve', args: ['--flush-caches'] });
    commands.push({ cmd: 'resolvectl', args: ['flush-caches'] });
  }

  for (const entry of commands) {
    try {
      await execFileAsync(entry.cmd, entry.args, { stdio: 'ignore' });
      return { success: true, command: `${entry.cmd} ${entry.args.join(' ')}` };
    } catch (error) {
      // Try next option
    }
  }

  return { success: false, command: null };
}
