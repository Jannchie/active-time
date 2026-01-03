/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `pnpm run build` or `pnpm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { autoUpdater } from 'electron-updater';
import path from 'path';
import log from 'electron-log';
import { app, BrowserWindow, Menu, Tray, ipcMain, shell } from 'electron';
import os from 'os';
import fs from 'fs/promises';
import MenuBuilder from './menu';
import {
  autoDecodeText,
  getCurDay,
  getCurHour,
  getCurMinute,
  resolveHtmlPath,
} from './util';
import { DB } from './db';
import {
  getWindowsProcessNameByPid,
  listRunningProcessNames,
  listWindowsProcessPaths,
} from './processes';

let uIOhook: any = null;
let activeWindows: any = null;
let activityTrackingUnavailableWarned = false;
let activeStatusKey = '';
const activeStatus = {
  program: '',
  since: 0,
};
const foregroundProgramCache = new Set<string>();
const programLabelCache = new Map<string, string>();
type ProgramIconCacheEntry = { data: string | null; updatedAt: number };
const programIconCache = new Map<string, ProgramIconCacheEntry>();
const programPathCache = new Map<string, string>();
const pidProgramCache = new Map<number, { name: string; cachedAt: number }>();
const PATH_REFRESH_INTERVAL_MS = 60 * 1000;
const PID_CACHE_TTL_MS = 5 * 60 * 1000;
const ICON_MISS_TTL_MS = 10 * 60 * 1000;
const ICON_CACHE_SAVE_DEBOUNCE_MS = 2000;
const ICON_CACHE_FILE = 'program-icons.json';
let iconCacheSaveTimer: NodeJS.Timeout | null = null;
let iconCacheDirty = false;
let lastPathRefresh = 0;

const stripProgramExtension = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (process.platform === 'win32') {
    const lower = trimmed.toLowerCase();
    if (lower.endsWith('.exe')) {
      return trimmed.slice(0, -4);
    }
  }
  return trimmed;
};

const normalizeProgramName = (value: string) =>
  stripProgramExtension(value).toLowerCase();

const normalizeProgramLabel = (value?: string) => {
  if (!value) {
    return '';
  }
  return stripProgramExtension(value);
};

const resolveProgramNameByPid = async (pid?: number) => {
  if (!pid || pid <= 0 || !Number.isFinite(pid)) {
    return '';
  }
  const cached = pidProgramCache.get(pid);
  const now = Date.now();
  if (cached && now - cached.cachedAt < PID_CACHE_TTL_MS) {
    return cached.name;
  }
  if (process.platform !== 'win32') {
    return '';
  }
  try {
    const name = normalizeProgramLabel(await getWindowsProcessNameByPid(pid));
    pidProgramCache.set(pid, { name, cachedAt: now });
    return name;
  } catch {
    pidProgramCache.set(pid, { name: '', cachedAt: now });
    return '';
  }
};

const refreshWindowsPathCache = async () => {
  if (process.platform !== 'win32') {
    return;
  }
  const now = Date.now();
  if (now - lastPathRefresh < PATH_REFRESH_INTERVAL_MS) {
    return;
  }
  lastPathRefresh = now;
  try {
    const map = await listWindowsProcessPaths();
    map.forEach((filePath, programName) => {
      const normalized = normalizeProgramName(programName);
      if (normalized && filePath) {
        programPathCache.set(normalized, filePath);
      }
    });
  } catch {
    // Ignore process cache refresh errors.
  }
};

const getIconCachePath = () =>
  path.join(app.getPath('userData'), ICON_CACHE_FILE);

const loadIconCache = async () => {
  try {
    const raw = await fs.readFile(getIconCachePath(), 'utf8');
    if (!raw) {
      return;
    }
    const now = Date.now();
    const data = JSON.parse(raw) as Record<string, unknown>;
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        programIconCache.set(key, { data: value, updatedAt: now });
        return;
      }
      if (!value || typeof value !== 'object') {
        return;
      }
      const record = value as { data?: unknown; updatedAt?: unknown };
      if (typeof record.data === 'string') {
        programIconCache.set(key, {
          data: record.data,
          updatedAt:
            typeof record.updatedAt === 'number' ? record.updatedAt : now,
        });
      }
    });
  } catch {
    // Ignore cache load errors.
  }
};

const flushIconCache = async () => {
  if (!iconCacheDirty) {
    return;
  }
  iconCacheDirty = false;
  const payload: Record<string, { data: string; updatedAt: number }> = {};
  programIconCache.forEach((entry, key) => {
    if (entry.data) {
      payload[key] = { data: entry.data, updatedAt: entry.updatedAt };
    }
  });
  try {
    await fs.writeFile(getIconCachePath(), JSON.stringify(payload));
  } catch {
    iconCacheDirty = true;
  }
};

const scheduleIconCacheSave = () => {
  iconCacheDirty = true;
  if (iconCacheSaveTimer) {
    return;
  }
  iconCacheSaveTimer = setTimeout(() => {
    iconCacheSaveTimer = null;
    void flushIconCache();
  }, ICON_CACHE_SAVE_DEBOUNCE_MS);
};

const resolveProgramIcon = async (programName: string): Promise<string | null> => {
  const normalized = normalizeProgramName(programName);
  if (!normalized) {
    return null;
  }
  const cached = programIconCache.get(normalized);
  const now = Date.now();
  if (cached) {
    if (cached.data) {
      return cached.data;
    }
    if (now - cached.updatedAt < ICON_MISS_TTL_MS) {
      return null;
    }
  }
  let iconData: string | null = null;
  if (process.platform === 'win32') {
    const filePath = programPathCache.get(normalized);
    if (filePath) {
      try {
        const icon = await app.getFileIcon(filePath, { size: 'small' });
        iconData = icon.toDataURL();
      } catch {
        iconData = null;
      }
    }
  }
  programIconCache.set(normalized, { data: iconData, updatedAt: now });
  if (iconData) {
    scheduleIconCacheSave();
  }
  return iconData;
};

const cacheProgramIcon = async (programName: string) => {
  try {
    await refreshWindowsPathCache();
    await resolveProgramIcon(programName);
  } catch {
    // Ignore cache errors.
  }
};

const trackForegroundProgram = (program: string) => {
  const label = normalizeProgramLabel(program);
  const normalized = normalizeProgramName(label);
  if (!normalized) {
    return;
  }
  foregroundProgramCache.add(normalized);
  if (label) {
    programLabelCache.set(normalized, label);
  }
};

try {
  ({ uIOhook } = require('uiohook-napi'));
} catch (error) {
  if (process.env.NODE_ENV !== 'development') {
    throw error;
  }
}

try {
  const activeWindowModule = require('@jannchie/active-window');
  activeWindows = activeWindowModule?.default ?? activeWindowModule;
} catch (error) {
  if (process.env.NODE_ENV !== 'development') {
    throw error;
  }
}

const canTrackForeground = () => Boolean(activeWindows);
const getActiveStatus = async () => {
  if (!canTrackForeground()) {
    return { available: false };
  }
  try {
    const info = await activeWindows().getActiveWindow();
    if (!info) {
      return { available: false };
    }
    const { program } = await resolveActiveWindowInfo(info);
    if (!program) {
      activeStatusKey = '';
      activeStatus.program = '';
      activeStatus.since = 0;
      return {
        available: true,
        program: '',
        since: 0,
      };
    }
    if (program !== activeStatusKey) {
      activeStatusKey = program;
      activeStatus.program = program;
      activeStatus.since = Date.now();
    }
    return {
      available: true,
      program: activeStatus.program,
      since: activeStatus.since,
    };
  } catch {
    return { available: false };
  }
};

const warnActivityTrackingUnavailable = () => {
  if (activityTrackingUnavailableWarned) {
    return;
  }
  activityTrackingUnavailableWarned = true;
  console.warn(
    'Activity tracking is disabled because native modules are unavailable.'
  );
};

const resolveActiveWindowInfo = async (info: any) => {
  const pid = Number(info?.windowPid);
  const fromPid = await resolveProgramNameByPid(pid);
  if (fromPid) {
    return { program: fromPid };
  }
  const program = normalizeProgramLabel(autoDecodeText(info?.windowClass) ?? '');
  return { program };
};

const loadForegroundPrograms = async () => {
  try {
    const programs = await DB.listForegroundPrograms();
    programs.forEach((program) => {
      trackForegroundProgram(program);
    });
  } catch {
    // Ignore cache hydration errors.
  }
};

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
  uIOhook?.stop?.();
});

app.on('before-quit', () => {
  if (iconCacheSaveTimer) {
    clearTimeout(iconCacheSaveTimer);
    iconCacheSaveTimer = null;
  }
  void flushIconCache();
});

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  // Handle both CJS and ESM default exports.
  const electronDebug = require('electron-debug');
  const runDebug = electronDebug?.default ?? electronDebug;
  if (typeof runDebug === 'function') {
    runDebug();
  }
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

const MIN_CHECK_INTERVAL = 1;
const MAX_CHECK_INTERVAL = 60;

const normalizeCheckInterval = (value: unknown) => {
  const numeric = Math.round(Number(value));
  if (!Number.isFinite(numeric)) {
    return settings.checkInterval;
  }
  return Math.min(MAX_CHECK_INTERVAL, Math.max(MIN_CHECK_INTERVAL, numeric));
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

  ipcMain.handle('get-foreground-minutes-records', async (_, duration: any) => {
    return DB.getForegroundMinuteRecords(duration as number);
  });

  ipcMain.handle('get-foreground-hours-records', async (_, duration: any) => {
    return DB.getForegroundHourlyRecords(duration as number);
  });

  ipcMain.handle('get-foreground-days-records', async (_, duration: any) => {
    return DB.getForegroundDailyRecords(duration as number);
  });

  ipcMain.handle('get-background-minutes-records', async (_, duration: any) => {
    return DB.getBackgroundMinuteRecords(duration as number);
  });

  ipcMain.handle('get-background-hours-records', async (_, duration: any) => {
    return DB.getBackgroundHourlyRecords(duration as number);
  });

  ipcMain.handle('get-background-days-records', async (_, duration: any) => {
    return DB.getBackgroundDailyRecords(duration as number);
  });

  ipcMain.handle('get-db-file-size', async () => {
    const p = `${app.getPath('userData')}/data.db`;
    return (await fs.stat(p)).size;
  });

  ipcMain.handle('clean-db-data', async () => {
    await DB.cleanData();
  });

  ipcMain.handle('get-active-window', async () => {
    return getActiveStatus();
  });

  ipcMain.handle('set-titlebar-theme', async (_, isDark: boolean) => {
    if (process.platform !== 'win32') {
      return;
    }
    win.setTitleBarOverlay({
      color: '#00000000',
      symbolColor: isDark ? '#e5e7eb' : '#111827',
      height: 40,
    });
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
    if (!canTrackForeground()) {
      warnActivityTrackingUnavailable();
      settings.recording = false;
      win.webContents.send('recording-changed', settings.recording);
      return;
    }
    if (val === true) {
      uIOhook?.start();
      settings.recording = true;
    } else if (val === false) {
      uIOhook?.stop();
      settings.recording = false;
    } else {
      if (settings.recording) {
        uIOhook?.stop();
      } else {
        uIOhook?.start();
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

  ipcMain.handle('get-check-interval', () => settings.checkInterval);

  ipcMain.handle('set-check-interval', async (_, value: unknown) => {
    const next = normalizeCheckInterval(value);
    if (next === settings.checkInterval) {
      return settings.checkInterval;
    }
    settings.checkInterval = next;
    detectActive();
    win.webContents.send('check-interval-changed', settings.checkInterval);
    return settings.checkInterval;
  });

  ipcMain.handle('get-program-icons', async (_, names: unknown) => {
    if (!Array.isArray(names)) {
      return {};
    }
    const uniqueNames = [
      ...new Set(
        names
          .filter((name): name is string => typeof name === 'string')
          .map((name) => name.trim())
          .filter(Boolean)
      ),
    ];
    if (!uniqueNames.length) {
      return {};
    }
    await refreshWindowsPathCache();
    const result: Record<string, string | null> = {};
    for (const name of uniqueNames) {
      result[name] = await resolveProgramIcon(name);
    }
    return result;
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
  const isWindows = process.platform === 'win32';
  const mainWindow = new BrowserWindow({
    show: false,
    width: 1200,
    height: 820,
    minWidth: 760,
    icon: getAssetPath('icon.png'),
    frame: !isWindows,
    titleBarStyle: isWindows ? 'hidden' : 'default',
    titleBarOverlay: isWindows
      ? {
          color: '#00000000',
          symbolColor: '#111827',
          height: 40,
        }
      : false,
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
  setIpcHandle(mainWindow);
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
    // eslint-disable-next-line no-new
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
  await loadIconCache();
  await DB.sync();
  await loadForegroundPrograms();
  const win = await createWindow();
  setTray(win);
  detectActive();
}

function detectActive() {
  if (!canTrackForeground()) {
    warnActivityTrackingUnavailable();
    return;
  }
  // Reset
  if (data.timer) {
    uIOhook?.stop?.();
    uIOhook?.removeAllListeners?.();
    clearInterval(data.timer);
  }
  let event = new Map();
  function cleanEvent() {
    event = new Map();
  }
  function getEvent() {
    return event;
  }
  const updateForeground = async (
    now: Date,
    program: string,
    seconds: number
  ) => {
    const normalizedProgram = normalizeProgramLabel(program);
    if (!normalizedProgram) {
      return;
    }
    trackForegroundProgram(normalizedProgram);
    void cacheProgramIcon(normalizedProgram);
    const scopes = [
      { scope: 'day', timestamp: getCurDay(now) },
      { scope: 'minute', timestamp: getCurMinute(now) },
      { scope: 'hour', timestamp: getCurHour(now) },
    ] as const;
    await Promise.all(
      scopes.map((item) =>
        DB.incrementForegroundRecord({
          scope: item.scope,
          timestamp: item.timestamp,
          program: normalizedProgram,
          seconds,
        })
      )
    );
  };

  const updateBackground = async (
    now: Date,
    activeProgram: string,
    seconds: number
  ) => {
    if (!foregroundProgramCache.size) {
      return;
    }
    const runningPrograms = await listRunningProcessNames();
    if (!runningPrograms.length) {
      return;
    }
    const activeKey = normalizeProgramName(activeProgram);
    const uniquePrograms = new Map<string, string>();
    runningPrograms.forEach((name) => {
      const trimmed = name.trim();
      const normalized = normalizeProgramName(trimmed);
      if (!normalized) {
        return;
      }
      if (!uniquePrograms.has(normalized)) {
        const label =
          programLabelCache.get(normalized) ?? normalizeProgramLabel(trimmed);
        if (label) {
          uniquePrograms.set(normalized, label);
        }
      }
    });
    const targets = [...uniquePrograms.entries()]
      .filter(([normalized]) => {
        if (!foregroundProgramCache.has(normalized)) {
          return false;
        }
        if (!activeKey) {
          return true;
        }
        return normalized !== activeKey;
      })
      .map(([, name]) => name)
      .filter(Boolean);
    if (!targets.length) {
      return;
    }
    const scopes = [
      { scope: 'day', timestamp: getCurDay(now) },
      { scope: 'minute', timestamp: getCurMinute(now) },
      { scope: 'hour', timestamp: getCurHour(now) },
    ] as const;
    for (const programName of targets) {
      for (const item of scopes) {
        await DB.incrementBackgroundRecord({
          scope: item.scope,
          timestamp: item.timestamp,
          program: programName,
          seconds,
        });
      }
    }
  };

  data.timer = setInterval(async () => {
    try {
      if (!settings.recording) {
        cleanEvent();
        return;
      }
      const eventInfo = getEvent();
      const now = new Date();
      const activeWindowsInfo = await activeWindows().getActiveWindow();
      if (!activeWindowsInfo) {
        cleanEvent();
        return;
      }
      const { program } = await resolveActiveWindowInfo(activeWindowsInfo);
      const seconds = settings.checkInterval;
      if (program) {
        await updateForeground(now, program, seconds);
      }
      await updateBackground(now, program, seconds);
      if (eventInfo.size > 0) {
        const eventType =
          (eventInfo.get('type') ?? 0) > settings.checkInterval
            ? 'type'
            : 'read';
        const scopes = [
          { scope: 'day', timestamp: getCurDay(now) },
          { scope: 'minute', timestamp: getCurMinute(now) },
          { scope: 'hour', timestamp: getCurHour(now) },
        ] as const;
        if (program) {
          await Promise.all(
            scopes.map((item) =>
              DB.incrementActivityRecord({
                scope: item.scope,
                timestamp: item.timestamp,
                program,
                event: eventType,
                seconds,
              })
            )
          );
        }
        cleanEvent();
      }
    } catch (e) {
      console.log(e);
    }
  }, 1000 * settings.checkInterval);
  uIOhook?.on?.('keydown', () => {
    event.set('type', (event.get('type') ?? 0) + 1);
  });
  uIOhook?.on?.('mousedown', () => {
    event.set('read', (event.get('read') ?? 0) + 1);
  });
  uIOhook?.on?.('mousemove', () => {
    event.set('read', (event.get('read') ?? 0) + 1);
  });
  uIOhook?.on?.('wheel', () => {
    event.set('read', (event.get('read') ?? 0) + 1);
  });
  if (settings.recording) {
    uIOhook?.start?.();
  }
}
start().catch(console.log);
