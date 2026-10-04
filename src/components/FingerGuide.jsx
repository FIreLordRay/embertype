import { memo } from 'react'
import { DECORATIVE_KEYS, keyFor, keysForFinger } from '../lib/qwerty.js'
import Keyboard from './Keyboard.jsx'

/**
 * The touch-typing coach under the words: the key to press next lights up, along with the
 * other keys the same finger is responsible for, and the caption names the finger.
 * For capitals and symbols it also lights the Shift to hold, on the opposite hand.
 *
 * The key you actually pressed sinks like a real keycap, and flashes red if it was the wrong
 * one, so you can see which key your finger found.
 *
 * Hidden on touch screens, where there's no physical keyboard to guide.
 *
 * @param {{ char: string | undefined, pressed: string | null, missed: boolean, pressId: number }} props
 *   char: the next character to type. pressed: the last key typed (a character, or
 *   'backspace'), missed: whether it was wrong, pressId: changes with every keystroke.
 */
function FingerGuide({ char, pressed, missed, pressId }) {
  const next = char === undefined ? null : keyFor(char)
  const zone = next ? keysForFinger(next.finger) : ''
  const pressedKey = pressed === 'backspace' ? 'backspace' : pressed === null ? null : keyFor(pressed)?.key

  const keyClass = (id) => {
    if (next && id === next.key) return 'bg-main text-bg'
    if (next?.shift && id === `shift-${next.shift}`) return 'bg-main/70 text-bg'
    if (zone.includes(id) && id.length === 1) return 'bg-main/15 text-fg'
    if (DECORATIVE_KEYS.includes(id)) return 'bg-surface/50 text-sub/60'
    return 'bg-surface text-sub'
  }

  const keyProps = (id) =>
    id === pressedKey
      ? { className: `${keyClass(id)}${missed ? ' keycap-miss' : ''}`, tap: pressId }
      : { className: keyClass(id) }

  return (
    <div className="flex flex-col items-center gap-2 pointer-coarse:hidden" aria-hidden="true">
      <Keyboard keyProps={keyProps} className="max-w-xl" />
      <p className="h-4 text-xs text-sub">{next ? caption(next) : ''}</p>
    </div>
  )
}

export default memo(FingerGuide)

function caption({ key, finger, shift }) {
  if (finger === 'thumb') return 'space: either thumb'
  const name = `${key.toUpperCase()}: ${finger} finger`
  return shift ? `${name}, holding ${shift} shift` : name
}
