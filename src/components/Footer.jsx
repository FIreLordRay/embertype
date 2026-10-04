import Kbd from './Kbd.jsx'

/** Keyboard shortcuts, plus a note for touch devices (there's no on-screen keyboard support yet). */
export default function Footer() {
  return (
    <footer className="focus-fade flex flex-col items-center gap-3 text-xs text-sub">
      <p className="hidden rounded-lg bg-surface px-3 py-2 text-center text-fg pointer-coarse:block">
        embertype needs a physical keyboard. On-screen keyboards aren&apos;t supported yet.
      </p>
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        <li>
          <Kbd>tab</Kbd> restart
        </li>
        <li>
          <Kbd>ctrl</Kbd> (<Kbd>⌥</Kbd> on Mac) + <Kbd>backspace</Kbd> delete word
        </li>
        <li>
          <Kbd>enter</Kbd> next test (on results)
        </li>
      </ul>
    </footer>
  )
}
