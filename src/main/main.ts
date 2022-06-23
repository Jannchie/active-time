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
import cron from 'node-cron';
import { uIOhook } from '@jannchie/uiohook-napi';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const activeWindows = require('electron-active-window');

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

let secondData = new Map();

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

function getSystemInfo() {
  return {
    platform: os.platform(),
    memory: os.totalmem(),
    version: os.version(),
  };
}

function setIpcHandle(win: BrowserWindow) {
  ipcMain.handle('ready', async () => {
    const systemInfo = getSystemInfo();
    return { systemInfo };
  });
  ipcMain.handle('hide', async () => {
    win.hide();
  });
  ipcMain.handle('quit', async () => {
    app.quit();
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
}

function setTray() {
  const trayMenuTemplate = [
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ];
  const iconPath = getAssetPath('icon.png');
  const appTray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
  mainWindow?.show();
  appTray.setToolTip('never forget');
  appTray.setContextMenu(contextMenu);
  appTray.on('click', () => {
    mainWindow?.show();
  });
  return appTray;
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
  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
  return mainWindow;
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

async function start() {
  await app.whenReady();
  const win = await createWindow();
  win.webContents.openDevTools({ mode: 'undocked' });
  const { db, MinuteRecord } = require('./db');
  setTray();
  function detectActive() {
    let event = new Map();
    cron.schedule('* * * * *', async (now) => {
      const curDatetime = new Date(
        now.getTime() - 1 * 60 * 1000 - (now.getTime() % (1000 * 60))
      );
      secondData.forEach(async (v, k) => {
        const key = JSON.parse(k);
        const record = await MinuteRecord.create({
          program: key.program,
          title: key.title,
          event: key.event,
          timestamp: curDatetime,
          seconds: v,
        });
        console.log(record.toJSON());
      });
      secondData = new Map();
    });

    setInterval(async () => {
      try {
        if (event.size > 0) {
          const activeWindowsInfo = await activeWindows().getActiveWindow();
          const eventType =
            (event.get('type') ?? 0) > settings.checkInterval ? 'type' : 'read';
          const keyObj = {
            program: activeWindowsInfo.windowClass,
            title: activeWindowsInfo.windowName,
            event: eventType,
          };
          const key = JSON.stringify(keyObj);
          secondData.set(
            key,
            (secondData.get(key) ?? 0) + settings.checkInterval
          );
          win.webContents.send('active-event', {
            event,
            activeWindowsInfo,
          });
          event = new Map();
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
  await db.sync();
  setIpcHandle(win);
  detectActive();
}
start().catch(console.log);
