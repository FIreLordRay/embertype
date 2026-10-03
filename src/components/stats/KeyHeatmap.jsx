import { useMemo } from 'react'
import { keyTotalsByKey } from '../../lib/history.js'
import { DECORATIVE_KEYS } from '../../lib/qwerty.js'
import Keyboard from '../Keyboard.jsx'

/** Below this many attempts a key's miss rate is too noisy to colour. */
const MIN_ATTEMPTS = 20

/**
 * Your keyboard, coloured by how often you miss each key: the redder, the worse. One colour
 * getting deeper (a sequential scale), scaled to your worst key so differences show even
 * when you're accurate overall. Each letter sits on a solid chip so it stays readable on
 * any shade. Hover a key for its exact numbers.
 *
 * @param {{ results: import('../../lib/history.js').TestResult[] }} props
 */
export default function KeyHeatmap({ results }) {
  const totals = useMemo(() => keyTotalsByKey(results), [results])
  const rated = [...totals.values()].filter((total) => total.attempts >= MIN_ATTEMPTS)
  const worst = Math.max(...rated.map((total) => total.rate), 0.0001)

  const keyProps = (id) => {
    if (DECORATIVE_KEYS.includes(id) || id.startsWith('shift')) return { className: 'bg-surface/40 text-sub/50' }
    const name = id === ' ' ? 'space' : id.toUpperCase()
    const total = totals.get(id)
    if (!total || total.attempts < MIN_ATTEMPTS) {
      return { className: 'bg-surface text-sub/70', title: `${name}: not enough typing yet` }
    }
    const share = total.rate / worst // 0 (never missed) … 1 (your worst key)
    return {
      className: 'text-fg',
      style: { background: `color-mix(in oklab, var(--error) ${Math.round(12 + share * 78)}%, var(--surface))` },
      labelClassName: 'rounded-[0.25em] bg-surface/85 px-[0.3em] py-[0.1em]',
      title: `${name}: ${(total.rate * 100).toFixed(1)}% missed (${total.misses} of ${total.attempts})`,
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm text-sub">miss rate by key · hover a key for its numbers</h3>
      {rated.length === 0 ? (
        <p className="text-sm text-sub">Not enough typing yet to colour the keyboard. A few more tests and it fills in.</p>
      ) : (
        <>
          <div role="img" aria-label="Keyboard coloured by how often you miss each key. The keys to practice list above has the same information as text.">
            <Keyboard keyProps={keyProps} className="max-w-3xl" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-sub">
            <span className="flex items-center gap-2">
              0%
              <span
                aria-hidden="true"
                className="h-2.5 w-32 rounded-full"
                style={{ background: 'linear-gradient(to right, color-mix(in oklab, var(--error) 12%, var(--surface)), var(--error))' }}
              />
              {(worst * 100).toFixed(1)}% missed
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="size-2.5 rounded-sm bg-surface ring-1 ring-line" />
              not enough typing yet
            </span>
          </div>
        </>
      )}
    </div>
  )
}
