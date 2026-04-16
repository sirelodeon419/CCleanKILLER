import { execSync, spawn } from 'child_process'
import { app } from 'electron'

export async function checkAdmin(): Promise<boolean> {
  try {
    execSync('net session', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export function relaunchAsAdmin(): void {
  const execPath = process.execPath.replace(/'/g, "''")
  const args = process.argv.slice(1)
  const argList =
    args.length > 0
      ? `-ArgumentList ${args.map((a) => `'${a.replace(/'/g, "''")}'`).join(',')}`
      : ''

  spawn(
    'powershell.exe',
    ['-Command', `Start-Process -FilePath '${execPath}' ${argList} -Verb RunAs`],
    { detached: true, stdio: 'ignore' }
  ).unref()

  app.quit()
}
