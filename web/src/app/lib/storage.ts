import { DEFAULT_SETTINGS, getProvider } from './providers'
import type { Settings } from './types'

/**
 * localStorage can throw on access inside a sandboxed iframe (the preview
 * environment), so every read/write is guarded and falls back to memory.
 */
const memory = new Map<string, string>()

const KEY = 'itch-solver-zero.settings.v2'
const PROBLEM_KEY = 'itch-solver-zero.problem.v2'

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return memory.get(key) ?? null
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    memory.set(key, value)
  }
}

export function loadSettings(): Settings {
  const raw = read(KEY)
  if (!raw) return { ...DEFAULT_SETTINGS }
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>
    const merged: Settings = { ...DEFAULT_SETTINGS, ...parsed }
    // Guard against a stale provider id after an upgrade.
    const provider = getProvider(merged.providerId)
    if (!provider.models.includes(merged.model) && provider.id !== 'custom') {
      merged.model = provider.defaultModel
    }
    return merged
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings) {
  write(KEY, JSON.stringify(settings))
}

export function loadProblem(): string {
  return read(PROBLEM_KEY) ?? ''
}

export function saveProblem(problem: string) {
  write(PROBLEM_KEY, problem)
}

export function hasSavedKey(settings: Settings) {
  return !settings.demoMode && settings.apiKey.trim().length > 0
}
