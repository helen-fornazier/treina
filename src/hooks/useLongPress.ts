import { useRef, useState } from 'react'

export function useLongPress(delay = 500) {
  const [active, setActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didFire = useRef(false)

  function onPointerDown() {
    didFire.current = false
    timerRef.current = setTimeout(() => {
      didFire.current = true
      if ('vibrate' in navigator) navigator.vibrate(30)
      setActive(true)
    }, delay)
  }

  function cancel() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  function close() {
    setActive(false)
  }

  return { active, close, didFire, onPointerDown, cancel }
}
