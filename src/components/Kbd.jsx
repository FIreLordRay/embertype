/** A keyboard key, for shortcut hints and the missed-keys list. */
export default function Kbd({ children, className = '' }) {
  return (
    <kbd className={`rounded-md border border-line bg-surface px-1.5 py-0.5 font-typing text-[0.85em] text-fg ${className}`}>
      {children}
    </kbd>
  )
}
