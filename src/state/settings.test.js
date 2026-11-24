import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../config/modes.js'
import { createSettingsStore, sanitizeSettings, STORAGE_KEY } from './settings.js'

/** An in-memory localStorage that records every write. */
function memoryStorage(entries = {}) {
  const data = new Map(Object.entries(entries))
  return {
    data,
    writes: 0,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem(key, value) {
      this.writes++
      data.set(key, String(value))
    },
  }
}

describe('createSettingsStore', () => {
  it('only reads when the app opens, even settings it had to repair', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ theme: 'from-a-newer-version', mode: 'words' }) })
    const store = createSettingsStore(() => storage)
    expect(store.getSnapshot()).toMatchObject({ theme: DEFAULT_SETTINGS.theme, mode: 'words' })
    expect(storage.writes).toBe(0)
  })

  it('saves a change straight away and tells subscribers', () => {
    const storage = memoryStorage()
    const store = createSettingsStore(() => storage)
    const listener = vi.fn()
    store.subscribe(listener)
    store.update({ theme: 'vintage' })
    expect(JSON.parse(storage.data.get(STORAGE_KEY)).theme).toBe('vintage')
    expect(store.getSnapshot().theme).toBe('vintage')
    expect(listener).toHaveBeenCalledOnce()
  })

  it('follows a change made in another tab, without writing it back', () => {
    const storage = memoryStorage()
    const store = createSettingsStore(() => storage)
    storage.data.set(STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, mode: 'quote' }))
    store.reload()
    expect(store.getSnapshot().mode).toBe('quote')
    expect(storage.writes).toBe(0)
  })

  it('still works, for this tab, when storage is blocked', () => {
    const store = createSettingsStore(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(store.getSnapshot()).toEqual(DEFAULT_SETTINGS)
    store.update({ sound: true })
    expect(store.getSnapshot().sound).toBe(true)
  })
})

describe('sanitizeSettings', () => {
  it('keeps every supported value', () => {
    const saved = {
      mode: 'quote',
      duration: 15,
      wordCount: 50,
      quoteLength: 'long',
      practiceCount: 10,
      lesson: 7,
      punctuation: true,
      numbers: true,
      tech: true,
      theme: 'cyberpunk',
      fingerGuide: false,
      paceCaret: false,
      sound: true,
      dailyGoal: 20,
    }
    expect(sanitizeSettings(saved)).toEqual(saved)
  })

  it('fills in settings added after the data was saved', () => {
    const fromOlderVersion = { mode: 'words', duration: 15, wordCount: 50, theme: 'dark' }
    expect(sanitizeSettings(fromOlderVersion)).toEqual({ ...DEFAULT_SETTINGS, ...fromOlderVersion })
  })

  it('falls back to defaults for missing, stale or tampered values', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings('nope')).toEqual(DEFAULT_SETTINGS)
    const tampered = {
      mode: 'toString',
      duration: 45,
      wordCount: '25',
      quoteLength: 'epic',
      practiceCount: 1000,
      lesson: 99,
      punctuation: 'yes',
      sound: 1,
      dailyGoal: 7,
      theme: 'neon',
    }
    expect(sanitizeSettings(tampered)).toEqual(DEFAULT_SETTINGS)
  })
})
