import { Flame } from 'lucide-react'
import { useMemo } from 'react'
import { formatDuration } from '../../lib/history.js'
import { calendarWeeks, currentStreak, dailyTotals, dayKey, longestStreak } from '../../lib/streak.js'
import { useSettings } from '../../state/settings.js'

/**
 * How much you practice: today against your daily goal, your streak, and a calendar of the
 * last 18 weeks. Every test counts here, drills and lessons included: practice is practice.
 *
 * @param {{ results: import('../../lib/history.js').TestResult[], now: number }} props
 */
export default function Consistency({ results, now }) {
  const { dailyGoal } = useSettings()
  const goalMs = dailyGoal * 60_000
  const totals = useMemo(() => dailyTotals(results), [results])
  const weeks = useMemo(() => calendarWeeks(totals, now), [totals, now])
  const streak = currentStreak(totals, now)
  const best = useMemo(() => longestStreak(totals), [totals])
  const today = totals.get(dayKey(now)) ?? { ms: 0, tests: 0 }
  const progress = Math.min(1, today.ms / goalMs)

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:items-center">
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-sm text-sub">today</div>
          <div className="text-3xl text-fg">
            {formatDuration(today.ms)} <span className="text-base text-sub">of {dailyGoal}m</span>
          </div>
          <div
            role="progressbar"
            aria-label="Daily goal"
            aria-valuemin={0}
            aria-valuemax={dailyGoal}
            aria-valuenow={Math.min(dailyGoal, Math.floor(today.ms / 60_000))}
            className="mt-2 h-2 rounded-full bg-line"
          >
            <div className="h-full rounded-full bg-main transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-1.5 text-xs text-sub">
            {progress >= 1 ? 'daily goal reached' : `${formatDuration(goalMs - today.ms)} to go`} · change it in settings
          </div>
        </div>
        <dl className="flex gap-8">
          <div>
            <dt className="text-sm text-sub">streak</dt>
            <dd className="flex items-center gap-1.5 text-2xl text-fg">
              <Flame size={20} className={today.tests > 0 ? 'text-main' : 'text-sub'} aria-hidden="true" />
              {streak} {streak === 1 ? 'day' : 'days'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-sub">best streak</dt>
            <dd className="text-2xl text-fg">
              {best} {best === 1 ? 'day' : 'days'}
            </dd>
          </div>
        </dl>
      </div>

      <Calendar weeks={weeks} goalMs={goalMs} />
    </div>
  )
}

/** Shade steps, as a share of the daily goal. The darkest means the goal was met. */
const STEPS = [
  { below: 0.25, className: 'bg-main/20' },
  { below: 0.5, className: 'bg-main/40' },
  { below: 1, className: 'bg-main/65' },
  { below: Infinity, className: 'bg-main' },
]

function shade(ms, goalMs) {
  if (ms === 0) return 'bg-line/60'
  return STEPS.find((step) => ms / goalMs < step.below).className
}

const dateLabel = (date) => new Date(date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })

/**
 * A GitHub-style grid: one column per week, Sunday at the top. Each day's square is shaded by
 * how much of your daily goal you typed, one colour getting deeper (a sequential scale).
 * Hover a day for its numbers.
 */
function Calendar({ weeks, goalMs }) {
  const months = weeks.map((week, i) => {
    const first = week.find((day) => day !== null)
    const month = first && new Date(first.date).toLocaleDateString('en', { month: 'short' })
    const previous = i > 0 && weeks[i - 1][0] && new Date(weeks[i - 1][0].date).toLocaleDateString('en', { month: 'short' })
    return month !== previous ? month : '' // label a column only where a new month starts
  })

  return (
    <figure className="flex flex-col gap-2">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        <div />
        <div className="grid text-[0.65rem] text-sub" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
          {months.map((month, i) => (
            <span key={i} className="overflow-visible whitespace-nowrap">
              {month}
            </span>
          ))}
        </div>

        <div className="grid grid-rows-7 gap-[3px] text-[0.65rem] leading-none text-sub">
          {['', 'mon', '', 'wed', '', 'fri', ''].map((day, i) => (
            <span key={i} className="flex items-center">
              {day}
            </span>
          ))}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
          {weeks.flat().map((day, i) =>
            day === null ? (
              <span key={i} />
            ) : (
              <span
                key={day.key}
                role="img"
                aria-label={`${dateLabel(day.date)}: ${day.tests ? `${formatDuration(day.ms)}, ${day.tests} ${day.tests === 1 ? 'test' : 'tests'}` : 'no practice'}`}
                title={`${dateLabel(day.date)}: ${day.tests ? `${formatDuration(day.ms)} · ${day.tests} ${day.tests === 1 ? 'test' : 'tests'}` : 'no practice'}`}
                className={`aspect-square rounded-[3px] ${shade(day.ms, goalMs)}`}
              />
            ),
          )}
        </div>
      </div>

      <figcaption className="flex items-center justify-end gap-1.5 text-xs text-sub">
        less
        {['bg-line/60', ...STEPS.map((step) => step.className)].map((className) => (
          <span key={className} aria-hidden="true" className={`size-2.5 rounded-[2px] ${className}`} />
        ))}
        goal met
      </figcaption>
    </figure>
  )
}
