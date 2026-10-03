import { Check, Palette } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { THEMES } from '../config/themes.js'
import { useSettings } from '../state/settings.js'

/**
 * Theme picker. Each option sets data-theme on itself, so it renders in its own theme's
 * colours and font: a live preview, with no colours duplicated in JavaScript.
 * That works because index.css maps the tokens with `@theme inline`.
 */
export default function ThemeSwitcher({ className = '' }) {
  const { theme, update } = useSettings()
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
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={`theme: ${theme}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()} // keep focus on the page so typing still works
        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-sub transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-main"
      >
        <Palette size={16} aria-hidden="true" />
        {/* Icon-only on phones; the aria-label above always says "theme: ember". */}
        <span className="hidden md:inline">{theme}</span>
      </button>

      {open && (
        <div
          id={panelId}
          aria-label="Themes"
          className="absolute right-0 top-full z-20 mt-2 flex w-60 flex-col gap-1 rounded-xl border border-line bg-surface p-1.5 shadow-2xl"
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              data-theme={t.id}
              aria-pressed={t.id === theme}
              onClick={() => {
                update({ theme: t.id })
                setOpen(false)
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="flex items-center gap-3 rounded-lg bg-bg px-3 py-2.5 font-typing text-sm text-fg outline-offset-2 transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-main"
            >
              <span aria-hidden="true" className="flex gap-1">
                <span className="size-2.5 rounded-full bg-main" />
                <span className="size-2.5 rounded-full bg-correct" />
                <span className="size-2.5 rounded-full bg-error" />
              </span>
              <span className="flex-1 text-left">{t.label}</span>
              {t.id === theme && <Check size={16} className="text-main" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
