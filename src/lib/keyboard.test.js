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

/** A fake <body>: where keys go when nothing has focus. */
const body = { closest: () => null }
body.ownerDocument = { body, documentElement: {} }

describe('keyToAction', () => {
  it('types printable characters, including space', () => {
    expect(keyToAction(key('a'), 'idle')).toEqual({ type: 'type', char: 'a' })
    expect(keyToAction(key(' '), 'running')).toEqual({ type: 'type', char: ' ' })
  })

  it('maps Backspace to a delete, and Ctrl or Option+Backspace to a whole-word delete', () => {
    expect(keyToAction(key('Backspace'), 'running')).toEqual({ type: 'delete', wholeWord: false })
    expect(keyToAction(key('Backspace', { ctrlKey: true }), 'running')).toEqual({ type: 'delete', wholeWord: true })
    expect(keyToAction(key('Backspace', { altKey: true }), 'running')).toEqual({ type: 'delete', wholeWord: true }) // Mac
    expect(keyToAction(key('Backspace', { metaKey: true }), 'running')).toBeNull() // Cmd+Backspace stays the OS's
  })

  it('treats <body> as the page itself', () => {
    expect(keyToAction(key('Tab', { target: body }), 'running')).toBe('restart')
    expect(keyToAction(key(' ', { target: body }), 'running')).toEqual({ type: 'type', char: ' ' })
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

  it('leaves Tab, Enter and Space to any focused control, not just buttons and links', () => {
    // Recharts makes charts focusable; <summary> opens the per-second table.
    for (const control of [focused('svg'), focused('summary')]) {
      expect(keyToAction(key('Tab', { target: control }), 'finished')).toBeNull()
      expect(keyToAction(key('Enter', { target: control }), 'finished')).toBeNull()
      expect(keyToAction(key(' ', { target: control }), 'finished')).toBeNull()
    }
  })

  it('on the results screen, handles only the restart keys', () => {
    expect(keyToAction(key('Tab'), 'finished')).toBe('restart')
    expect(keyToAction(key('Enter'), 'finished')).toBe('restart')
    // Space scrolls the page, / and ' open Firefox's quick find, Backspace does nothing.
    for (const k of [' ', 'a', '/', "'", 'Backspace']) expect(keyToAction(key(k), 'finished')).toBeNull()
  })
})
