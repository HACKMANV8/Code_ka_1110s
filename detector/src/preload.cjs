const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('detectorAPI', {
  startMonitoring: () => ipcRenderer.invoke('start-monitoring'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  scanNow: (options) => ipcRenderer.invoke('scan-now', options ?? {}),
  stopMonitoring: () => ipcRenderer.invoke('stop-monitoring'),
});
