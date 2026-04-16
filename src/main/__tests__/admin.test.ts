import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('child_process', () => ({
  execSync: vi.fn(),
  spawn: vi.fn(),
}))

vi.mock('electron', () => ({
  app: { quit: vi.fn() },
}))

import { execSync } from 'child_process'
import { checkAdmin } from '../admin'

describe('checkAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when net session succeeds', async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from(''))
    expect(await checkAdmin()).toBe(true)
    expect(execSync).toHaveBeenCalledWith('net session', { stdio: 'pipe' })
  })

  it('returns false when net session throws (non-admin)', async () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('Access denied')
    })
    expect(await checkAdmin()).toBe(false)
  })

  it('returns false when net session throws (any error)', async () => {
    vi.mocked(execSync).mockImplementation(() => {
      const err = new Error('System error 5')
      Object.assign(err, { code: 5 })
      throw err
    })
    expect(await checkAdmin()).toBe(false)
  })
})
