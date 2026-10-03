import { useCallback, useEffect, useReducer, useState } from 'react'
import { keyToAction } from '../lib/keyboard.js'
import { createInitialState, typingReducer } from '../lib/typingEngine.js'

/**
 * One typing test: the engine's state plus the keyboard listener that feeds it.
 * What to type comes from outside (lib/testSetup.js); this hook only runs the test.
 *
 * There's no reset function on purpose. Each test is a fresh mount: <TypingTest> gets a
 * `key` that changes on restart or when a setting changes, so React throws the old state
 * away and every test starts clean, with no leftover timers, listeners or scroll positions.
 *
 * @param {{ words: string[], timeLimitMs: number | null, onRestart: () => void }} options
 */
export function useTypingEngine({ words, timeLimitMs, onRestart }) {
  const [state, dispatch] = useReducer(typingReducer, { words, timeLimitMs }, initTest)
  const [capsLock, setCapsLock] = useState(false)
  const { status } = state

  useEffect(() => {
    function onKeyDown(e) {
      setCapsLock(e.getModifierState?.('CapsLock') ?? false)

      const action = keyToAction(e, status)
      if (!action) return
      e.preventDefault() // no page scroll on Space, no Firefox quick-find on ' and /

      if (action === 'restart') {
        onRestart()
        return
      }
      // A letter typed while a nav button has keyboard focus: move focus back to the page,
      // or the next Space would press that button instead of typing a space.
      const focused = document.activeElement
      if (focused instanceof HTMLElement && focused.closest('button, a[href]')) focused.blur()

      dispatch({ ...action, at: performance.now() })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [status, onRestart])

  const timeUp = useCallback(() => dispatch({ type: 'timeUp' }), [])

  return { state, timeUp, capsLock }
}

function initTest({ words, timeLimitMs }) {
  return createInitialState({ id: newTestId(), words, timeLimitMs })
}

/** A unique id per test. randomUUID needs a secure context, which localhost counts as. */
function newTestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
