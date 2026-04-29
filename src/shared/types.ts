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
    | 'backup_created'
    | 'complete'
    | 'skip'
    | 'error'
    | 'info'
  message: string
}
