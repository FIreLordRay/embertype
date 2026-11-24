import { AtSign, ChevronLeft, ChevronRight, Clock, GraduationCap, Hash, Quote, Target, Terminal, WholeWord } from 'lucide-react'
import { LESSONS } from '../config/lessons.js'
import { EXTRAS_MODES, modeAmount, MODES } from '../config/modes.js'
import { useSettings } from '../state/settings.js'

const ICONS = { time: Clock, words: WholeWord, quote: Quote, practice: Target, lesson: GraduationCap }

/**
 * The test settings, as up to three pills that wrap onto a second line on narrow screens:
 *   [@ punctuation  # numbers  >_ tech]   [time words quote practice learn]   [15 30 60]
 * The extras only apply to time and words tests; in learn mode the lengths become a lesson
 * picker. Changing anything changes the settings, which remounts <TypingTest> with a new test.
 */
export default function ModeBar({ className = '' }) {
  const settings = useSettings()
  const { mode, update } = settings
  const { options, setting, unit } = MODES[mode]
  const selected = modeAmount(settings)

  return (
    <div role="group" aria-label="Test settings" className={`flex flex-wrap items-center justify-center gap-2 text-sm ${className}`}>
      {EXTRAS_MODES.includes(mode) && (
        <div role="group" aria-label="Extras" className="flex rounded-xl bg-surface px-1.5 py-1">
          <Toggle pressed={settings.punctuation} onClick={() => update({ punctuation: !settings.punctuation })}>
            <AtSign size={15} aria-hidden="true" />
            <Label>punctuation</Label>
          </Toggle>
          <Toggle pressed={settings.numbers} onClick={() => update({ numbers: !settings.numbers })}>
            <Hash size={15} aria-hidden="true" />
            <Label>numbers</Label>
          </Toggle>
          <Toggle pressed={settings.tech} onClick={() => update({ tech: !settings.tech })}>
            <Terminal size={15} aria-hidden="true" />
            <Label>tech</Label>
          </Toggle>
        </div>
      )}

      <div role="group" aria-label="Mode" className="flex rounded-xl bg-surface px-1.5 py-1">
        {Object.entries(MODES).map(([id, { label }]) => {
          const Icon = ICONS[id]
          return (
            <Toggle key={id} pressed={mode === id} onClick={() => update({ mode: id })}>
              <Icon size={15} aria-hidden="true" />
              <Label>{label}</Label>
            </Toggle>
          )
        })}
      </div>

      {mode === 'lesson' ? (
        <LessonPicker lesson={selected} onChange={(lesson) => update({ lesson })} />
      ) : (
        <div role="group" aria-label={unit} className="flex rounded-xl bg-surface px-1.5 py-1">
          {options.map((value) => (
            <Toggle key={value} pressed={value === selected} onClick={() => update({ [setting]: value })}>
              {value}
            </Toggle>
          ))}
        </div>
      )}
    </div>
  )
}

/** `‹ lesson 4 ›` plus a link to the full course page. */
function LessonPicker({ lesson, onChange }) {
  return (
    <div className="flex items-center rounded-xl bg-surface px-1.5 py-1">
      <IconButton label="previous lesson" disabled={lesson <= 1} onClick={() => onChange(lesson - 1)}>
        <ChevronLeft size={16} aria-hidden="true" />
      </IconButton>
      <a
        href="#/learn"
        onMouseDown={(e) => e.preventDefault()}
        title="all lessons"
        className="rounded-lg px-2 py-1.5 text-main transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-main"
      >
        lesson {lesson}
        <span className="text-sub"> / {LESSONS.length}</span>
      </a>
      <IconButton label="next lesson" disabled={lesson >= LESSONS.length} onClick={() => onChange(lesson + 1)}>
        <ChevronRight size={16} aria-hidden="true" />
      </IconButton>
    </div>
  )
}

/** Mode and extras labels show from the md breakpoint up; below that, icons only. */
function Label({ children }) {
  return <span className="sr-only md:not-sr-only">{children}</span>
}

// Buttons here don't take focus on click; otherwise the next Space would "press" them
// instead of typing. Keyboard users can still Tab here and press Enter or Space.
const keepFocus = (e) => e.preventDefault()

function Toggle({ pressed, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      onMouseDown={keepFocus}
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

// aria-disabled rather than disabled: a button that becomes disabled while focused (the last
// lesson reached with the keyboard) drops focus to the page, where the next Tab restarts.
function IconButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseDown={keepFocus}
      className="rounded-lg p-1.5 text-sub transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-main aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:text-sub"
    >
      {children}
    </button>
  )
}
