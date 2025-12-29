import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels =
  | 'toggle-record'
  | 'hide'
  | 'minimize'
  | 'quit'
  | 'ready'
  | 'get-db-file-size'
  | 'clean-db-data'
  | 'get-days-records'
  | 'get-hours-records'
  | 'get-minutes-records'
  | 'get-foreground-days-records'
  | 'get-foreground-hours-records'
  | 'get-foreground-minutes-records'
  | 'get-active-window'
  | 'get-running-processes'
  | 'set-login-settings'
  | 'get-login-item-settings'
  | 'login-item-setting-changed'
  | 'recording-changed';

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
