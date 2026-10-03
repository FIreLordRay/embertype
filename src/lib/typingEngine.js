/**
 * The typing engine: a pure state machine, written as a React reducer.
 *
 *     idle ──first keystroke──▶ running ──last character typed / time up──▶ finished
 *
 * "Pure" means no DOM, no timers and no clock reads. Every action carries its own timestamp
 * (`at`, from performance.now()), so the same actions always produce the same state. That's
 * what lets typingEngine.test.js check every rule without a browser.
 */

/** @typedef {'idle' | 'running' | 'finished'} Status */

/**
 * The input log: one entry per keystroke that changed the text, in order. It is the complete
 * history of a test. Live stats, the results chart and the missed-keys list are all computed
 * from it (see metrics.js), so no derived number ever has to be stored or kept in sync.
 *
 * @typedef {{ type: 'char', t: number, expected: string, actual: string }
 *         | { type: 'delete', t: number, count: number }} InputEvent
 *   t = milliseconds since the first keystroke
 */

/**
 * @typedef {Object} EngineState
 * @property {string | null} id       identifies this test, so its result is saved exactly once
 * @property {Status} status
 * @property {string} target          the text to type: the words joined by single spaces
 * @property {string} typed           what has been typed so far; the cursor is typed.length
 * @property {number | null} timeLimitMs   time mode only (null in words mode)
 * @property {number | null} startedAt     performance.now() of the first keystroke
 * @property {number | null} endedAt
 * @property {InputEvent[]} log
 */

/**
 * @typedef {{ type: 'type', char: string, at: number }
 *         | { type: 'delete', wholeWord: boolean, at: number }
 *         | { type: 'timeUp' }} EngineAction
 */

/**
 * @param {{ words: string[], timeLimitMs?: number | null, id?: string | null }} options
 * @returns {EngineState}
 */
export function createInitialState({ words, timeLimitMs = null, id = null }) {
  return {
    id,
    status: 'idle',
    target: words.join(' '),
    typed: '',
    timeLimitMs,
    startedAt: null,
    endedAt: null,
    log: [],
  }
}

/**
 * @param {EngineState} state
 * @param {EngineAction} action
 * @returns {EngineState}
 */
export function typingReducer(state, action) {
  switch (action.type) {
    case 'type':
      return typeChar(state, action.char, action.at)
    case 'delete':
      return deleteBack(state, action.wholeWord, action.at)
    case 'timeUp':
      if (state.status !== 'running' || state.timeLimitMs == null) return state
      return finish(state, state.startedAt + state.timeLimitMs)
    default:
      throw new Error(`Unknown engine action: ${action.type}`)
  }
}

/**
 * Where Ctrl+Backspace deletes back to: the start of the word before the cursor.
 * Word boundaries come from the target text, so a mistyped space can't confuse them.
 *
 * @param {string} target
 * @param {number} cursor
 */
export function wordStartBefore(target, cursor) {
  let i = cursor
  while (i > 0 && target[i - 1] === ' ') i-- // step back over the space just passed…
  while (i > 0 && target[i - 1] !== ' ') i-- // …then over the word itself
  return i
}

function typeChar(state, char, at) {
  if (state.status === 'finished') return state

  const startedAt = state.startedAt ?? at // the first keystroke starts the clock

  // A key that lands after the deadline doesn't count, even if the timer's callback runs late.
  if (isPastDeadline(state.timeLimitMs, startedAt, at)) {
    return finish(state, startedAt + state.timeLimitMs)
  }

  const typed = state.typed + char
  const next = {
    ...state,
    status: 'running',
    startedAt,
    typed,
    log: [
      ...state.log,
      { type: 'char', t: at - startedAt, expected: state.target[state.typed.length], actual: char },
    ],
  }

  // Reaching the end of the text finishes the test (that's how words mode ends).
  return typed.length === state.target.length ? finish(next, at) : next
}

function deleteBack(state, wholeWord, at) {
  if (state.status !== 'running' || state.typed.length === 0) return state

  if (isPastDeadline(state.timeLimitMs, state.startedAt, at)) {
    return finish(state, state.startedAt + state.timeLimitMs)
  }

  const cursor = state.typed.length
  const to = wholeWord ? wordStartBefore(state.target, cursor) : cursor - 1
  return {
    ...state,
    typed: state.typed.slice(0, to),
    log: [...state.log, { type: 'delete', t: at - state.startedAt, count: cursor - to }],
  }
}

function finish(state, endedAt) {
  return { ...state, status: 'finished', endedAt }
}

function isPastDeadline(timeLimitMs, startedAt, at) {
  return timeLimitMs != null && at - startedAt >= timeLimitMs
}
