/**
 * Test-only helpers for driving the engine with readable keystroke scripts.
 * (Not imported by the app, so it never ends up in the production bundle.)
 */
import { typingReducer } from './typingEngine.js'

const BACKSPACE = '⌫'
const CTRL_BACKSPACE = '⇤'

/**
 * Spread a script of keys evenly in time. '⌫' = Backspace, '⇤' = Ctrl+Backspace.
 *   keys('teh⌫', 1000, 100) → [['t', 1000], ['e', 1100], ['h', 1200], ['⌫', 1300]]
 *
 * @param {string} script
 * @param {number} [start=1000] timestamp of the first key, in ms
 * @param {number} [gap=100]    ms between keys
 * @returns {[string, number][]}
 */
export function keys(script, start = 1000, gap = 100) {
  return [...script].map((key, i) => [key, start + i * gap])
}

/**
 * Run [key, timestamp] pairs through the reducer, exactly as the keyboard hook would.
 *
 * @param {import('./typingEngine.js').EngineState} state
 * @param {[string, number][]} steps
 */
export function play(state, steps) {
  return steps.reduce((current, [key, at]) => {
    if (key === BACKSPACE) return typingReducer(current, { type: 'delete', wholeWord: false, at })
    if (key === CTRL_BACKSPACE) return typingReducer(current, { type: 'delete', wholeWord: true, at })
    return typingReducer(current, { type: 'type', char: key, at })
  }, state)
}
