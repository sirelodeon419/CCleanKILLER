import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'
import { checkAdmin, relaunchAsAdmin } from './admin'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 660,
    minWidth: 820,
    minHeight: 580,
    show: false,
    frame: false,
    backgroundColor: '#090909',
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  // On Windows, check for admin and prompt to elevate (skipped in dev — run terminal as admin if needed)
  if (process.platform === 'win32' && !is.dev) {
    const isAdmin = await checkAdmin()
    if (!isAdmin) {
      const { dialog } = await import('electron')
      const result = await dialog.showMessageBox({
        type: 'warning',
        title: 'CCleanKILLER — Administrator Required',
        message: 'CCleanKILLER requires administrator privileges to remove software and modify the registry.',
        buttons: ['Relaunch as Administrator', 'Continue Anyway'],
        defaultId: 0
      })
      if (result.response === 0) {
        relaunchAsAdmin()
        return
      }
    }
  }

  createWindow()
  registerIpcHandlers(() => mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
