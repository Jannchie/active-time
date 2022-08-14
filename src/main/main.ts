/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { autoUpdater } from 'electron-updater';
import path from 'path';
import log from 'electron-log';
import { app, BrowserWindow, Menu, Tray, ipcMain, shell } from 'electron';
import os from 'os';
import { uIOhook } from 'uiohook-napi';
import activeWindows from '@jannchie/active-window';
import fs from 'fs/promises';
import MenuBuilder from './menu';
import { getCurDay, getCurHour, getCurMinute, resolveHtmlPath } from './util';
import { DB, DailyRecord, HourlyRecord, MinuteRecord } from './db';

const data: {
  closeable: boolean;
  timer: NodeJS.Timer | null;
} = {
  closeable: false,
  timer: null,
};

function show(win: BrowserWindow) {
  data.closeable = false;
  win.show();
  app.dock?.show();
}

function hide(mainWindow: BrowserWindow) {
  mainWindow.hide();
  app.dock?.hide();
}

function exit(win: BrowserWindow) {
  win?.close();
  data.closeable = true;
  app.quit();
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

process.on('exit', () => {
  uIOhook.stop();
});

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const settings = {
  recording: true,
  checkInterval: 5,
  theme: 'system',
  language: 'en',
};

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

function getSystemInfo() {
  return {
    platform: os.platform(),
    memory: os.totalmem(),
    version: os.version(),
    arch: os.arch(),
  };
}

function setIpcHandle(win: BrowserWindow) {
  ipcMain.removeAllListeners();
  ipcMain.handle('ready', async () => {
    const systemInfo = getSystemInfo();
    return { systemInfo };
  });

  ipcMain.handle('get-minutes-records', async (_, duration: any) => {
    return DB.getMinuteRecords(duration as number);
  });

  ipcMain.handle('get-hours-records', async (_, duration: any) => {
    return DB.getHourlyRecords(duration as number);
  });

  ipcMain.handle('get-days-records', async (_, duration: any) => {
    return DB.getDailyRcords(duration as number);
  });

  ipcMain.handle('get-db-file-size', async () => {
    const p = `${app.getPath('userData')}/data.db`;
    return (await fs.stat(p)).size;
  });

  ipcMain.handle('clean-db-data', async () => {
    await DB.cleanData();
  });

  ipcMain.handle('hide', async () => {
    hide(win);
  });

  ipcMain.handle('minimize', async () => {
    win.minimize();
  });

  ipcMain.handle('quit', async () => {
    data.closeable = true;
    app.quit();
  });
  ipcMain.handle('set-login-settings', async (_, val) => {
    app.setLoginItemSettings({
      openAtLogin: val,
      openAsHidden: val,
    });
    win.webContents.send(
      'login-item-setting-changed',
      app.getLoginItemSettings()
    );
  });
  ipcMain.handle('toggle-record', (_, val) => {
    if (val === true) {
      uIOhook.start();
      settings.recording = true;
    } else if (val === false) {
      uIOhook.stop();
      settings.recording = false;
    } else {
      if (settings.recording) {
        uIOhook.stop();
      } else {
        uIOhook.start();
      }
      settings.recording = !settings.recording;
    }
    win.webContents.send('recording-changed', settings.recording);
  });

  ipcMain.handle('get-login-item-settings', () => {
    win.webContents.send(
      'login-item-setting-changed',
      app.getLoginItemSettings()
    );
  });
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }
  const mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    minWidth: 600,
    icon: getAssetPath('icon.png'),
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    data.closeable = true;
    app.quit();
  } else {
    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    });
  }
  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('close', (e: Electron.Event) => {
    if (!data.closeable) {
      hide(mainWindow);
      e.preventDefault();
    }
  });
  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
  mainWindow.on('closed', () => {});
  mainWindow.on('minimize', () => {
    data.closeable = true;
  });
  // Remove this if your app does not use auto updates
  try {
    // eslint-disable-next-line
    new AppUpdater();
  } catch (e) {
    console.log(e);
  }
  return mainWindow;
};

function setTray(win: BrowserWindow) {
  const trayMenuTemplate = [
    {
      label: 'Show',
      click: () => {
        show(win);
      },
    },
    {
      label: 'Hide',
      click: () => {
        hide(win);
      },
    },
    {
      label: 'Exit',
      click: () => {
        exit(win);
      },
    },
  ];

  // If the platform is OSX, we need to use template icons.
  const iconPath = getAssetPath(
    os.platform() === 'darwin' ? 'TrayTemplate.png' : 'Tray.png'
  );
  const appTray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
  appTray.setToolTip('Active Time');
  appTray.setContextMenu(contextMenu);

  // In darwin, the click event will pop up the context menu rather than show the window.
  if (process.platform !== 'darwin') {
    appTray.on('click', () => {
      show(win);
    });
  }

  return appTray;
}

async function start() {
  await app.whenReady();
  await DB.sync();
  const win = await createWindow();
  setTray(win);
  setIpcHandle(win);
}

function detectActive() {
  // Reset
  if (data.timer) {
    uIOhook.stop();
    uIOhook.removeAllListeners();
    clearInterval(data.timer);
  }
  let event = new Map();
  function cleanEvent() {
    event = new Map();
  }
  function getEvent() {
    return event;
  }
  data.timer = setInterval(async () => {
    try {
      const eventInfo = getEvent();
      if (eventInfo.size > 0) {
        const now = new Date();
        const activeWindowsInfo = await activeWindows().getActiveWindow();
        const eventType =
          (eventInfo.get('type') ?? 0) > settings.checkInterval
            ? 'type'
            : 'read';
        const program = activeWindowsInfo.windowClass;
        const title = activeWindowsInfo.windowName;
        const seconds = settings.checkInterval;
        [DailyRecord, MinuteRecord, HourlyRecord].map(async (_, i) => {
          let curTime;
          switch (i) {
            case 1:
              curTime = getCurMinute(now);
              break;
            case 2:
              curTime = getCurHour(now);
              break;
            case 0:
              curTime = getCurDay(now);
              break;
            default:
              throw new Error('Unknown record model');
          }
          const searchOptions = {
            where: {
              timestamp: curTime,
              program,
              title,
              event: eventType,
            },
          };
          try {
            let record: any;
            let created: boolean;
            switch (i) {
              case 0:
                [record, created] = await DailyRecord.findOrCreate(
                  searchOptions
                );
                break;
              case 1:
                [record, created] = await MinuteRecord.findOrCreate(
                  searchOptions
                );
                break;
              default:
                [record, created] = await HourlyRecord.findOrCreate(
                  searchOptions
                );
                break;
            }
            if (created) {
              record.set('event', eventType);
              record.set('seconds', seconds);
            } else {
              record.set('event', eventType);
              record.set('seconds', record.seconds + seconds);
            }
            await record.save();
          } catch (e) {
            console.log(e);
          }
        });
        cleanEvent();
      }
    } catch (e) {
      console.log(e);
    }
  }, 1000 * settings.checkInterval);
  uIOhook.on('keydown', () => {
    event.set('type', (event.get('type') ?? 0) + 1);
  });
  uIOhook.on('mousedown', () => {
    event.set('read', (event.get('read') ?? 0) + 1);
  });
  uIOhook.on('mousemove', () => {
    event.set('read', (event.get('read') ?? 0) + 1);
  });
  uIOhook.on('wheel', () => {
    event.set('read', (event.get('read') ?? 0) + 1);
  });
  uIOhook.start();
}
detectActive();
start().catch(console.log);
