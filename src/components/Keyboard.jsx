import { ROWS } from '../lib/qwerty.js'

/**
 * Key widths per row, in key units. A real (ANSI) keyboard is 15 units wide; matching that
 * makes the rows line up like the one under your hands.
 */
const LAYOUT = [
  [...ROWS[0].map((key) => [key, 1]), ['backspace', 2]],
  [['tab', 1.5], ...ROWS[1].slice(0, -1).map((key) => [key, 1]), ['\\', 1.5]],
  [['caps', 1.75], ...ROWS[2].map((key) => [key, 1]), ['enter', 2.25]],
  [['shift-left', 2.25], ...ROWS[3].map((key) => [key, 1]), ['shift-right', 2.75]],
  [['gap-left', 4.375], [' ', 6.25], ['gap-right', 4.375]],
]

const LABELS = {
  backspace: '⌫',
  tab: 'tab',
  caps: 'caps',
  enter: 'enter',
  'shift-left': 'shift',
  'shift-right': 'shift',
  ' ': '',
}

/**
 * A US keyboard drawn to scale and sized to fit its container (it uses container query units,
 * so it shrinks with the space it's given rather than the window). Each key is a 3D keycap
 * (.keycap in index.css).
 *
 * The caller decides how each key looks: `keyProps(id)` returns { className, style, title,
 * labelClassName, tap }. labelClassName styles the letter itself, e.g. to put it on a solid
 * chip so it stays readable on any key colour. `tap` plays the keycap's press once: pass a
 * number, and a different number to press it again. Ids are the characters from ROWS
 * (lowercase), ' ' for space, and 'shift-left', 'shift-right', 'tab', 'caps', 'enter',
 * 'backspace'.
 *
 * @param {{ keyProps: (id: string) => { className?: string, style?: object, title?: string,
 *           labelClassName?: string, tap?: number }, className?: string }} props
 */
export default function Keyboard({ keyProps, className = '' }) {
  return (
    <div className={`@container w-full ${className}`}>
      <div className="flex flex-col" style={{ '--u': 'calc(100cqw / 15)', '--gap': 'calc(var(--u) * 0.12)', gap: 'var(--gap)' }}>
        {LAYOUT.map((row, r) => (
          <div key={r} className="flex" style={{ gap: 'var(--gap)' }}>
            {row.map(([id, width]) => {
              if (id.startsWith('gap')) return <div key={id} style={{ width: `calc(var(--u) * ${width} - var(--gap))` }} />
              const { className: keyClass = '', style, title, labelClassName = '', tap } = keyProps(id)
              const label = Object.hasOwn(LABELS, id) ? LABELS[id] : id.toUpperCase()
              return (
                <div
                  // A new key for each tap: the fresh element plays the press animation from the start.
                  key={tap === undefined ? id : `${id}:${tap}`}
                  title={title}
                  className={`keycap flex items-center justify-center font-typing leading-none ${tap === undefined ? '' : 'keycap-tap'} ${keyClass}`}
                  style={{
                    '--k': 'calc(var(--u) - var(--gap))',
                    width: `calc(var(--u) * ${width} - var(--gap))`,
                    height: 'calc(var(--u) - var(--gap))',
                    fontSize: `calc(var(--u) * ${width > 1 && id !== ' ' ? 0.26 : 0.36})`,
                    ...style,
                  }}
                >
                  {label && <span className={labelClassName}>{label}</span>}
                  {/* The bumps on F and J that let you find the home row without looking. */}
                  {(id === 'f' || id === 'j') && (
                    <span aria-hidden="true" className="absolute bottom-[27%] h-[6%] w-[24%] rounded-full bg-current opacity-60" />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
