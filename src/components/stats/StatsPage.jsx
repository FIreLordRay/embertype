import { Flame, Keyboard, Minus, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNow } from '../../hooks/useNow.js'
import {
  filterByMode,
  formatDuration,
  isPractice,
  EXTRAS,
  keyStats,
  MODE_KEYS,
  modeKey,
  personalBests,
  summarize,
  testLabel,
  timeAgo,
} from '../../lib/history.js'
import { MAX_RESULTS, useHistory } from '../../state/history.js'
import { useSettings } from '../../state/settings.js'
import Kbd from '../Kbd.jsx'
import Consistency from './Consistency.jsx'
import DataActions from './DataActions.jsx'
import KeyHeatmap from './KeyHeatmap.jsx'
import ProgressChart from './ProgressChart.jsx'

/**
 * The progress dashboard: every number here is computed from your saved results
 * (see lib/history.js).
 *
 * The consistency section at the top counts all your practice. Below it, one filter row
 * scopes everything else. "all" means every regular test: practice drills and lessons use
 * words that aren't comparable, so they have their own filters instead.
 */
export default function StatsPage() {
  const { results, clearHistory, importResults } = useHistory()
  const { update } = useSettings()
  const [filter, setFilter] = useState('all')
  const now = useNow() // keeps "5 minutes ago" and the streak current while the page is open

  const available = useMemo(() => {
    const modes = MODE_KEYS.filter((key) => results.some((r) => modeKey(r) === key))
    if (results.some(isPractice)) modes.push('practice')
    if (results.some((r) => r.mode === 'lesson')) modes.push('lessons')
    return modes
  }, [results])
  const active = available.includes(filter) ? filter : 'all'
  const shown = useMemo(() => filterByMode(results, active), [results, active])
  const summary = useMemo(() => summarize(shown), [shown])
  const bests = useMemo(() => personalBests(results), [results])
  const weakKeys = useMemo(() => keyStats(shown).slice(0, 8), [shown])
  const isTrainingView = active === 'practice' || active === 'lessons'

  if (results.length === 0) return <EmptyState onImport={importResults} />

  return (
    <section aria-labelledby="stats-heading" className="flex animate-fade-in flex-col gap-10 motion-reduce:animate-none">
      <h2 id="stats-heading" className="text-2xl text-fg">
        your progress
      </h2>

      <Consistency results={results} now={now} />

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
        <h3 className="text-lg text-fg">your tests</h3>
        <ModeFilter options={available} active={active} onChange={setFilter} />
      </div>

      {shown.length === 0 ? (
        // Only training so far: "all" (regular tests) has nothing to show yet.
        <p className="text-sub">
          No regular tests yet, only practice and lessons. Take a time, words or quote test to see your progress here.
        </p>
      ) : (
        <>
          <SummaryTiles summary={summary} now={now} atLimit={results.length >= MAX_RESULTS} />
          <ProgressChart results={shown} now={now} />

          <div className="grid gap-10 md:grid-cols-2">
            <PersonalBests bests={bests} active={active} now={now} />
            <WeakKeys
              keys={weakKeys}
              // Drill your weak keys from here (not offered inside the training views themselves).
              onPractice={isTrainingView ? null : () => update({ mode: 'practice' })}
            />
          </div>

          <KeyHeatmap results={shown} />
          <TestTable results={shown} now={now} />
        </>
      )}
      <DataActions results={results} onImport={importResults} onClear={clearHistory} />
    </section>
  )
}

/** No history yet: point at the first test, or import a file exported from another browser. */
function EmptyState({ onImport }) {
  return (
    <section className="flex animate-fade-in flex-col items-center gap-4 py-16 text-center motion-reduce:animate-none">
      <Flame size={40} className="text-main" aria-hidden="true" />
      <h2 className="text-2xl text-fg">no tests yet</h2>
      <p className="max-w-sm text-sub">
        Finish a test and it shows up here: your speed over time, personal bests, and the keys worth practicing.
      </p>
      <a
        href="#/"
        className="mt-2 flex items-center gap-2 rounded-lg bg-surface px-5 py-2.5 text-fg transition-colors hover:bg-main hover:text-bg focus-visible:outline-2 focus-visible:outline-main"
      >
        <Keyboard size={18} aria-hidden="true" />
        start typing
      </a>
      <div className="mt-4 text-xs text-sub">
        <p>Moving from another browser? Import your exported history.</p>
        <div className="mt-1 flex justify-center">
          <DataActions results={[]} onImport={onImport} />
        </div>
      </div>
    </section>
  )
}

/** The one filter row: everything below it shows the selected mode. */
function ModeFilter({ options, active, onChange }) {
  return (
    <div role="group" aria-label="Show results for" className="flex flex-wrap gap-1 rounded-xl bg-surface p-1 text-sm">
      {['all', ...options].map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={key === active}
          onClick={() => onChange(key)}
          className={`rounded-lg px-2.5 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-main ${
            key === active ? 'bg-main/15 text-main' : 'text-sub hover:text-fg'
          }`}
        >
          {key}
        </button>
      ))}
    </div>
  )
}

/** `atLimit`: the history is full, so older tests are being dropped (see trimHistory). */
function SummaryTiles({ summary, now, atLimit }) {
  const { tests, totalMs, best, recentWpm, recentAccuracy, previousWpm } = summary
  const trend = previousWpm === null ? null : Math.floor(recentWpm) - Math.floor(previousWpm)

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
      <Tile label="tests" value={tests} note={atLimit ? 'history full: the oldest drop off, bests stay' : null} />
      <Tile label="time typing" value={formatDuration(totalMs)} />
      <Tile label="best" value={`${Math.floor(best.wpm)} wpm`} note={`${testLabel(best)} · ${timeAgo(best.date, now)}`} />
      <Tile
        label="recent average"
        value={`${Math.floor(recentWpm)} wpm`}
        note={trend === null ? 'your last 10 tests' : <Trend delta={trend} />}
      />
      <Tile label="recent accuracy" value={`${Math.floor(recentAccuracy)}%`} note="your last 10 tests" />
    </dl>
  )
}

/** Change in your recent average. Sign and arrow carry the direction, not colour alone. */
function Trend({ delta }) {
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const color = delta > 0 ? 'text-correct' : delta < 0 ? 'text-error' : 'text-sub'
  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <Icon size={14} aria-hidden="true" />
      {delta > 0 ? '+' : ''}
      {delta} wpm vs earlier tests
    </span>
  )
}

function Tile({ label, value, note }) {
  return (
    <div>
      <dt className="text-sm text-sub">{label}</dt>
      <dd className="text-3xl text-fg">{value}</dd>
      {note && <dd className="mt-0.5 text-xs text-sub">{note}</dd>}
    </div>
  )
}

// Table cells: a gap after every column but the last, so numbers never run together on a phone.
const TH = 'pb-2 pr-3 font-normal last:pr-0'
const TD = 'py-2 pr-3 last:pr-0'

/** Every variant of a test with extras (' + numbers', ' + punctuation + tech', …), written the way testLabel writes them. */
const VARIANTS = EXTRAS.reduce((acc, extra) => [...acc, ...acc.map((v) => `${v} + ${extra}`), ` + ${extra}`], [])

/**
 * Every test, always (the selected one highlighted, missing ones with a dash), plus a row
 * for each variant with punctuation, numbers or tech words you've taken: those are different tests.
 */
function PersonalBests({ bests, active, now }) {
  const rows = MODE_KEYS.flatMap((key) => [key, ...VARIANTS.map((variant) => key + variant).filter((label) => bests.has(label))])
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm text-sub">personal bests</h3>
      <table className="w-full text-left text-sm tabular-nums">
        <thead className="text-xs text-sub">
          <tr>
            <th className={TH}>test</th>
            <th className={TH}>best</th>
            <th className={TH}>acc</th>
            <th className={TH}>when</th>
            <th className={`${TH} text-right`}>tests</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((label) => {
            const entry = bests.get(label)
            const [key, ...extras] = label.split(' + ')
            return (
              <tr key={label} className={`border-t border-line ${key === active ? 'text-main' : 'text-fg'}`}>
                <td className={TD}>
                  {key}
                  {extras.map((extra) => (
                    <span key={extra} className="text-sub">
                      {' '}
                      + {extra}
                    </span>
                  ))}
                </td>
                <td className={TD}>{entry ? `${Math.floor(entry.best.wpm)} wpm` : '—'}</td>
                <td className={TD}>{entry ? `${Math.floor(entry.best.accuracy)}%` : ''}</td>
                <td className={`${TD} text-sub`}>{entry ? timeAgo(entry.best.date, now) : ''}</td>
                <td className={`${TD} text-right text-sub`}>{entry?.count ?? 0}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Your weakest keys by miss rate, each with a bar scaled to the worst one, and a button that
 * starts a practice drill on them (`onPractice`; null hides it).
 */
function WeakKeys({ keys, onPractice }) {
  const worst = keys[0]?.rate ?? 1
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm text-sub">keys to practice · how often each one is mistyped</h3>
      {keys.length === 0 ? (
        <p className="text-sm text-sub">
          Not enough data yet. A few more tests and your weakest keys will show up here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5 text-sm">
          {keys.map((k) => (
            <li key={k.char} className="grid grid-cols-[4.5rem_1fr_3.5rem_6.5rem] items-center gap-3">
              <Kbd className="text-center">{k.char === ' ' ? 'space' : k.char}</Kbd>
              <span aria-hidden="true" className="h-1.5 rounded-full bg-line">
                <span className="block h-full rounded-full bg-error" style={{ width: `${(k.rate / worst) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums text-fg">{(k.rate * 100).toFixed(1)}%</span>
              <span className="text-xs text-sub">
                {k.misses} of {k.attempts}
              </span>
            </li>
          ))}
        </ul>
      )}
      {keys.length > 0 && onPractice && (
        // A link, so the browser navigates to the typing page; the click also switches the mode.
        <a
          href="#/"
          onClick={onPractice}
          className="mt-1 flex w-fit items-center gap-2 rounded-lg bg-surface px-4 py-2 text-sm text-fg transition-colors hover:bg-main hover:text-bg focus-visible:outline-2 focus-visible:outline-main"
        >
          <Target size={16} aria-hidden="true" />
          practice these keys
        </a>
      )}
    </div>
  )
}

/** Newest first. Also the table version of the chart: every value without hovering. */
function TestTable({ results, now }) {
  const [showAll, setShowAll] = useState(false)
  const rows = results.slice(showAll ? 0 : -10).reverse() // slice copies, so reverse doesn't touch state

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm text-sub">{showAll ? `all ${results.length} tests` : 'recent tests'}</h3>
      <div className={showAll ? 'max-h-96 overflow-y-auto' : ''}>
        <table className="w-full text-left text-sm tabular-nums">
          <thead className="text-xs text-sub">
            <tr>
              <th className={TH}>when</th>
              <th className={TH}>test</th>
              <th className={`${TH} text-right`}>wpm</th>
              {/* Raw is the least important column: it makes room on phones. */}
              <th className={`${TH} hidden text-right sm:table-cell`}>raw</th>
              <th className={`${TH} text-right`}>acc</th>
              <th className={`${TH} text-right`}>errors</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className={`${TD} text-sub`}>{timeAgo(r.date, now)}</td>
                <td className={`${TD} text-fg`}>{testLabel(r)}</td>
                <td className={`${TD} text-right text-fg`}>{Math.floor(r.wpm)}</td>
                <td className={`${TD} hidden text-right text-sub sm:table-cell`}>{Math.floor(r.raw)}</td>
                <td className={`${TD} text-right text-fg`}>{Math.floor(r.accuracy)}%</td>
                <td className={`${TD} text-right text-sub`}>{r.errors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {results.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="w-fit rounded text-xs text-sub transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-main"
        >
          {showAll ? 'show recent only' : `show all ${results.length}`}
        </button>
      )}
    </div>
  )
}
