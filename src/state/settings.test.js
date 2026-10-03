import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../config/modes.js'
import { sanitizeSettings } from './settings.js'

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
