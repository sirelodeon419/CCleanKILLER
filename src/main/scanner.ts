import { spawn } from 'child_process'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import type { ScanResult, LogEntry } from '../shared/types'

function getScannerPath(): string {
  if (is.dev) {
    return join(process.cwd(), 'resources', 'scanner.ps1')
  }
  return join(process.resourcesPath, 'scanner.ps1')
}

function getRulesPath(): string {
  if (is.dev) {
    return join(process.cwd(), 'resources', 'rules.json')
  }
  return join(process.resourcesPath, 'rules.json')
}

export function runScan(
  onProgress: (step: string, index: number, total: number) => void
): Promise<ScanResult[]> {
  return new Promise((resolve, reject) => {
    const scannerPath = getScannerPath()
    const rulesPath = getRulesPath()

    const ps = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      scannerPath,
      '-Action',
      'scan',
      '-RulesPath',
      rulesPath
    ])

    let stdout = ''
    let stderr = ''

    ps.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString()
      // PROGRESS lines are complete lines — strip them out, accumulate rest raw
      chunk.split('\n').forEach((line) => {
        if (line.startsWith('PROGRESS:')) {
          const parts = line.trim().split(':')
          // parts: [PROGRESS, index, total, ...name fragments]
          if (parts.length >= 4) {
            onProgress(parts.slice(3).join(':'), parseInt(parts[1]), parseInt(parts[2]))
          }
        } else {
          // Accumulate raw — do NOT re-add \n, it would corrupt JSON split across chunks
          stdout += line
        }
      })
    })

    ps.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    ps.on('close', (code) => {
      const trimmed = stdout.trim()
      if (!trimmed) {
        reject(new Error(`Scanner produced no output. Exit: ${code}. Stderr: ${stderr}`))
        return
      }
      try {
        const results = JSON.parse(trimmed)
        resolve(Array.isArray(results) ? results : [])
      } catch (e) {
        reject(new Error(`Failed to parse scan results: ${e}\nOutput: ${trimmed.slice(0, 500)}`))
      }
    })

    ps.on('error', (err) => {
      reject(new Error(`Failed to start scanner: ${err.message}`))
    })
  })
}

export function runRestore(backupPath: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const scannerPath = getScannerPath()
    const rulesPath = getRulesPath()

    const ps = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      scannerPath,
      '-Action',
      'restore',
      '-RulesPath',
      rulesPath,
      '-Targets',
      backupPath
    ])

    let output = ''
    ps.stdout.on('data', (data: Buffer) => { output += data.toString() })
    ps.stderr.on('data', (data: Buffer) => { output += data.toString() })

    ps.on('close', () => {
      if (output.includes('RESTORE_OK')) {
        resolve({ ok: true })
      } else {
        const msg = output.match(/RESTORE_FAILED:(.+)/)?.[1]?.trim() ?? 'Unknown error'
        resolve({ ok: false, error: msg })
      }
    })

    ps.on('error', (err) => {
      resolve({ ok: false, error: err.message })
    })
  })
}

export function runRemoval(
  targets: string[],
  onLog: (entry: LogEntry) => void,
  onDone: () => void
): void {
  const scannerPath = getScannerPath()
  const rulesPath = getRulesPath()

  const ps = spawn('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    scannerPath,
    '-Action',
    'remove',
    '-RulesPath',
    rulesPath,
    '-Targets',
    targets.join(',')
  ])

  let buffer = ''

  ps.stdout.on('data', (data: Buffer) => {
    buffer += data.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const entry = JSON.parse(trimmed) as LogEntry
        onLog(entry)
      } catch {
        // Non-JSON line — ignore
      }
    }
  })

  ps.on('close', () => {
    // Flush any remaining buffer
    if (buffer.trim()) {
      try {
        const entry = JSON.parse(buffer.trim()) as LogEntry
        onLog(entry)
      } catch {
        // ignore
      }
    }
    onDone()
  })

  ps.on('error', (err) => {
    onLog({
      target: 'system',
      action: 'error',
      message: `Failed to start removal engine: ${err.message}`
    })
    onDone()
  })
}
