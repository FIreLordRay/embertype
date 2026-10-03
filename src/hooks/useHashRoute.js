import { useEffect, useState } from 'react'

/** The app's pages, addressed by the URL hash: #/ (type), #/learn and #/stats. */
const ROUTES = { '#/learn': 'learn', '#/stats': 'stats' }

/**
 * A tiny router. Hash URLs need no server configuration (they work as-is on GitHub Pages),
 * the browser's back button works, and any page can be bookmarked.
 *
 * @returns {'type' | 'learn' | 'stats'}
 */
export function useHashRoute() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}

function readRoute() {
  return Object.hasOwn(ROUTES, window.location.hash) ? ROUTES[window.location.hash] : 'type'
}
