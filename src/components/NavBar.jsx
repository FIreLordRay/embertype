import { ChartLine, Keyboard } from 'lucide-react'
import ModeBar from './ModeBar.jsx'
import ThemeSwitcher from './ThemeSwitcher.jsx'

/** Links and buttons up here shouldn't take focus on click, or the next Space would press them. */
const keepFocus = (e) => e.preventDefault()

/**
 * Top bar: logo · mode pill (typing page only) · stats/type link and theme picker.
 *
 * A 1fr | auto | 1fr grid keeps the mode pill exactly centred whatever the widths of the
 * logo and the right-hand buttons. On phones it drops to its own row under them.
 * `focus-fade` hides the bar while a test runs (hover brings it back).
 *
 * @param {{ route: 'type' | 'stats' }} props
 */
export default function NavBar({ route }) {
  const onStats = route === 'stats'

  return (
    <header className="focus-fade grid grid-cols-[1fr_auto] items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
      <a
        href="#/"
        aria-label="embertype home"
        onMouseDown={keepFocus}
        className="flex items-center gap-2.5 justify-self-start rounded-lg focus-visible:outline-2 focus-visible:outline-main"
      >
        <img src="/favicon.svg" alt="" className="size-9 rounded-lg" />
        <h1 className="text-xl tracking-tight text-fg sm:text-2xl">
          ember<span className="text-main">type</span>
        </h1>
      </a>

      {!onStats && (
        <ModeBar className="col-span-2 row-start-2 justify-self-center sm:col-span-1 sm:col-start-2 sm:row-start-1" />
      )}

      <div className="flex items-center gap-1 justify-self-end sm:col-start-3">
        <a
          href={onStats ? '#/' : '#/stats'}
          onMouseDown={keepFocus}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-sub transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-main"
        >
          {onStats ? <Keyboard size={16} aria-hidden="true" /> : <ChartLine size={16} aria-hidden="true" />}
          {/* Icon-only on phones (the label doesn't fit); screen readers always get the text. */}
          <span className="sr-only sm:not-sr-only">{onStats ? 'type' : 'stats'}</span>
        </a>
        <ThemeSwitcher />
      </div>
    </header>
  )
}
