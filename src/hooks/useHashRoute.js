import { useEffect, useState } from 'react'

/** The app's two pages, addressed by the URL hash: #/ (type) and #/stats. */
const ROUTES = { '#/stats': 'stats' }

/**
 * A tiny router. Hash URLs need no server configuration, the browser's back button works,
 * and http://localhost:4173/#/stats can be bookmarked straight to the dashboard.
 *
 * @returns {'type' | 'stats'}
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
  return ROUTES[window.location.hash] ?? 'type'
}
