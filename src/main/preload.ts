import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels =
  | 'toggle-record'
  | 'hide'
  | 'minimize'
  | 'quit'
  | 'ready'
  | 'get-db-file-size'
  | 'clean-db-data'
  | 'get-minutes-records';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke(channel: Channels, args?: any) {
      return ipcRenderer.invoke(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
});
