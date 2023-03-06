import { app, BrowserWindow, ipcMain } from 'electron'
import { uIOhook } from 'uiohook-napi'
import { getSystemInfo } from '../utils'
import { listMinutelyRecords, listRawRecords } from '../db'
import { settings } from './setings'
import { join } from 'path'

export function setIpcHandle (win: BrowserWindow) {
  ipcMain.removeAllListeners()
  ipcMain.handle('ready', async () => {
    const systemInfo = getSystemInfo()
    return { systemInfo }
  })

  const url = process.env.VITE_DEV_SERVER_URL
  const indexHtml = join(process.env.DIST, 'index.html')
  const preload = join(__dirname, '../preload/index.js')
  // New window example arg: new windows url
  ipcMain.handle('open-win', (_, arg) => {
    const childWindow = new BrowserWindow({
      webPreferences: {
        preload,
        nodeIntegration: true,
        contextIsolation: false,
      },
    })

    if (process.env.VITE_DEV_SERVER_URL) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      void childWindow.loadURL(`${url}#${arg}`)
    } else {
      void childWindow.loadFile(indexHtml, { hash: arg })
    }
  })

  ipcMain.handle('list-minutely-records', async (_, duration: number) => {
    return await listMinutelyRecords(duration)
  })

  ipcMain.handle('list-raw-records', async (_, duration: number) => {
    return await listRawRecords(duration)
  })

  ipcMain.handle('set-login-settings', async (_, val) => {
    app.setLoginItemSettings({
      openAtLogin: val,
      openAsHidden: val,
    })
    win.webContents.send(
      'login-item-setting-changed',
      app.getLoginItemSettings(),
    )
  })
  ipcMain.handle('toggle-record', (_, val) => {
    if (val === true) {
      uIOhook.start()
      settings.recording = true
    } else if (val === false) {
      uIOhook.stop()
      settings.recording = false
    } else {
      if (settings.recording) {
        uIOhook.stop()
      } else {
        uIOhook.start()
      }
      settings.recording = !settings.recording
    }
    win.webContents.send('recording-changed', settings.recording)
  })

  ipcMain.handle('get-login-item-settings', () => {
    win.webContents.send(
      'login-item-setting-changed',
      app.getLoginItemSettings(),
    )
  })
}
