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
  const execPath = process.execPath
  const args = process.argv.slice(1)
  const argStr = args.map((a) => `"${a}"`).join(' ')

  spawn(
    'powershell.exe',
    ['-Command', `Start-Process -FilePath "${execPath}" -ArgumentList "${argStr}" -Verb RunAs`],
    { detached: true, stdio: 'ignore' }
  ).unref()

  app.quit()
}
