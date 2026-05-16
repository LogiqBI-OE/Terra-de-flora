// Hook de polling que pausa cuando la pestaña no está visible.
//
// Sustituye al patrón:
//   useEffect(() => {
//     const id = setInterval(reload, MS)
//     return () => clearInterval(id)
//   }, [])
//
// Por:
//   usePolling(reload, MS)
//
// Beneficios:
//   - No quema CPU/red mientras tienes la pestaña en background.
//   - Al volver a la pestaña, dispara el callback inmediatamente para que veas
//     datos frescos sin esperar al siguiente tick.

import { useEffect, useRef } from 'react'

export function usePolling(callback: () => void, ms: number, enabled = true): void {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let id: ReturnType<typeof setInterval> | null = null

    function start() {
      if (id !== null) return
      id = setInterval(() => cbRef.current(), ms)
    }
    function stop() {
      if (id !== null) {
        clearInterval(id)
        id = null
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // Refresca inmediatamente al volver a la pestaña
        cbRef.current()
        start()
      } else {
        stop()
      }
    }

    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stop()
    }
  }, [ms, enabled])
}
