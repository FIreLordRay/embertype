import { Target } from 'lucide-react'
import Kbd from './Kbd.jsx'

/**
 * Shown above a practice drill: the keys it focuses on (worst first), or, before there's
 * enough history to know, what to do to unlock targeted drills.
 *
 * @param {{ targets: { char: string }[] }} props
 */
export default function PracticeBanner({ targets }) {
  return (
    <div className="focus-fade flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-sub">
      <Target size={16} className="text-main" aria-hidden="true" />
      {targets.length > 0 ? (
        <>
          <span>drilling your weakest keys</span>
          <span className="flex flex-wrap gap-1.5">
            {targets.map(({ char }) => (
              <Kbd key={char}>{char === ' ' ? 'space' : char}</Kbd>
            ))}
          </span>
        </>
      ) : (
        <span>
          No weak keys yet. Finish a few regular tests and practice will drill the keys you miss most; for now this
          is a mixed drill.
        </span>
      )}
    </div>
  )
}
