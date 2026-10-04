import { useAnnouncement } from '../state/announcer.js'

/** The app's one polite live region (see announce()). Visually hidden, always mounted. */
export default function Announcer() {
  const { text, id } = useAnnouncement()
  return (
    <div aria-live="polite" className="sr-only">
      {/* Keyed, so each announcement is a new node: screen readers read additions. */}
      <span key={id}>{text}</span>
    </div>
  )
}
