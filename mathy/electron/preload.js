const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Menu actions
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-notebook', callback);
    ipcRenderer.on('menu-open-notebook', (event, filePath) => callback('open-notebook', filePath));
    ipcRenderer.on('menu-save-notebook', callback);
    ipcRenderer.on('menu-insert-math', callback);
    ipcRenderer.on('menu-toggle-math-mode', callback);
  },

  // File operations
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  getPlatform: () => process.platform,

  // Window controls
  minimize: () => ipcRenderer.invoke('minimize-window'),
  maximize: () => ipcRenderer.invoke('maximize-window'),
  close: () => ipcRenderer.invoke('close-window'),
});

// Remove all listeners when the window is closed
window.addEventListener('beforeunload', () => {
  ipcRenderer.removeAllListeners('menu-new-notebook');
  ipcRenderer.removeAllListeners('menu-open-notebook');
  ipcRenderer.removeAllListeners('menu-save-notebook');
  ipcRenderer.removeAllListeners('menu-insert-math');
  ipcRenderer.removeAllListeners('menu-toggle-math-mode');
});
