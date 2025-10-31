import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { startApiServer } from './src/apiServer.js';
import { blockDomains, unblockDomains } from './src/networkBlocker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let apiContext = null;
const BLOCKED_DOMAINS = ['reddit.com', 'www.reddit.com'];
let networkBlockState = { applied: false };

const updateNetworkBlockState = (data = {}) => {
  networkBlockState = {
    applied: Boolean(data.applied),
    path: data.path || networkBlockState.path,
    reason: data.reason,
    error: data.error,
    flush: data.flush || networkBlockState.flush,
  };
  return networkBlockState;
};

const applyNetworkBlock = async () => {
  try {
    const result = await blockDomains(BLOCKED_DOMAINS);
    const applied = result.applied || result.reason === 'already_blocked';
    return updateNetworkBlockState({
      applied,
      path: result.path,
      reason: result.reason || (applied ? 'applied' : undefined),
    });
  } catch (error) {
    console.error('Failed to apply network block:', error);
    return updateNetworkBlockState({ applied: false, error: error.message });
  }
};

const removeNetworkBlock = async () => {
  try {
    const result = await unblockDomains(BLOCKED_DOMAINS);
    const removed = result.removed || result.reason === 'not_blocked';
    return updateNetworkBlockState({
      applied: removed ? false : networkBlockState.applied,
      path: result.path,
      reason: result.reason || (removed ? 'removed' : undefined),
    });
  } catch (error) {
    console.error('Failed to remove network block:', error);
    return updateNetworkBlockState({ applied: false, error: error.message });
  }
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
