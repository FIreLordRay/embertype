import { Component } from 'react'

/**
 * A page loaded on demand (results, stats, lessons) whose file is gone: embertype was rebuilt
 * or redeployed while this tab was open, and the file names changed. The messages are
 * Chrome's, Firefox's and Safari's, plus Vite's own for a stylesheet.
 */
const isOutdated = (error) =>
  /dynamically imported module|Importing a module script failed|Unable to preload CSS/i.test(String(error?.message))

/**
 * A safety net: if a page crashes while rendering, show a short message with a reload button
 * instead of a blank screen. Your saved settings and history aren't affected.
 *
 * Error boundaries are still class components in React; there's no hook for this.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('embertype hit an error:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const outdated = isOutdated(error)
    return (
      <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
        <h2 className="text-2xl text-fg">{outdated ? 'embertype was updated' : 'something went wrong'}</h2>
        <p className="max-w-sm text-sub">
          {outdated
            ? 'A new version arrived while this tab was open. Reload to get it; your settings and history are saved.'
            : 'This page hit an unexpected error. Your settings and history are saved; reloading usually fixes it.'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-main px-5 py-2.5 text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-main"
        >
          reload
        </button>
      </div>
    )
  }
}
