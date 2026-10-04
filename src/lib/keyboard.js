/**
 * Turn a keydown event into what it means for the test. Returns null for keys the test
 * should leave alone, so the browser handles them normally.
 *
 * Kept separate from the hook so the rules are easy to read and to unit-test with plain objects.
 *
 * @param {Pick<KeyboardEvent, 'key' | 'target' | 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey' | 'repeat'>
 *         & { getModifierState?: (key: string) => boolean }} e
 * @param {import('./typingEngine.js').Status} status
 * @returns {null | 'restart' | { type: 'type', char: string } | { type: 'delete', wholeWord: boolean }}
 */
export function keyToAction(e, status) {
  const el = typeof e.target?.closest === 'function' ? e.target : null
  if (el?.closest('input, textarea, select, [contenteditable="true"]')) return null // a form field has focus
  // With nothing focused, keys go to the page itself (<body>). Anything else that has focus
  // (a button, a link, a chart, a <summary>, a scrollable box) is a control: Tab, Enter and
  // Space are its keys, not the test's.
  const onControl = el !== null && el !== el.ownerDocument?.body && el !== el.ownerDocument?.documentElement

  // On Windows, AltGr (used for characters like @ or € on many layouts) reports Ctrl+Alt.
  const altGraph = e.getModifierState?.('AltGraph') ?? false
  const ctrl = e.ctrlKey && !altGraph
  const alt = e.altKey && !altGraph

  if (e.key === 'Tab') {
    // Plain Tab restarts (Monkeytype habit). Shift+Tab, or Tab while a control has focus,
    // stays normal keyboard navigation so the controls remain reachable without a mouse.
    return onControl || e.shiftKey || ctrl || alt ? null : 'restart'
  }
  if (onControl && (e.key === 'Enter' || e.key === ' ')) return null // let the focused control work
  // On the results screen only the restart keys are ours: Space scrolls, / finds, … as usual.
  if (status === 'finished') return e.key === 'Enter' ? 'restart' : null
  // Ctrl+Backspace (Windows, Linux) or Option+Backspace (Mac) deletes the whole word.
  if (e.key === 'Backspace') return e.metaKey ? null : { type: 'delete', wholeWord: ctrl || alt }
  if (e.metaKey || alt || ctrl) return null // OS and browser shortcuts: Ctrl+R, Ctrl+L, Cmd+F …
  if (e.key.length !== 1 || e.repeat) return null // Enter, Shift, arrows, F5, a key being held down
  return { type: 'type', char: e.key }
}
