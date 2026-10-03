import { ChartLine, Flame, Minus, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { countKeys, MIN_CORRECT_CHARS, previousBest } from '../lib/history.js'
import { buildTimeline, computeStats, missedKeys } from '../lib/metrics.js'
import { useHistory } from '../state/history.js'
import Kbd from './Kbd.jsx'
import PerformanceChart from './PerformanceChart.jsx'

/**
 * The summary shown when a test ends: final wpm and accuracy, the supporting numbers,
 * the per-second chart, and the keys worth practising. After a practice drill it also
 * reports how each drilled key went compared with your usual miss rate.
 *
 * Everything is computed from the finished engine state with the same pure functions the
 * live display uses, so the results can't disagree with what you saw while typing.
 *
 * @param {{ state: import('../lib/typingEngine.js').EngineState, mode: 'time' | 'words' | 'practice',
 *           amount: number, targets?: { char: string, rate: number }[], onRestart: () => void }} props
 */
export default function ResultsDashboard({ state, mode, amount, targets = [], onRestart }) {
  const { id, target, typed, log, startedAt, endedAt } = state
  const elapsedMs = endedAt - startedAt
  const testName = `${mode} ${amount}`
  const isDrill = mode === 'practice'

  const stats = useMemo(() => computeStats({ target, typed, log, elapsedMs }), [target, typed, log, elapsedMs])
  const timeline = useMemo(() => buildTimeline({ target, log, elapsedMs }), [target, log, elapsedMs])
  const missed = useMemo(() => missedKeys(log), [log])

  // Compare with your best in this mode *before* this test (excluded by id), so the answer
  // is the same whether or not this test has been saved yet.
  const { results } = useHistory()
  const best = useMemo(() => previousBest(results, testName, id), [results, testName, id])
  const saved = stats.correctChars >= MIN_CORRECT_CHARS
  // Floored like every displayed number: 87.4 → 87.9 doesn't read as a new best.
  const gain = best === null ? 0 : Math.floor(stats.wpm) - Math.floor(best)

  return (
    <section aria-labelledby="results-heading" className="flex animate-fade-in flex-col gap-8 motion-reduce:animate-none">
      <h2 id="results-heading" className="sr-only">
        Results
      </h2>

      {/* No personal bests for drills: their words are picked to be hard, so they'd be unfair. */}
      {saved && gain > 0 && !isDrill && (
        <p role="status" className="flex items-center gap-2 text-main">
          <Flame size={18} aria-hidden="true" />
          new personal best for {testName}: +{gain} wpm
        </p>
      )}
      {!saved && (
        <p role="status" className="text-sm text-sub">
          Too short to save to your stats: type at least one full word.
        </p>
      )}

      <div className="grid items-center gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
        <div className="flex gap-10 md:flex-col md:gap-5">
          {/* Floored, like most typing tests: 87.9 shows as 87, and 99.6% never claims 100%. */}
          <Figure label="wpm" value={Math.floor(stats.wpm)} exact={`${stats.wpm.toFixed(2)} wpm`} hero />
          <Figure label="acc" value={`${Math.floor(stats.accuracy)}%`} exact={`${stats.accuracy.toFixed(2)}% accuracy`} />
        </div>
        <PerformanceChart data={timeline} />
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
        <Tile label="test" value={testName} note={isDrill ? 'drill' : 'english'} />
        <Tile label="raw" value={Math.floor(stats.raw)} note="every keystroke counted" />
        <Tile label="errors" value={stats.errors} note="wrong keys, fixed or not" />
        <Tile label="characters" value={`${stats.correctChars}/${stats.incorrectChars}`} note="correct / incorrect" />
        <Tile label="time" value={`${Number((elapsedMs / 1000).toFixed(1))}s`} note="first key to last" />
      </dl>

      {isDrill && targets.length > 0 && <DrillReport targets={targets} log={log} />}

      <MissedKeys keys={missed} />

      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-2 rounded-lg bg-surface px-5 py-2.5 text-fg transition-colors hover:bg-main hover:text-bg focus-visible:outline-2 focus-visible:outline-main"
          >
            <RotateCcw size={18} aria-hidden="true" />
            {isDrill ? 'next drill' : 'next test'}
          </button>
          <a
            href="#/stats"
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sub transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-main"
          >
            <ChartLine size={18} aria-hidden="true" />
            your progress
          </a>
        </div>
        <p className="text-xs text-sub">
          or press <Kbd>tab</Kbd> / <Kbd>enter</Kbd>
        </p>
      </div>
    </section>
  )
}

/** A headline number. WPM is the one hero figure; accuracy sits just below it in size. */
function Figure({ label, value, exact, hero = false }) {
  return (
    <div title={exact}>
      <div className="text-lg text-sub">{label}</div>
      <div className={`leading-none text-main ${hero ? 'text-7xl sm:text-8xl' : 'text-5xl sm:text-6xl'}`}>{value}</div>
    </div>
  )
}

function Tile({ label, value, note }) {
  return (
    <div>
      <dt className="text-sm text-sub">{label}</dt>
      <dd className="text-2xl text-fg">{value}</dd>
      <dd className="text-xs text-sub">{note}</dd>
    </div>
  )
}

/**
 * After a drill: each drilled key's miss rate in this drill next to your usual rate (from
 * regular tests). Small samples are noisy, so the counts are shown, not just the percentage.
 */
function DrillReport({ targets, log }) {
  const counts = useMemo(() => countKeys(log), [log])
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm text-sub">how your weak keys did</h3>
      <ul className="flex flex-col gap-2.5 text-sm">
        {targets.map(({ char, rate: usual }) => {
          const [attempts, misses] = counts[char] ?? [0, 0]
          const now = attempts > 0 ? misses / attempts : null
          return (
            <li key={char} className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Kbd className="min-w-14 text-center">{char === ' ' ? 'space' : char}</Kbd>
              {now === null ? (
                <span className="text-sub">not in this drill</span>
              ) : (
                <>
                  <span className="tabular-nums text-fg">
                    {misses} of {attempts} missed ({percent(now)})
                  </span>
                  <span className="text-sub">usually {percent(usual)}</span>
                  <Verdict now={now} usual={usual} />
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Fewer misses than usual is good. Words and an arrow say which way, not colour alone. */
function Verdict({ now, usual }) {
  if (now < usual) {
    return (
      <span className="inline-flex items-center gap-1 text-correct">
        <TrendingDown size={14} aria-hidden="true" />
        fewer misses than usual
      </span>
    )
  }
  if (now > usual) {
    return (
      <span className="inline-flex items-center gap-1 text-error">
        <TrendingUp size={14} aria-hidden="true" />
        more misses than usual
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-sub">
      <Minus size={14} aria-hidden="true" />
      same as usual
    </span>
  )
}

const percent = (rate) => `${(rate * 100).toFixed(1)}%`

/** The characters you missed most: a ready-made practice list. */
function MissedKeys({ keys }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <span className="text-sub">keys to practice</span>
      {keys.length === 0 ? (
        <span className="text-fg">none, a clean run</span>
      ) : (
        keys.map(({ char, count }) => (
          <span key={char} className="flex items-center gap-1.5">
            <Kbd className="min-w-8 text-center">{char === ' ' ? 'space' : char}</Kbd>
            <span className="text-sub">×{count}</span>
          </span>
        ))
      )}
    </div>
  )
}
