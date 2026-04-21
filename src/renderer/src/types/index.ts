import type {
  Category,
  ServiceInfo,
  TaskInfo,
  StartupEntry,
  UninstallEntry,
  ScanResult,
  LogEntry
} from '../../../shared/types'

export type { Category, ServiceInfo, TaskInfo, StartupEntry, UninstallEntry, ScanResult, LogEntry }

export type AppScreen = 'scan' | 'scanning' | 'results' | 'removing' | 'complete'

export type FilterCategory = 'all' | Category

// Window API exposed via preload
declare global {
  interface Window {
    api: {
      minimize: () => void
      close: () => void
      maximize: () => void
      isAdmin: () => Promise<boolean>
      scan: () => Promise<{ ok: boolean; results?: ScanResult[]; error?: string }>
      remove: (targets: string[]) => Promise<{ ok: boolean; error?: string }>
      onScanProgress: (cb: (data: { step: string; index: number; total: number }) => void) => void
      onRemovalLog: (cb: (entry: LogEntry) => void) => void
      onRemovalComplete: (cb: () => void) => void
      removeAllListeners: (channel: string) => void
      exportLog: (content: string) => Promise<{ ok: boolean; filePath?: string }>
    }
  }
}
