import { useSyncExternalStore } from 'react'

/**
 * Screen-reader announcements ("test complete: 72 wpm …"), spoken through one live region
 * that's always on the page (<Announcer />). A live region inserted together with its text
 * often isn't read out at all; new text in one that's already there is.
 */
let current = { text: '', id: 0 }
const listeners = new Set()

/** @param {string} text */
export function announce(text) {
  current = { text, id: current.id + 1 } // a new id, so the same text twice is read twice
  for (const listener of listeners) listener()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The latest announcement, for <Announcer />. */
export function useAnnouncement() {
  return useSyncExternalStore(subscribe, () => current)
}
