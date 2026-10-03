import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../config/modes.js'
import { sanitizeSettings } from './settings.js'

describe('sanitizeSettings', () => {
  it('keeps every supported value', () => {
    const saved = { mode: 'practice', duration: 15, wordCount: 50, practiceCount: 10, theme: 'cyberpunk' }
    expect(sanitizeSettings(saved)).toEqual(saved)
  })

  it('fills in settings added after the data was saved', () => {
    const fromOlderVersion = { mode: 'words', duration: 15, wordCount: 50, theme: 'dark' }
    expect(sanitizeSettings(fromOlderVersion)).toEqual({ ...fromOlderVersion, practiceCount: DEFAULT_SETTINGS.practiceCount })
  })

  it('falls back to defaults for missing, stale or tampered values', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings('nope')).toEqual(DEFAULT_SETTINGS)
    const tampered = { mode: 'toString', duration: 45, wordCount: '25', practiceCount: 1000, theme: 'neon' }
    expect(sanitizeSettings(tampered)).toEqual(DEFAULT_SETTINGS)
  })
})
