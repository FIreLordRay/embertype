import { Clock, Target, WholeWord } from 'lucide-react'
import { modeAmount, MODES } from '../config/modes.js'
import { useSettings } from '../state/settings.js'

const ICONS = { time: Clock, words: WholeWord, practice: Target }

/**
 * The test-mode pill: the modes, then the lengths for the selected one.
 *   ⏱ time  ⌸ words  ◎ practice  │  10  25  50
 * Built from MODES in config/modes.js, so a new mode there shows up here automatically.
 * Changing anything changes the settings, which remounts <TypingTest> with a new test.
 */
export default function ModeBar({ className = '' }) {
  const settings = useSettings()
  const { mode, update } = settings
  const { options, setting, unit } = MODES[mode]
  const selected = modeAmount(settings)

  return (
    <nav aria-label="Test mode" className={`flex items-center rounded-xl bg-surface px-2 py-1 text-sm ${className}`}>
      <div role="group" aria-label="Mode" className="flex">
        {Object.entries(MODES).map(([id, { label }]) => {
          const Icon = ICONS[id]
          return (
            <Toggle key={id} pressed={mode === id} onClick={() => update({ mode: id })}>
              <Icon size={15} aria-hidden="true" />
              {/* Icon-only on phones, where the labels don't fit; screen readers always get them. */}
              <span className="sr-only sm:not-sr-only">{label}</span>
            </Toggle>
          )
        })}
      </div>

      <span aria-hidden="true" className="mx-1.5 h-5 w-[3px] shrink-0 rounded-full bg-bg sm:mx-2" />

      <div role="group" aria-label={unit} className="flex">
        {options.map((n) => (
          <Toggle key={n} pressed={n === selected} onClick={() => update({ [setting]: n })}>
            {n}
          </Toggle>
        ))}
      </div>
    </nav>
  )
}

function Toggle({ pressed, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      // Don't take focus on click; otherwise the next Space would "press" this button
      // instead of typing. Keyboard users can still Tab here and press Enter/Space.
      onMouseDown={(e) => e.preventDefault()}
      // Selected gets a tinted pill as well as the accent colour: in some themes accent and
      // grey text are too close to tell apart by colour alone.
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-main ${
        pressed ? 'bg-main/15 text-main' : 'text-sub hover:text-fg'
      }`}
    >
      {children}
    </button>
  )
}
