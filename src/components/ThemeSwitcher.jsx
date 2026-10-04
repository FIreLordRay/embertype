import { Check, Palette } from 'lucide-react'
import { THEMES } from '../config/themes.js'
import { usePopover } from '../hooks/usePopover.js'
import { useSettings } from '../state/settings.js'

/**
 * Theme picker. Each option's preview sets data-theme on itself, so it renders in its own
 * theme's colours and font: a live preview, with no colours duplicated in JavaScript.
 * That works because index.css maps the tokens with `@theme inline`. The option button
 * itself stays in the current theme, so its focus ring is always visible.
 */
export default function ThemeSwitcher({ className = '' }) {
  const { theme, update } = useSettings()
  const { open, toggle, close, rootRef, buttonRef, panelId } = usePopover()

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`theme: ${theme}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
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
          role="group"
          aria-label="Themes"
          className="absolute right-0 top-full z-20 mt-2 flex w-60 flex-col gap-1 rounded-xl border border-line bg-surface p-1.5 shadow-2xl"
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={t.id === theme}
              onClick={() => {
                update({ theme: t.id })
                close()
              }}
              onMouseDown={(e) => e.preventDefault()}
              className="rounded-lg text-left outline-offset-2 transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-main"
            >
              <span data-theme={t.id} className="flex items-center gap-3 rounded-lg bg-bg px-3 py-2.5 font-typing text-sm text-fg">
                <span aria-hidden="true" className="flex gap-1">
                  <span className="size-2.5 rounded-full bg-main" />
                  <span className="size-2.5 rounded-full bg-correct" />
                  <span className="size-2.5 rounded-full bg-error" />
                </span>
                <span className="flex-1">{t.label}</span>
                {t.id === theme && <Check size={16} className="text-main" aria-hidden="true" />}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
