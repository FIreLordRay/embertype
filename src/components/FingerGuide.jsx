import { memo } from 'react'
import { DECORATIVE_KEYS, keyFor, keysForFinger } from '../lib/qwerty.js'
import Keyboard from './Keyboard.jsx'

/**
 * The touch-typing coach under the words: the key to press next lights up, along with the
 * other keys the same finger is responsible for, and the caption names the finger.
 * For capitals and symbols it also lights the Shift to hold, on the opposite hand.
 *
 * Hidden on touch screens, where there's no physical keyboard to guide.
 *
 * @param {{ char: string | undefined }} props the next character to type
 */
function FingerGuide({ char }) {
  const next = char === undefined ? null : keyFor(char)
  const zone = next ? keysForFinger(next.finger) : ''

  const keyProps = (id) => {
    if (next && id === next.key) return { className: 'bg-main text-bg' }
    if (next?.shift && id === `shift-${next.shift}`) return { className: 'bg-main/70 text-bg' }
    if (zone.includes(id) && id.length === 1) return { className: 'bg-main/15 text-fg' }
    if (DECORATIVE_KEYS.includes(id)) return { className: 'bg-surface/50 text-sub/60' }
    return { className: 'bg-surface text-sub' }
  }

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
