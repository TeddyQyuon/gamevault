import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
let scrollLocks = 0
let originalOverflow = ''
const activeTraps = []

// Reuse for any drawer/dialog. It owns focus only while open and restores the
// triggering control on close; callback changes do not restart focus handling.
export function useFocusTrap({ open, onClose, ref, initialFocusRef, restoreFocus = true }) {
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    const panel = ref.current
    if (!open || !panel) return
    const previousFocus = document.activeElement
    const trap = Symbol('dialog')
    activeTraps.push(trap)
    if (scrollLocks++ === 0) {
      originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    const targets = () => [...panel.querySelectorAll(FOCUSABLE)].filter(element => element.getClientRects().length && element.getAttribute('aria-hidden') !== 'true')
    const frame = window.requestAnimationFrame(() => {
      const target = initialFocusRef?.current || targets()[0] || panel
      target.focus({ preventScroll: true })
    })
    function keydown(event) {
      if (activeTraps[activeTraps.length - 1] !== trap) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const items = targets()
      if (!items.length) {
        event.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keydown, true)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', keydown, true)
      const position = activeTraps.indexOf(trap)
      if (position !== -1) activeTraps.splice(position, 1)
      if (--scrollLocks === 0) document.body.style.overflow = originalOverflow
      if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [open, ref, initialFocusRef, restoreFocus])
}

export default useFocusTrap
