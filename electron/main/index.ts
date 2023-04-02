import { app, BrowserWindow, shell, Tray, Menu } from 'electron'
import { release, platform } from 'node:os'
import { join } from 'node:path'
import activeWindow from '@jannchie/active-window'
import { uIOhook } from 'uiohook-napi'
import { throttle } from '../utils'
import { insertRawRecord } from '../db'
import { setIpcHandle } from './setIpcHandle'
const activeW = activeWindow()

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '../')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow () {
  const preload = join(__dirname, '../preload/index.js')
  win = new BrowserWindow({
    title: 'Active Time',
    titleBarStyle: 'hidden',
    backgroundColor: 'hsl(240, 5%, 10%)',
    titleBarOverlay: {
      color: 'hsl(240, 5%, 10%)',
      symbolColor: '#888',
    },
    icon: join(process.env.PUBLIC, 'icon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    void win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    void win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  return win
}

function show (win: BrowserWindow) {
  win.show()
  win.focus()
}

function hide (win: BrowserWindow) {
  win.hide()
}

function exit (win: BrowserWindow) {
  win.destroy()
  app.quit()
}

function setTray (win: BrowserWindow) {
  const trayMenuTemplate = [
    {
      label: 'Show',
      click: () => {
        show(win)
      },
    },
    {
      label: 'Hide',
      click: () => {
        hide(win)
      },
    },
    {
      label: 'Exit',
      click: () => {
        exit(win)
      },
    },
  ]

  // If the platform is OSX, we need to use template icons.
  const iconPath = join(process.env.PUBLIC,
    platform() === 'darwin' ? 'TrayTemplate.png' : 'Tray.png',
  )
  const appTray = new Tray(iconPath)
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate)
  appTray.setToolTip('Active Time')
  appTray.setContextMenu(contextMenu)

  // In darwin, the click event will pop up the context menu rather than show the window.
  if (process.platform !== 'darwin') {
    appTray.on('click', () => {
      show(win)
    })
  }

  return appTray
}

async function start () {
  await app.whenReady()
  // await DB.sync()
  const win = await createWindow()
  setTray(win)
  setIpcHandle(win)
}

const saveData = throttle(() => {
  void activeW.getActiveWindow().then(w => {
    const data = {
      name: w.windowClass,
      title: w.windowName,
      timestamp: new Date(),
    }
    void insertRawRecord(data)
  })
}, 1000)

function detectActive () {
  uIOhook.stop()
  uIOhook.removeAllListeners()
  uIOhook.start()
  uIOhook.on('keydown', () => {
    saveData()
  })
  uIOhook.on('mousemove', () => {
    saveData()
  })
}

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    void createWindow()
  }
})

process.on('exit', () => {
  uIOhook.stop()
  uIOhook.removeAllListeners()
})

// eslint-disable-next-line no-console
start().then(() => {
  detectActive()
// eslint-disable-next-line no-console
}).catch(console.error)
