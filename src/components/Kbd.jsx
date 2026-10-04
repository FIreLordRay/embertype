/** A keyboard key, for shortcut hints and key lists: a small 3D keycap (.keycap in index.css). */
export default function Kbd({ children, className = '' }) {
  return (
    <kbd className={`keycap keycap-inline bg-surface font-typing text-[0.85em] text-fg ${className}`}>
      {/* In a span: the keycap lifts element children above its top face, not bare text. */}
      <span>{children}</span>
    </kbd>
  )
}
