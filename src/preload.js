// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  onActiveEvent: (cb) => ipcRenderer.on("active-event", cb),
  onSystemInfo: (cb) => ipcRenderer.on("system-info", cb),
  onRecordingChanged: (cb) => ipcRenderer.on("recording-changed", cb),
  ready: () => ipcRenderer.invoke("ready"),
  removeAllListeners: () => ipcRenderer.removeAllListeners(),
  quit: () => ipcRenderer.invoke("quit"),
  hide: () => ipcRenderer.invoke("hide"),
  toggleRecord: (val) => ipcRenderer.invoke("toggle-record", val),
});
