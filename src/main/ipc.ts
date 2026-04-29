import { ipcMain, BrowserWindow } from 'electron'
import { runScan, runRemoval, runRestore } from './scanner'
import { checkAdmin } from './admin'

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  // Window controls
  ipcMain.on('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.on('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  ipcMain.on('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  // Admin check
  ipcMain.handle('app:is-admin', async () => {
    return checkAdmin()
  })

  // Scan
  ipcMain.handle('scanner:scan', async () => {
    try {
      const results = await runScan((step, index, total) => {
        getWindow()?.webContents.send('scan:progress', { step, index, total })
      })
      return { ok: true, results }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })

  // Log export
  ipcMain.handle('log:export', async (_event, content: string) => {
    const { dialog } = await import('electron')
    const { writeFile } = await import('fs/promises')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Export Removal Log',
      defaultPath: `ccleankiller-log-${timestamp}.txt`,
      filters: [{ name: 'Text Files', extensions: ['txt'] }]
    })
    if (canceled || !filePath) return { ok: false }
    await writeFile(filePath, content, 'utf-8')
    return { ok: true, filePath }
  })

  // Restore registry from backup
  ipcMain.handle('scanner:restore', async (_event, backupPath: string) => {
    try {
      return await runRestore(backupPath)
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })

  // Remove
  ipcMain.handle('scanner:remove', async (_event, targets: string[]) => {
    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
      runRemoval(
        targets,
        (entry) => {
          getWindow()?.webContents.send('removal:log', entry)
        },
        () => {
          getWindow()?.webContents.send('removal:complete')
          resolve({ ok: true })
        }
      )
    })
  })
}
