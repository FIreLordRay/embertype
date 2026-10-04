import { Download, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { dayKey } from '../../lib/streak.js'
import { exportHistory, MAX_RESULTS } from '../../state/history.js'

/**
 * Your data: export it to a file, import a file (to move your history to another browser or
 * restore a backup), or clear it. Importing merges by test id, so importing the same file
 * twice adds nothing.
 *
 * @param {{ results: import('../../lib/history.js').TestResult[],
 *           onImport: (fileContents: unknown) => import('../../state/history.js').ImportSummary,
 *           onClear?: () => void }} props
 */
export default function DataActions({ results, onImport, onClear }) {
  const fileRef = useRef(null)
  const [message, setMessage] = useState('')

  const exportFile = () => {
    const url = URL.createObjectURL(new Blob([exportHistory(results)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `embertype-history-${dayKey(Date.now())}.json`
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0) // after the browser has started the download
  }

  const importFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // so choosing the same file again still triggers a change
    if (!file) return
    try {
      setMessage(importMessage(onImport(JSON.parse(await file.text()))))
    } catch {
      setMessage("Couldn't read that file: it isn't an embertype export.")
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
      {/* Always on the page (empty until there's news), so screen readers read new messages. */}
      <span role="status" className="mr-auto text-sub">
        {message}
      </span>
      {results.length > 0 && (
        <ActionButton onClick={exportFile} icon={Download}>
          export
        </ActionButton>
      )}
      <ActionButton onClick={() => fileRef.current.click()} icon={Upload}>
        import
      </ActionButton>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importFile} />
      {results.length > 0 && onClear && <ClearHistory count={results.length} onClear={onClear} />}
    </div>
  )
}

/** What an import did, in words: "Imported 12 new tests · 3 already here." */
function importMessage({ valid, added, present, newer }) {
  if (newer) return 'That file is from a newer version of embertype. Reload this page to update, then import it again.'
  if (valid === 0) return "That file doesn't contain any embertype results."
  const tooOld = valid - added - present
  const parts = [`Imported ${added} new ${added === 1 ? 'test' : 'tests'}`]
  if (present > 0) parts.push(`${present} already here`)
  if (tooOld > 0) parts.push(`${tooOld} older than the ${MAX_RESULTS.toLocaleString('en')} tests kept`)
  return `${parts.join(' · ')}.`
}

function ActionButton({ onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sub transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-main"
    >
      <Icon size={14} aria-hidden="true" />
      {children}
    </button>
  )
}

/** Deleting everything takes two clicks; moving away cancels. */
function ClearHistory({ count, onClear }) {
  const [confirming, setConfirming] = useState(false)
  return (
    <button
      type="button"
      onClick={() => (confirming ? onClear() : setConfirming(true))}
      onMouseLeave={() => setConfirming(false)}
      onBlur={() => setConfirming(false)}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-main ${
        confirming ? 'bg-error/15 text-error' : 'text-sub hover:text-fg'
      }`}
    >
      <Trash2 size={14} aria-hidden="true" />
      {confirming ? `click again to delete all ${count} tests` : 'clear history'}
    </button>
  )
}
