import { describe, expect, it } from 'vitest'
import { keyToAction } from './keyboard.js'

/** A fake keydown event: no modifiers, target = the page itself. */
const key = (k, extra = {}) => ({
  key: k,
  target: null,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  shiftKey: false,
  repeat: false,
  getModifierState: () => false,
  ...extra,
})

/** A fake element for which el.closest(selectors) matches only `tag`. */
const focused = (tag) => ({
  closest: (selectors) => (selectors.split(',').map((s) => s.trim()).includes(tag) ? {} : null),
})

describe('keyToAction', () => {
  it('types printable characters, including space', () => {
    expect(keyToAction(key('a'), 'idle')).toEqual({ type: 'type', char: 'a' })
    expect(keyToAction(key(' '), 'running')).toEqual({ type: 'type', char: ' ' })
  })

  it('maps Backspace and Ctrl+Backspace to deletes', () => {
    expect(keyToAction(key('Backspace'), 'running')).toEqual({ type: 'delete', wholeWord: false })
    expect(keyToAction(key('Backspace', { ctrlKey: true }), 'running')).toEqual({ type: 'delete', wholeWord: true })
  })

  it('restarts on Tab but keeps Shift+Tab and Tab-on-a-button for keyboard navigation', () => {
    expect(keyToAction(key('Tab'), 'running')).toBe('restart')
    expect(keyToAction(key('Tab', { shiftKey: true }), 'running')).toBeNull()
    expect(keyToAction(key('Tab', { target: focused('button') }), 'running')).toBeNull()
  })

  it('restarts on Enter only from the results screen', () => {
    expect(keyToAction(key('Enter'), 'running')).toBeNull()
    expect(keyToAction(key('Enter'), 'finished')).toBe('restart')
  })

  it('leaves browser shortcuts alone', () => {
    expect(keyToAction(key('r', { ctrlKey: true }), 'running')).toBeNull()
    expect(keyToAction(key('l', { metaKey: true }), 'running')).toBeNull()
    expect(keyToAction(key('ArrowLeft'), 'running')).toBeNull()
    expect(keyToAction(key('Shift'), 'running')).toBeNull()
  })

  it('still types AltGr characters (reported as Ctrl+Alt on Windows)', () => {
    const altGr = key('@', { ctrlKey: true, altKey: true, getModifierState: (m) => m === 'AltGraph' })
    expect(keyToAction(altGr, 'running')).toEqual({ type: 'type', char: '@' })
  })

  it('ignores a key being held down', () => {
    expect(keyToAction(key('a', { repeat: true }), 'running')).toBeNull()
  })

  it('stays out of the way of form fields and focused buttons', () => {
    expect(keyToAction(key('a', { target: focused('input') }), 'running')).toBeNull()
    expect(keyToAction(key(' ', { target: focused('button') }), 'running')).toBeNull()
    expect(keyToAction(key('Enter', { target: focused('button') }), 'finished')).toBeNull()
    // …but letters still go to the test (the hook then moves focus off the button)
    expect(keyToAction(key('a', { target: focused('button') }), 'running')).toEqual({ type: 'type', char: 'a' })
  })
})
