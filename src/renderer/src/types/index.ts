export type Category = 'Core' | 'Bundled' | 'Piriform' | 'Offer' | 'Telemetry' | 'PUP'

export interface ServiceInfo {
  Name: string
  DisplayName: string
  Status: string
}

export interface TaskInfo {
  Name: string
  State: string
}

export interface StartupEntry {
  Name: string
  Location: string
  Value?: string
}

export interface UninstallEntry {
  DisplayName: string
  UninstallString?: string
  QuietUninstallString?: string
}

export interface ScanResult {
  Id: string
  Name: string
  Vendor?: string
  Category: Category
  DetectOnly: boolean
  Note?: string
  IsDetected: boolean
  TotalSizeBytes: number
  FoundPaths: string[]
  FoundRegistryKeys: string[]
  FoundServices: ServiceInfo[]
  FoundScheduledTasks: TaskInfo[]
  FoundStartupEntries: StartupEntry[]
  FoundUninstallEntries: UninstallEntry[]
}

export interface LogEntry {
  target: string
  action:
    | 'start'
    | 'service_stopped'
    | 'service_removed'
    | 'process_killed'
    | 'uninstall_attempt'
    | 'uninstall_complete'
    | 'task_removed'
    | 'startup_removed'
    | 'path_removed'
    | 'registry_removed'
    | 'complete'
    | 'skip'
    | 'error'
    | 'info'
  message: string
}

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
