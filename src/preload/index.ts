import { contextBridge, ipcRenderer } from 'electron'
import type { ScanResult, LogEntry } from '../shared/types'

const api = {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  maximize: () => ipcRenderer.send('window:maximize'),

  // Admin
  isAdmin: (): Promise<boolean> => ipcRenderer.invoke('app:is-admin'),

  // Scanner
  scan: (): Promise<{ ok: boolean; results?: ScanResult[]; error?: string }> =>
    ipcRenderer.invoke('scanner:scan'),

  remove: (targets: string[]): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('scanner:remove', targets),

  // Event listeners
  onScanProgress: (cb: (data: { step: string; index: number; total: number }) => void) => {
    ipcRenderer.on('scan:progress', (_event, data) => cb(data))
  },

  onRemovalLog: (cb: (entry: LogEntry) => void) => {
    ipcRenderer.on('removal:log', (_event, entry) => cb(entry))
  },

  onRemovalComplete: (cb: () => void) => {
    ipcRenderer.on('removal:complete', () => cb())
  },

  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },

  exportLog: (content: string): Promise<{ ok: boolean; filePath?: string }> =>
    ipcRenderer.invoke('log:export', content),

  restore: (backupPath: string): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('scanner:restore', backupPath)
}

contextBridge.exposeInMainWorld('api', api)

export type API = typeof api
