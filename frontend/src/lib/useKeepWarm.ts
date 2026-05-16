// Keep-warm: hook que pinguea /health del backend cada N minutos mientras
// el usuario tenga la app abierta. Controlado por SystemConfig (toggle L9).
//
// Lee la config al cargar la app. Si está apagado: no hace nada.
// Si está prendido: corre un setInterval que pinguea aunque la pestaña
// esté en background (justo lo que queremos: mantener el backend caliente).

import { useEffect, useRef, useState } from 'react'
import { API_URL, systemConfigApi, type RuntimeConfig } from './api'
import { useAuth } from './auth'

export function useKeepWarm(): void {
  const { user } = useAuth()
  const [cfg, setCfg] = useState<RuntimeConfig | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Carga config una vez por sesión (cuando el user se loguea)
  useEffect(() => {
    if (!user) {
      setCfg(null)
      return
    }
    systemConfigApi.runtime()
      .then(setCfg)
      .catch(() => setCfg({ keep_warm_ping_enabled: false, keep_warm_ping_interval_minutes: 5 }))
  }, [user?.id])

  // Refresca config cada 10 min para que el toggle del admin tome efecto
  // sin necesidad de relogin.
  useEffect(() => {
    if (!user) return
    const id = setInterval(() => {
      systemConfigApi.runtime().then(setCfg).catch(() => {})
    }, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [user?.id])

  // Setup del ping según config
  useEffect(() => {
    function stop() {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    stop()
    if (!cfg || !cfg.keep_warm_ping_enabled || !user) return

    const ms = Math.max(60_000, cfg.keep_warm_ping_interval_minutes * 60_000)

    async function ping() {
      try {
        await fetch(`${API_URL}/health`, { method: 'GET' })
      } catch {/* silencioso */}
    }

    // Ping inmediato + cada N min
    ping()
    timerRef.current = setInterval(ping, ms)

    return stop
  }, [cfg?.keep_warm_ping_enabled, cfg?.keep_warm_ping_interval_minutes, user?.id])
}
