// Tab: matriz de permisos por nivel.
// Filtra niveles ocultos (is_reserved=true). Para mostrar uno, ve a la tab
// "Niveles" y reactiva su checkbox "Visible".

import { useCallback, useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import { ApiError, levelsApi, type LevelsPayload } from '../../../lib/api'
import LevelsPermissionsMatrix from './LevelsPermissionsMatrix'

export default function PermisosTab() {
  const [data, setData] = useState<LevelsPayload | null>(null)
  const [draftMatrix, setDraftMatrix] = useState<Record<number, string[]>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const fresh = await levelsApi.list()
    setData(fresh)
    setDraftMatrix(Object.fromEntries(fresh.levels.map((l) => [l.level, [...l.permissions]])))
  }, [])
  useEffect(() => { reload().catch(() => {}) }, [reload])

  if (!data) return <div className="text-app-secondary text-sm py-8">Cargando...</div>

  const dirty = data.levels.some((l) => {
    const cur = [...l.permissions].sort().join(',')
    const draft = [...(draftMatrix[l.level] ?? [])].sort().join(',')
    return cur !== draft
  })

  // Filtramos niveles ocultos para la vista de matriz.
  const visibleLevels = data.levels.filter((l) => !l.is_reserved)
  const payloadFiltered: LevelsPayload = { ...data, levels: visibleLevels }

  async function handleSave() {
    if (!data) return
    setBusy(true); setError(null)
    try {
      // Mandamos la matriz completa (incluyendo niveles ocultos sin cambios)
      // para no perderlos en caso de que se reactiven después.
      await levelsApi.updateMatrix(draftMatrix)
      await reload()
      setToast('Matriz guardada')
      setTimeout(() => setToast(null), 2500)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar')
    } finally { setBusy(false) }
  }

  function handleDiscard() {
    setDraftMatrix(Object.fromEntries(data!.levels.map((l) => [l.level, [...l.permissions]])))
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-app">Matriz de permisos por nivel</h3>
        <p className="text-xs text-app-muted mt-1">
          Define qué permisos trae cada nivel por default. <span className="text-warning">manage_users</span> solo se asigna a L9 (restringido).
          Los niveles ocultos no aparecen aquí — actívalos primero en la tab <strong>Niveles</strong>.
        </p>
      </div>

      <LevelsPermissionsMatrix
        payload={payloadFiltered}
        matrix={draftMatrix}
        onToggle={(level, permission) => {
          const current = draftMatrix[level] ?? []
          const next = current.includes(permission)
            ? current.filter((p) => p !== permission)
            : [...current, permission]
          setDraftMatrix({ ...draftMatrix, [level]: next })
        }}
      />

      {error && <div className="text-xs text-danger">{error}</div>}

      <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
        <Button variant="secondary" onClick={handleDiscard} disabled={!dirty || busy}>Descartar</Button>
        <Button onClick={handleSave} disabled={!dirty || busy}>
          {busy ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 right-6 px-4 py-3 rounded-lg text-sm text-app shadow-lg border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', zIndex: 200 }}
        >
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
