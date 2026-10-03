import { Flame, Keyboard, Minus, Target, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  filterByMode,
  formatDuration,
  isPractice,
  keyStats,
  MODE_KEYS,
  modeKey,
  personalBests,
  summarize,
  timeAgo,
} from '../../lib/history.js'
import { useHistory } from '../../state/history.js'
import { useSettings } from '../../state/settings.js'
import Kbd from '../Kbd.jsx'
import ProgressChart from './ProgressChart.jsx'

/**
 * The progress dashboard: every number here is computed from your saved results
 * (see lib/history.js). One filter row at the top scopes the whole page.
 *
 * "all" means every regular test. Practice drills use words picked to be hard for you, so
 * they'd drag your averages down unfairly; they live under their own "practice" filter.
 */
export default function StatsPage() {
  const { results, clearHistory } = useHistory()
  const { update } = useSettings()
  const [filter, setFilter] = useState('all')
  // One clock reading per visit, so "5 minutes ago" doesn't need a ticking timer.
  const [now] = useState(Date.now)

  const available = useMemo(() => {
    const modes = MODE_KEYS.filter((key) => results.some((r) => modeKey(r) === key))
    return results.some(isPractice) ? [...modes, 'practice'] : modes
  }, [results])
  const active = available.includes(filter) ? filter : 'all'
  const shown = useMemo(() => filterByMode(results, active), [results, active])
  const summary = useMemo(() => summarize(shown), [shown])
  const bests = useMemo(() => personalBests(results), [results])
  const weakKeys = useMemo(() => keyStats(shown).slice(0, 8), [shown])

  if (results.length === 0) return <EmptyState />

  return (
    <section aria-labelledby="stats-heading" className="flex animate-fade-in flex-col gap-10 motion-reduce:animate-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="stats-heading" className="text-2xl text-fg">
          your progress
        </h2>
        <ModeFilter options={available} active={active} onChange={setFilter} />
      </div>

      {shown.length === 0 ? (
        // Only drills so far: "all" (regular tests) has nothing to show yet.
        <p className="text-sub">
          No regular tests yet, only practice drills. Take a time or words test to see your progress here.
        </p>
      ) : (
        <>
          <SummaryTiles summary={summary} now={now} />
          <ProgressChart results={shown} now={now} />

          <div className="grid gap-10 md:grid-cols-2">
            <PersonalBests bests={bests} active={active} now={now} />
            <WeakKeys
              keys={weakKeys}
              // Drill the weak keys from here (not offered inside the practice view itself).
              onPractice={active === 'practice' ? null : () => update({ mode: 'practice' })}
            />
          </div>

          <TestTable results={shown} now={now} />
        </>
      )}
      <ClearHistory count={results.length} onClear={clearHistory} />
    </section>
  )
}

function EmptyState() {
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

function SummaryTiles({ summary, now }) {
  const { tests, totalMs, best, recentWpm, recentAccuracy, previousWpm } = summary
  const trend = previousWpm === null ? null : Math.floor(recentWpm) - Math.floor(previousWpm)

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
      <Tile label="tests" value={tests} />
      <Tile label="time typing" value={formatDuration(totalMs)} />
      <Tile label="best" value={`${Math.floor(best.wpm)} wpm`} note={`${modeKey(best)} · ${timeAgo(best.date, now)}`} />
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

/** Every mode, always: the selected one is highlighted, missing ones show a dash. */
function PersonalBests({ bests, active, now }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm text-sub">personal bests</h3>
      <table className="w-full text-left text-sm tabular-nums">
        <thead className="text-xs text-sub">
          <tr>
            <th className="pb-2 font-normal">test</th>
            <th className="pb-2 font-normal">best</th>
            <th className="pb-2 font-normal">acc</th>
            <th className="pb-2 font-normal">when</th>
            <th className="pb-2 text-right font-normal">tests</th>
          </tr>
        </thead>
        <tbody>
          {MODE_KEYS.map((key) => {
            const entry = bests.get(key)
            return (
              <tr key={key} className={`border-t border-line ${key === active ? 'text-main' : 'text-fg'}`}>
                <td className="py-2">{key}</td>
                <td className="py-2">{entry ? `${Math.floor(entry.best.wpm)} wpm` : '—'}</td>
                <td className="py-2">{entry ? `${Math.floor(entry.best.accuracy)}%` : ''}</td>
                <td className="py-2 text-sub">{entry ? timeAgo(entry.best.date, now) : ''}</td>
                <td className="py-2 text-right text-sub">{entry?.count ?? 0}</td>
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
              <th className="pb-2 font-normal">when</th>
              <th className="pb-2 font-normal">test</th>
              <th className="pb-2 text-right font-normal">wpm</th>
              <th className="pb-2 text-right font-normal">raw</th>
              <th className="pb-2 text-right font-normal">acc</th>
              <th className="pb-2 text-right font-normal">errors</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-2 text-sub">{timeAgo(r.date, now)}</td>
                <td className="py-2 text-fg">{modeKey(r)}</td>
                <td className="py-2 text-right text-fg">{Math.floor(r.wpm)}</td>
                <td className="py-2 text-right text-sub">{Math.floor(r.raw)}</td>
                <td className="py-2 text-right text-fg">{Math.floor(r.accuracy)}%</td>
                <td className="py-2 text-right text-sub">{r.errors}</td>
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

/** Deleting everything takes two clicks; moving away cancels. */
function ClearHistory({ count, onClear }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => (confirming ? onClear() : setConfirming(true))}
        onMouseLeave={() => setConfirming(false)}
        onBlur={() => setConfirming(false)}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-main ${
          confirming ? 'bg-error/15 text-error' : 'text-sub hover:text-fg'
        }`}
      >
        <Trash2 size={14} aria-hidden="true" />
        {confirming ? `click again to delete all ${count} tests` : 'clear history'}
      </button>
    </div>
  )
}
