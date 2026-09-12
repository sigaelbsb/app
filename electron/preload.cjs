const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al frontend si se requieren llamadas nativas
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  plataforma: process.platform,
  version: process.versions.electron
});
