// Tab: niveles de usuarios.
// Compone 2 sub-secciones (cada una en su propio archivo):
//   · LevelsDescriptionsTable — editar label + descripción por nivel
//   · LevelsPermissionsMatrix — matriz checkbox permiso × nivel

import { useCallback, useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import { ApiError, levelsApi, type LevelsPayload, type LevelDetail } from '../../../lib/api'
import LevelsDescriptionsTable from './LevelsDescriptionsTable'
import LevelsPermissionsMatrix from './LevelsPermissionsMatrix'

export default function NivelesTab() {
  const [data, setData] = useState<LevelsPayload | null>(null)
  const [draftLevels, setDraftLevels] = useState<Record<number, LevelDetail>>({})
  const [draftMatrix, setDraftMatrix] = useState<Record<number, string[]>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const fresh = await levelsApi.list()
    setData(fresh)
    setDraftLevels(Object.fromEntries(fresh.levels.map((l) => [l.level, l])))
    setDraftMatrix(Object.fromEntries(fresh.levels.map((l) => [l.level, [...l.permissions]])))
  }, [])

  useEffect(() => { reload().catch(() => {}) }, [reload])

  if (!data) return <div className="text-app-secondary text-sm py-8">Cargando...</div>

  const dirtyDescriptions = data.levels.some(
    (l) => draftLevels[l.level]?.label !== l.label || draftLevels[l.level]?.description !== l.description
  )
  const dirtyMatrix = data.levels.some(
    (l) => JSON.stringify([...l.permissions].sort()) !== JSON.stringify([...(draftMatrix[l.level] ?? [])].sort())
  )
  const dirty = dirtyDescriptions || dirtyMatrix

  async function handleSave() {
    if (!data) return
    setBusy(true); setError(null)
    try {
      // 1) Updates de descripciones (uno por uno, solo los cambiados)
      for (const lvl of data.levels) {
        const d = draftLevels[lvl.level]
        if (!d) continue
        if (d.label !== lvl.label || d.description !== lvl.description) {
          await levelsApi.updateMeta(lvl.level, { label: d.label, description: d.description })
        }
      }
      // 2) Matriz bulk si cambió
      if (dirtyMatrix) {
        await levelsApi.updateMatrix(draftMatrix)
      }
      await reload()
      setToast('Cambios guardados')
      setTimeout(() => setToast(null), 2500)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar')
    } finally { setBusy(false) }
  }

  function handleDiscard() {
    setDraftLevels(Object.fromEntries(data!.levels.map((l) => [l.level, l])))
    setDraftMatrix(Object.fromEntries(data!.levels.map((l) => [l.level, [...l.permissions]])))
    setError(null)
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-app mb-1">Descripciones de niveles</h3>
        <p className="text-xs text-app-muted mb-3">
          El número de nivel es fijo. Puedes editar el label y la descripción.
        </p>
        <LevelsDescriptionsTable
          levels={data.levels}
          drafts={draftLevels}
          onChange={(level, field, value) =>
            setDraftLevels({
              ...draftLevels,
              [level]: { ...draftLevels[level]!, [field]: value },
            })
          }
        />
      </section>

      <section>
        <h3 className="text-sm font-semibold text-app mb-1">Matriz de permisos por nivel</h3>
        <p className="text-xs text-app-muted mb-3">
          Define qué permisos trae cada nivel por default. <span className="text-warning">manage_users</span> solo se asigna a L9 (restringido).
        </p>
        <LevelsPermissionsMatrix
          payload={data}
          matrix={draftMatrix}
          onToggle={(level, permission) => {
            const current = draftMatrix[level] ?? []
            const next = current.includes(permission)
              ? current.filter((p) => p !== permission)
              : [...current, permission]
            setDraftMatrix({ ...draftMatrix, [level]: next })
          }}
        />
      </section>

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
