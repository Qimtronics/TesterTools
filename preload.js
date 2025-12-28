console.log('preload.js loaded');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listPorts: () => ipcRenderer.invoke('list-ports'),

  connectATG: cfg => ipcRenderer.invoke('connect-atg', cfg),
  connectBeacon: cfg => ipcRenderer.invoke('connect-beacon', cfg),

  onATGData: cb =>
    ipcRenderer.on('atg-data', (_, d) => cb(d)),

  onBeaconData: cb =>
    ipcRenderer.on('beacon-data', (_, d) => cb(d))
});

