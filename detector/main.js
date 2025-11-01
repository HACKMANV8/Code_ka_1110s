import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { startApiServer } from './src/apiServer.js';
import {
  enableNetworkInterceptor,
  disableNetworkInterceptor,
  getInterceptorState,
} from './src/networkInterceptor.js';
import { blockDomains, unblockDomains } from './src/networkBlocker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let apiContext = null;
const BLOCKED_DOMAINS = [
  'reddit.com',
  'www.reddit.com',
  'chat.openai.com',
  'api.openai.com',
  'labs.openai.com',
  'claude.ai',
  'platform.anthropic.com',
  'gemini.google.com',
  'bard.google.com',
  'ai.google.dev',
  'copilot.microsoft.com',
  'bing.com',
  'www.bing.com',
  'huggingface.co',
  'poe.com',
  'chatgpt.com',
  'cursor.sh',
  'githubcopilot.com',
  'perplexity.ai',
  'www.perplexity.ai',
  'character.ai',
  'writesonic.com',
  'midjourney.com',
  'discord.com',
  'www.discord.com',
  'notion.so',
  'www.notion.so',
  'stackblitz.com',
  'jsfiddle.net',
  'codepen.io',
  'glitch.com',
];

const combineNetworkState = ({ hosts, interceptor }) => {
  const hostState = hosts ?? { applied: false };
  const interceptorState = interceptor ?? { enabled: false };

  const applied = Boolean(hostState.applied) || Boolean(interceptorState.enabled);
  const reason = hostState.applied
    ? hostState.reason ?? 'hosts_applied'
    : interceptorState.enabled
    ? interceptorState.reason ?? 'interceptor_enabled'
    : hostState.reason ?? interceptorState.reason;
  const error = applied ? undefined : hostState.error ?? interceptorState.error;

  return {
    applied,
    reason,
    error,
    path: hostState.path,
    flush: hostState.flush,
    hosts: hostState,
    interceptor: interceptorState,
    domains: [...BLOCKED_DOMAINS],
  };
};

let networkBlockState = combineNetworkState({
  hosts: { applied: false },
  interceptor: getInterceptorState(),
});

const applyNetworkBlock = async () => {
  let hostsResult;
  let hostsError;

  try {
    hostsResult = await blockDomains(BLOCKED_DOMAINS);
  } catch (error) {
    hostsError = error;
  }

  const hostState = (() => {
    if (hostsError) {
      return { applied: false, error: hostsError.message, reason: 'error' };
    }
    if (!hostsResult) {
      return { applied: false, reason: 'no_result' };
    }
    const applied = Boolean(hostsResult.applied || hostsResult.reason === 'already_blocked');
    return {
      applied,
      path: hostsResult.path,
      flush: hostsResult.flush,
      reason: hostsResult.reason || (applied ? 'hosts_applied' : undefined),
      error: hostsResult.error,
    };
  })();

  const interceptorState = enableNetworkInterceptor(BLOCKED_DOMAINS);
  if (!interceptorState.enabled && interceptorState.reason && interceptorState.reason !== 'no_domains') {
    console.warn('Network interceptor inactive:', interceptorState.reason, interceptorState.error || '');
  }

  networkBlockState = combineNetworkState({
    hosts: hostState,
    interceptor: interceptorState,
  });

  if (!networkBlockState.applied) {
    console.error('Failed to apply network block:', networkBlockState.error ?? 'unknown reason');
  }

  return networkBlockState;
};

const removeNetworkBlock = async () => {
  let hostsResult;
  let hostsError;

  try {
    hostsResult = await unblockDomains(BLOCKED_DOMAINS);
  } catch (error) {
    hostsError = error;
  }

  const hostState = (() => {
    if (hostsError) {
      return { applied: false, error: hostsError.message, reason: 'error' };
    }
    if (!hostsResult) {
      return { applied: false, reason: 'no_result' };
    }
    const removed = Boolean(hostsResult.removed || hostsResult.reason === 'not_blocked');
    return {
      applied: false,
      removed,
      path: hostsResult.path,
      flush: hostsResult.flush,
      reason: hostsResult.reason || (removed ? 'removed' : undefined),
      error: hostsResult.error,
    };
  })();

  const interceptorDisable = disableNetworkInterceptor();
  const interceptorState = {
    ...interceptorDisable,
    enabled: false,
  };
  if (!interceptorDisable.disabled && interceptorDisable.reason !== 'not_enabled') {
    console.warn('Network interceptor removal issue:', interceptorDisable.reason, interceptorDisable.error || '');
  }

  networkBlockState = combineNetworkState({
    hosts: hostState,
    interceptor: interceptorState,
  });

  return networkBlockState;
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 360,
    useContentSize: true,
    resizable: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    title: 'Camera Manipulation Detector',
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.removeMenu?.();
  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
};

ipcMain.handle('start-monitoring', async () => {
  if (apiContext?.getStatus().running) {
    return { ...apiContext.getStatus(), networkBlock: networkBlockState };
  }

  apiContext = await startApiServer();
  const networkBlock = await applyNetworkBlock();
  return { ...apiContext.getStatus(), networkBlock };
});

ipcMain.handle('get-server-status', async () => {
  if (!apiContext) {
    return { running: false, networkBlock: networkBlockState };
  }
  return { ...apiContext.getStatus(), networkBlock: networkBlockState };
});
ipcMain.handle('scan-now', async (_event, options) => {
  if (!apiContext) {
    throw new Error('Monitoring service is not running');
  }
  return apiContext.scanNow(options);
});
ipcMain.handle('stop-monitoring', async () => {
  if (!apiContext) {
    const networkBlock = await removeNetworkBlock();
    return { running: false, networkBlock };
  }
  try {
    await apiContext.stop();
  } finally {
    apiContext = null;
  }
  const networkBlock = await removeNetworkBlock();
  return { running: false, networkBlock };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    if (apiContext) {
      try {
        await apiContext.stop();
      } catch (error) {
        console.error('Error shutting down API server:', error);
      }
    }
    await removeNetworkBlock();
    app.quit();
  }
});
