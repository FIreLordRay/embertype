import { Settings } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { DAILY_GOALS } from '../config/modes.js'
import { useSettings } from '../state/settings.js'

const SWITCHES = [
  { key: 'fingerGuide', label: 'finger guide', hint: 'a keyboard under the words shows which finger to use' },
  { key: 'paceCaret', label: 'race your best', hint: 'a ghost caret moves at your personal-best speed' },
  { key: 'sound', label: 'sounds', hint: 'a click for each key, a thud for a mistake' },
]

/**
 * The settings popover: on/off switches for the typing aids, and your daily goal.
 * Changes apply straight away, without restarting the test.
 */
export default function SettingsMenu() {
  const settings = useSettings()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const panelId = useId()

  // Close on a click outside, or on Escape.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (!rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="settings"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()} // keep focus on the page so typing still works
        className="flex items-center rounded-lg px-2.5 py-1.5 text-sub transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-main"
      >
        <Settings size={16} aria-hidden="true" />
      </button>

      {open && (
        <div
          id={panelId}
          aria-label="Settings"
          className="absolute right-0 top-full z-20 mt-2 flex w-72 flex-col gap-1 rounded-xl border border-line bg-surface p-2 text-sm shadow-2xl"
        >
          {SWITCHES.map(({ key, label, hint }) => (
            <button
              key={key}
              type="button"
              role="switch"
              aria-checked={settings[key]}
              onClick={() => settings.update({ [key]: !settings[key] })}
              onMouseDown={(e) => e.preventDefault()}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-main"
            >
              <span className="flex-1">
                <span className="block text-fg">{label}</span>
                <span className="block text-xs text-sub">{hint}</span>
              </span>
              {/* The switch track: position and fill both show the state, not colour alone. */}
              <span
                aria-hidden="true"
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${settings[key] ? 'bg-main' : 'bg-line'}`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-bg transition-transform ${settings[key] ? 'translate-x-4.5' : 'translate-x-0.5'}`}
                />
              </span>
            </button>
          ))}

          <div className="mt-1 border-t border-line px-2.5 pt-3 pb-1">
            <div className="text-fg">daily goal</div>
            <div className="text-xs text-sub">minutes of typing a day; the stats page tracks it</div>
            <div role="group" aria-label="Daily goal in minutes" className="mt-2 flex gap-1">
              {DAILY_GOALS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  aria-pressed={settings.dailyGoal === minutes}
                  onClick={() => settings.update({ dailyGoal: minutes })}
                  onMouseDown={(e) => e.preventDefault()}
                  className={`flex-1 rounded-lg py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-main ${
                    settings.dailyGoal === minutes ? 'bg-main/15 text-main' : 'text-sub hover:text-fg'
                  }`}
                >
                  {minutes}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
