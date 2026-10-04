import { useCallback, useEffect, useId, useRef, useState } from 'react'

/**
 * A button that opens a panel (the settings and theme menus), with keyboard behaviour that
 * never strands focus:
 *  - Escape, or picking something that closes the panel (call `close`), puts focus back on
 *    the button if it was inside the panel. Otherwise focus would fall to the page, where the
 *    next Tab restarts the test.
 *  - A click outside, or tabbing out of it, closes it.
 * Mouse users keep focus on the page the whole time: these buttons don't take focus on click.
 */
export function usePopover() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null) // wraps the button and the panel
  const buttonRef = useRef(null)
  const panelId = useId()

  const close = useCallback(() => {
    if (rootRef.current?.contains(document.activeElement)) buttonRef.current?.focus()
    setOpen(false)
  }, [])

  const toggle = useCallback(() => setOpen((o) => !o), [])

  useEffect(() => {
    if (!open) return
    const root = rootRef.current
    const onPointerDown = (e) => {
      if (!root.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }
    // Focus moved to something outside (Tab past the last option, Shift+Tab past the button).
    const onFocusOut = (e) => {
      if (e.relatedTarget && !root.contains(e.relatedTarget)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    root.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      root.removeEventListener('focusout', onFocusOut)
    }
  }, [open, close])

  return { open, toggle, close, rootRef, buttonRef, panelId }
}
