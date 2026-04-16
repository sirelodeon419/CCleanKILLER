import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}))

vi.mock('@electron-toolkit/utils', () => ({
  is: { dev: false },
}))

import { spawn } from 'child_process'
import { runScan, runRemoval } from '../scanner'

/** Build a fake child_process object with stdout/stderr emitters */
function createMockProcess() {
  const proc = new EventEmitter() as ReturnType<typeof spawn>
  ;(proc as unknown as { stdout: EventEmitter; stderr: EventEmitter }).stdout = new EventEmitter()
  ;(proc as unknown as { stdout: EventEmitter; stderr: EventEmitter }).stderr = new EventEmitter()
  return proc
}

function getStreams(proc: ReturnType<typeof spawn>) {
  const p = proc as unknown as { stdout: EventEmitter; stderr: EventEmitter }
  return { stdout: p.stdout, stderr: p.stderr }
}

describe('runScan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves with parsed scan results', async () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const results = [{ Id: 'ccleaner', Name: 'CCleaner', IsDetected: true }]
    const promise = runScan(vi.fn())

    getStreams(mockProc).stdout.emit('data', Buffer.from(JSON.stringify(results)))
    mockProc.emit('close', 0)

    expect(await promise).toEqual(results)
  })

  it('returns empty array when JSON root is not an array', async () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const promise = runScan(vi.fn())
    getStreams(mockProc).stdout.emit('data', Buffer.from('{}'))
    mockProc.emit('close', 0)

    expect(await promise).toEqual([])
  })

  it('calls onProgress for PROGRESS lines', async () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const onProgress = vi.fn()
    const results = [{ Id: 'test', IsDetected: false }]
    const promise = runScan(onProgress)

    getStreams(mockProc).stdout.emit(
      'data',
      Buffer.from('PROGRESS:1:10:Scanning CCleaner\n' + JSON.stringify(results))
    )
    mockProc.emit('close', 0)

    await promise
    expect(onProgress).toHaveBeenCalledWith('Scanning CCleaner', 1, 10)
  })

  it('handles PROGRESS lines with colons in the name', async () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const onProgress = vi.fn()
    const results: unknown[] = []
    const promise = runScan(onProgress)

    // Name contains a colon: "CCleaner: Browser"
    getStreams(mockProc).stdout.emit(
      'data',
      Buffer.from('PROGRESS:3:10:CCleaner: Browser\n' + JSON.stringify(results))
    )
    mockProc.emit('close', 0)

    await promise
    expect(onProgress).toHaveBeenCalledWith('CCleaner: Browser', 3, 10)
  })

  it('rejects when scanner produces no output', async () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const promise = runScan(vi.fn())
    getStreams(mockProc).stderr.emit('data', Buffer.from('PowerShell error'))
    mockProc.emit('close', 1)

    await expect(promise).rejects.toThrow('Scanner produced no output')
  })

  it('rejects when output is not valid JSON', async () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const promise = runScan(vi.fn())
    getStreams(mockProc).stdout.emit('data', Buffer.from('not valid json'))
    mockProc.emit('close', 0)

    await expect(promise).rejects.toThrow('Failed to parse scan results')
  })

  it('rejects on spawn error', async () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const promise = runScan(vi.fn())
    mockProc.emit('error', new Error('ENOENT: powershell.exe not found'))

    await expect(promise).rejects.toThrow('Failed to start scanner')
  })
})

describe('runRemoval', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('streams log entries line-by-line and calls onDone', () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const onLog = vi.fn()
    const onDone = vi.fn()
    runRemoval(['ccleaner'], onLog, onDone)

    const entry = { target: 'ccleaner', action: 'removed', message: 'Deleted folder' }
    getStreams(mockProc).stdout.emit('data', Buffer.from(JSON.stringify(entry) + '\n'))
    mockProc.emit('close', 0)

    expect(onLog).toHaveBeenCalledWith(entry)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('flushes a trailing non-newline-terminated JSON line on close', () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const onLog = vi.fn()
    const onDone = vi.fn()
    runRemoval(['ccleaner'], onLog, onDone)

    // No trailing newline — should be flushed on close
    const entry = { target: 'ccleaner', action: 'done', message: 'Complete' }
    getStreams(mockProc).stdout.emit('data', Buffer.from(JSON.stringify(entry)))
    mockProc.emit('close', 0)

    expect(onLog).toHaveBeenCalledWith(entry)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('ignores non-JSON lines without crashing', () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const onLog = vi.fn()
    const onDone = vi.fn()
    runRemoval(['ccleaner'], onLog, onDone)

    getStreams(mockProc).stdout.emit('data', Buffer.from('debug output\n'))
    mockProc.emit('close', 0)

    expect(onLog).not.toHaveBeenCalled()
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('handles multiple JSON entries in a single data chunk', () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const onLog = vi.fn()
    const onDone = vi.fn()
    runRemoval(['ccleaner'], onLog, onDone)

    const e1 = { target: 'ccleaner', action: 'removed', message: 'Registry key deleted' }
    const e2 = { target: 'ccleaner', action: 'removed', message: 'Service stopped' }
    getStreams(mockProc).stdout.emit(
      'data',
      Buffer.from(JSON.stringify(e1) + '\n' + JSON.stringify(e2) + '\n')
    )
    mockProc.emit('close', 0)

    expect(onLog).toHaveBeenCalledTimes(2)
    expect(onLog).toHaveBeenNthCalledWith(1, e1)
    expect(onLog).toHaveBeenNthCalledWith(2, e2)
  })

  it('reports spawn errors as log entries and calls onDone', () => {
    const mockProc = createMockProcess()
    vi.mocked(spawn).mockReturnValue(mockProc)

    const onLog = vi.fn()
    const onDone = vi.fn()
    runRemoval(['ccleaner'], onLog, onDone)

    mockProc.emit('error', new Error('ENOENT'))

    expect(onLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'error', target: 'system' })
    )
    expect(onDone).toHaveBeenCalledOnce()
  })
})
