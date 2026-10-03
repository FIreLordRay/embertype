import { ChartLine, Flame, GraduationCap, Keyboard } from 'lucide-react'
import { useMemo } from 'react'
import { useNow } from '../hooks/useNow.js'
import { currentStreak, dailyTotals, dayKey } from '../lib/streak.js'
import { useHistory } from '../state/history.js'
import { useSettings } from '../state/settings.js'
import SettingsMenu from './SettingsMenu.jsx'
import ThemeSwitcher from './ThemeSwitcher.jsx'

/** Links and buttons up here shouldn't take focus on click, or the next Space would press them. */
const keepFocus = (e) => e.preventDefault()

const PAGES = [
  { route: 'type', href: '#/', label: 'type', icon: Keyboard },
  { route: 'learn', href: '#/learn', label: 'learn', icon: GraduationCap },
  { route: 'stats', href: '#/stats', label: 'stats', icon: ChartLine },
]

/**
 * Top bar: logo on the left; streak, page links, settings and theme on the right.
 * Labels show from the md breakpoint up (icons only below), and the wordmark from sm up,
 * so everything fits on a phone. `focus-fade` hides the bar while a test runs.
 *
 * @param {{ route: 'type' | 'learn' | 'stats' }} props
 */
export default function NavBar({ route }) {
  return (
    <header className="focus-fade flex items-center justify-between gap-3">
      <a
        href="#/"
        aria-label="embertype home"
        onMouseDown={keepFocus}
        className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-main"
      >
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-9 rounded-lg" />
        <h1 className="hidden text-2xl tracking-tight text-fg sm:block">
          ember<span className="text-main">type</span>
        </h1>
      </a>

      <nav aria-label="Main" className="flex items-center gap-0.5">
        <StreakBadge />
        {PAGES.map(({ route: id, href, label, icon: Icon }) => (
          <a
            key={id}
            href={href}
            aria-current={route === id ? 'page' : undefined}
            onMouseDown={keepFocus}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-main ${
              route === id ? 'bg-main/15 text-main' : 'text-sub hover:text-fg'
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            <span className="sr-only md:not-sr-only">{label}</span>
          </a>
        ))}
        <SettingsMenu />
        <ThemeSwitcher />
      </nav>
    </header>
  )
}

/**
 * 🔥 and your streak in days. The flame is lit once you've practiced today, and dim while
 * today's practice is still to come (the streak is at stake).
 */
function StreakBadge() {
  const { results } = useHistory()
  const { dailyGoal } = useSettings()
  const now = useNow()
  const totals = useMemo(() => dailyTotals(results), [results])
  const streak = currentStreak(totals, now)
  if (streak === 0) return null

  const todayMinutes = Math.floor((totals.get(dayKey(now))?.ms ?? 0) / 60_000)
  const practicedToday = totals.has(dayKey(now))
  const days = `${streak}-day streak`
  return (
    <a
      href="#/stats"
      onMouseDown={keepFocus}
      title={`${days}: ${todayMinutes} of ${dailyGoal} minutes today`}
      aria-label={`${days}, ${todayMinutes} of ${dailyGoal} minutes today`}
      className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm tabular-nums transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-main ${
        practicedToday ? 'text-main' : 'text-sub'
      }`}
    >
      <Flame size={16} aria-hidden="true" />
      {streak}
    </a>
  )
}
