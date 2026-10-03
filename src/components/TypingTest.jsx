import { RotateCcw } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useTestTimer } from '../hooks/useTestTimer.js'
import { useTypingEngine } from '../hooks/useTypingEngine.js'
import { createResult } from '../lib/history.js'
import { computeStats } from '../lib/metrics.js'
import { buildTest } from '../lib/testSetup.js'
import { useHistory } from '../state/history.js'
import LiveStats from './LiveStats.jsx'
import PracticeBanner from './PracticeBanner.jsx'
import Words from './Words.jsx'

// The results screen pulls in Recharts, most of the app's JavaScript. Load it as a separate
// chunk so the typing screen appears sooner, and prefetch it while the first test is typed.
const loadResults = () => import('./ResultsDashboard.jsx')
const ResultsDashboard = lazy(loadResults)

/**
 * One test, from first keystroke to results.
 *
 * App renders this with a `key` that changes on restart or settings change, so each test
 * is a brand-new instance: the words, reducer, timer and caret all start from scratch.
 *
 * @param {{ mode: 'time' | 'words' | 'practice', amount: number, onRestart: () => void }} props
 *   amount = seconds in time mode, a word count otherwise
 */
export default function TypingTest({ mode, amount, onRestart }) {
  const { results, addResult } = useHistory()

  // What this test contains (words, time limit, practice targets), decided once on mount.
  // A practice drill reads your history here; finishing it doesn't reshuffle the words.
  const [setup] = useState(() => buildTest({ mode, amount }, results))

  const { state, timeUp, capsLock } = useTypingEngine({ words: setup.words, timeLimitMs: setup.timeLimitMs, onRestart })
  const { id, status, target, typed, log, startedAt, endedAt, timeLimitMs } = state
  const { elapsedMs, remainingMs } = useTestTimer({ status, startedAt, endedAt, timeLimitMs, onTimeUp: timeUp })

  // Metrics are derived, never stored: recomputed from the engine state on each tick/keystroke.
  const stats = useMemo(() => computeStats({ target, typed, log, elapsedMs }), [target, typed, log, elapsedMs])

  useEffect(() => {
    if (status === 'running') loadResults() // fetched once; later calls reuse the same module
  }, [status])

  // Save the finished test for the stats page. In development React runs effects twice;
  // addResult ignores an id it already has, so the test is still stored once.
  useEffect(() => {
    if (status !== 'finished') return
    const targets = setup.targets.map((t) => t.char)
    const result = createResult({ id, date: Date.now(), mode, amount, target, typed, log, elapsedMs: endedAt - startedAt, targets })
    if (result) addResult(result)
  }, [status, id, mode, amount, target, typed, log, startedAt, endedAt, setup, addResult])

  if (status === 'finished') {
    return (
      <Suspense fallback={null}>
        <ResultsDashboard state={state} mode={mode} amount={amount} targets={setup.targets} onRestart={onRestart} />
      </Suspense>
    )
  }

  return (
    // data-test-status lets plain CSS fade the nav while typing (see .focus-fade in index.css).
    <section data-test-status={status} aria-label="Typing test" className="flex flex-col gap-3">
      {mode === 'practice' && <PracticeBanner targets={setup.targets} />}
      <LiveStats
        mode={mode}
        status={status}
        remainingMs={remainingMs}
        target={target}
        typed={typed}
        total={amount}
        stats={stats}
        capsLock={capsLock}
      />
      <Words target={target} typed={typed} status={status} />
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onRestart}
          onMouseDown={(e) => e.preventDefault()} // don't take focus: Space should keep typing
          aria-label="Restart test"
          title="Restart (Tab)"
          className="focus-fade rounded-lg p-3 text-sub transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-main"
        >
          <RotateCcw size={20} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
