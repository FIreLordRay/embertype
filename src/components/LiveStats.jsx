import { ArrowBigUp, Ghost } from 'lucide-react'
import { completedWords } from '../lib/metrics.js'

/**
 * The strip above the words: the countdown (time mode) or word progress (other modes),
 * a Caps Lock warning, and live wpm / accuracy once the test has been running a second
 * (before that, a single keystroke would read as a wild number). When you're racing your
 * best, it also shows the speed the ghost caret is moving at.
 *
 * `total` is the test's word count; time mode ignores it. `pace` is null when not racing.
 */
export default function LiveStats({ mode, status, remainingMs, target, typed, total, stats, pace, capsLock }) {
  const counter =
    mode === 'time' ? Math.ceil(remainingMs / 1000) : `${completedWords(target, typed.length)}/${total}`
  const showRates = status === 'running' && stats.elapsedMs >= 1000

  return (
    <div className="flex h-10 items-end justify-between gap-4">
      <span
        className={`text-[1.75rem] leading-none transition-colors ${status === 'running' ? 'text-main' : 'text-sub'}`}
        aria-label={mode === 'time' ? `${counter} seconds left` : `${counter} words typed`}
      >
        {counter}
      </span>

      {capsLock && (
        <span role="status" className="flex items-center gap-1.5 rounded-md bg-main px-2.5 py-1 text-sm text-bg">
          <ArrowBigUp size={16} aria-hidden="true" />
          caps lock is on
        </span>
      )}

      <span
        className={`flex items-center gap-3 text-sm text-sub transition-opacity duration-300 ${showRates ? 'opacity-100' : 'opacity-0'}`}
      >
        {pace && (
          <span className="flex items-center gap-1" title="the ghost caret moves at your personal best">
            <Ghost size={14} aria-hidden="true" />
            racing {Math.floor(pace)}
          </span>
        )}
        <span>
          {Math.floor(stats.wpm)} wpm · {Math.floor(stats.accuracy)}% acc
        </span>
      </span>
    </div>
  )
}
