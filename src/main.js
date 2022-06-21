const { app, BrowserWindow, Menu, Tray, ipcMain } = require("electron");
const dev = app.commandLine.getSwitchValue("env") === "dev";
const path = require("path");
const os = require("os");
const { uIOhook } = require("@jannchie/uiohook-napi");
const cron = require("node-cron");
const sqlite3 = require("sqlite3");
const activeWindows = require("@jannchie/active-window");
const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = new Sequelize({
  dialect: "sqlite",
  dialectModule: sqlite3,
  storage: app.getAppPath() + "/data.db",
});
class MinuteRecord extends Model {}
MinuteRecord.init(
  {
    program: DataTypes.STRING,
    title: DataTypes.STRING,
    event: DataTypes.STRING,
    timestamp: DataTypes.DATE,
    seconds: DataTypes.INTEGER,
  },
  { sequelize }
);

let secondData = new Map();

const settings = {
  recording: true,
  checkInterval: 5,
  theme: "system",
  language: "en",
};

function getSystemInfo() {
  return {
    platform: os.platform(),
    memory: os.totalmem(),
    version: os.version(),
  };
}

async function start() {
  await app.whenReady();
  await sequelize.sync();
  const win = createWindow();
  setIpcHandle(win);
  detectActive(win);
  setTray(app, win);
  if (dev) {
    win.webContents.openDevTools();
  }
}

function setIpcHandle(win) {
  ipcMain.handle("ready", async () => {
    const systemInfo = getSystemInfo();
    return { systemInfo };
  });
  ipcMain.handle("hide", async () => {
    win.hide();
  });
  ipcMain.handle("quit", async () => {
    app.quit();
  });
  ipcMain.handle("toggle-record", (sender, val) => {
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
    win.webContents.send("recording-changed", settings.recording);
  });
}

function setTray(app, mainWindow) {
  const trayMenuTemplate = [
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ];
  const iconPath = path.join(__dirname, "./a.png");
  const appTray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
  mainWindow.show();
  appTray.setToolTip("never forget");
  appTray.setContextMenu(contextMenu);
  appTray.on("click", () => {
    mainWindow.show();
  });
  return appTray;
}

function detectActive(win) {
  let event = new Map();
  cron.schedule("* * * * *", async (now) => {
    const curDatetime = new Date(now - 1 * 60 * 1000 - (now % (1000 * 60)));
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
          (event.get("type") ?? 0) > settings.checkInterval ? "type" : "read";
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
        win.webContents.send("active-event", {
          event: event,
          activeWindowsInfo,
        });
        event = new Map();
      }
    } catch (e) {
      console.log(e);
    }
  }, 1000 * settings.checkInterval);
  uIOhook.on("keydown", (e) => {
    event.set("type", (event.get("type") ?? 0) + 1);
  });
  uIOhook.on("mousedown", (e) => {
    event.set("read", (event.get("read") ?? 0) + 1);
  });
  uIOhook.on("mousemove", (e) => {
    event.set("read", (event.get("read") ?? 0) + 1);
  });
  uIOhook.on("wheel", () => {
    event.set("read", (event.get("read") ?? 0) + 1);
  });
  uIOhook.start();
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line global-require
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    icon: path.join(__dirname, "./logo.png"),
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    webPreferences: {
      // eslint-disable-next-line no-undef
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  // eslint-disable-next-line no-undef
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  return mainWindow;
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    start();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
start();
