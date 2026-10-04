import { TriangleAlert } from 'lucide-react'
import { useHistory } from '../state/history.js'

const MESSAGES = {
  newer:
    "Your history was saved by a newer version of embertype. Reload the page to get it; until then, tests in this tab aren't saved.",
  unavailable:
    "This browser isn't letting embertype save (storage is blocked or full), so tests only last until you close this tab.",
}

/** Says so when new tests can't be saved (see SaveStatus in state/history.js). Nothing otherwise. */
export default function StorageNotice() {
  const { status } = useHistory()
  if (status === 'saved') return null
  return (
    <p
      role="alert"
      className="focus-fade flex items-start gap-2.5 rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-fg"
    >
      <TriangleAlert size={16} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
      {MESSAGES[status]}
    </p>
  )
}
