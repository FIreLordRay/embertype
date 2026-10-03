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
  const onControl = el?.closest('button, a[href]') != null

  // On Windows, AltGr (used for characters like @ or € on many layouts) reports Ctrl+Alt.
  const altGraph = e.getModifierState?.('AltGraph') ?? false
  const ctrl = e.ctrlKey && !altGraph
  const alt = e.altKey && !altGraph

  if (e.key === 'Tab') {
    // Plain Tab restarts (Monkeytype habit). Shift+Tab, or Tab while a button has focus,
    // stays normal keyboard navigation so the controls remain reachable without a mouse.
    return onControl || e.shiftKey || ctrl || alt ? null : 'restart'
  }
  if (onControl && (e.key === 'Enter' || e.key === ' ')) return null // let the focused button work
  if (e.key === 'Enter') return status === 'finished' ? 'restart' : null
  if (e.metaKey || alt) return null // OS and browser shortcuts
  if (e.key === 'Backspace') return { type: 'delete', wholeWord: ctrl }
  if (ctrl) return null // Ctrl+R, Ctrl+L … stay browser shortcuts
  if (e.key.length !== 1 || e.repeat) return null // Shift, arrows, F5, a key being held down
  return { type: 'type', char: e.key }
}
