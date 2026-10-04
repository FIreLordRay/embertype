import { RotateCcw } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useTestTimer } from '../hooks/useTestTimer.js'
import { useTypingEngine } from '../hooks/useTypingEngine.js'
import { createResult } from '../lib/history.js'
import { computeStats } from '../lib/metrics.js'
import { playKeySound } from '../lib/sound.js'
import { buildTest } from '../lib/testSetup.js'
import { useHistory } from '../state/history.js'
import { useSettings } from '../state/settings.js'
import FingerGuide from './FingerGuide.jsx'
import LessonBanner from './LessonBanner.jsx'
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
 * App renders this with a `key` that changes on restart or when anything deciding the words
 * changes, so each test is a brand-new instance: words, reducer, timer and caret all start
 * from scratch. The typing aids (finger guide, ghost caret, sounds) are read live from the
 * settings instead, so switching them on or off doesn't restart the test.
 *
 * @param {{ mode: 'time' | 'words' | 'quote' | 'practice' | 'lesson', amount: number | string,
 *           extras: { punctuation?: boolean, numbers?: boolean }, onRestart: () => void }} props
 */
export default function TypingTest({ mode, amount, extras, onRestart }) {
  const { results, addResult } = useHistory()
  const { fingerGuide, paceCaret, sound } = useSettings()

  // What this test contains (words, time limit, targets, quote, pace), decided once on mount.
  // Saving this test's result later doesn't reshuffle anything.
  const [setup] = useState(() => buildTest({ mode, amount, ...extras, paceCaret: true }, results))

  const { state, timeUp, capsLock } = useTypingEngine({ words: setup.words, timeLimitMs: setup.timeLimitMs, onRestart })
  const { id, status, target, typed, log, startedAt, endedAt, timeLimitMs } = state
  const { elapsedMs, remainingMs } = useTestTimer({ status, startedAt, endedAt, timeLimitMs, onTimeUp: timeUp })

  // Metrics are derived, never stored: recomputed from the engine state on each tick/keystroke.
  const stats = useMemo(() => computeStats({ target, typed, log, elapsedMs }), [target, typed, log, elapsedMs])

  // Race your best: where your personal best would be by now (5 characters per word).
  const pace = paceCaret ? setup.pace : null
  const ghostIndex =
    pace && status === 'running' ? Math.min(target.length - 1, Math.floor((pace * 5 * elapsedMs) / 60_000)) : null

  useEffect(() => {
    // Fetched once; later calls reuse the same module. If it fails (the app was redeployed),
    // the results screen's own load fails the same way and the error boundary explains.
    if (status === 'running') loadResults().catch(() => {})
  }, [status])

  // A sound for each new keystroke in the log: a click, or a thud for a mistake. The ref
  // remembers the last keystroke handled, so switching sounds on doesn't replay an old one.
  const lastEvent = log.at(-1)
  const heardRef = useRef(lastEvent)
  useEffect(() => {
    if (lastEvent === heardRef.current) return
    heardRef.current = lastEvent
    if (sound && lastEvent) {
      playKeySound(lastEvent.type === 'char' && lastEvent.actual !== lastEvent.expected ? 'error' : 'click')
    }
  }, [sound, lastEvent])

  // Save the finished test for the stats page. In development React runs effects twice;
  // addResult ignores an id it already has, so the test is still stored once.
  useEffect(() => {
    if (status !== 'finished') return
    const result = createResult({
      id,
      date: Date.now(),
      mode,
      amount,
      target,
      typed,
      log,
      elapsedMs: endedAt - startedAt,
      targets: setup.targets.map((t) => t.char),
      ...setup.extras,
    })
    if (result) addResult(result)
  }, [status, id, mode, amount, target, typed, log, startedAt, endedAt, setup, addResult])

  if (status === 'finished') {
    return (
      <Suspense fallback={null}>
        <ResultsDashboard state={state} mode={mode} amount={amount} setup={setup} onRestart={onRestart} />
      </Suspense>
    )
  }

  return (
    // data-test-status lets plain CSS fade the nav while typing (see .focus-fade in index.css).
    <section data-test-status={status} aria-label="Typing test" className="flex flex-col gap-3">
      {mode === 'practice' && <PracticeBanner targets={setup.targets} />}
      {mode === 'lesson' && <LessonBanner lesson={amount} />}
      <LiveStats
        mode={mode}
        status={status}
        remainingMs={remainingMs}
        target={target}
        typed={typed}
        total={setup.words.length}
        stats={stats}
        pace={pace}
        capsLock={capsLock}
      />
      <Words target={target} typed={typed} status={status} ghostIndex={ghostIndex} />
      {fingerGuide && (
        <div className="mt-4">
          <FingerGuide
            char={target[typed.length]}
            pressed={lastEvent === undefined ? null : lastEvent.type === 'char' ? lastEvent.actual : 'backspace'}
            missed={lastEvent?.type === 'char' && lastEvent.actual !== lastEvent.expected}
            pressId={log.length}
          />
        </div>
      )}
      {/* focus-fade on the wrapper: the keycap has its own transitions for hover and press. */}
      <div className="focus-fade mt-4 flex justify-center">
        <button
          type="button"
          onClick={onRestart}
          onMouseDown={(e) => e.preventDefault()} // don't take focus: Space should keep typing
          aria-label="Restart test"
          title="Restart (Tab)"
          className="keycap grid size-(--k) place-items-center bg-surface text-sub outline-offset-2 [--k:2.75rem] hover:text-fg focus-visible:outline-2 focus-visible:outline-main"
        >
          <RotateCcw size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
