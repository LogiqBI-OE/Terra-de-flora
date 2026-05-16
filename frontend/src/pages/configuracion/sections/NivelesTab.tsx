// Tab: solo descripciones de niveles + toggle Visible (oculto).
// Cada save toca cada nivel modificado (label, description, is_reserved).

import { useCallback, useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import { ApiError, levelsApi, type LevelDetail } from '../../../lib/api'
import LevelsDescriptionsTable from './LevelsDescriptionsTable'

export default function NivelesTab() {
  const [original, setOriginal] = useState<LevelDetail[]>([])
  const [drafts, setDrafts] = useState<Record<number, LevelDetail>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const fresh = await levelsApi.list()
    setOriginal(fresh.levels)
    setDrafts(Object.fromEntries(fresh.levels.map((l) => [l.level, l])))
  }, [])
  useEffect(() => { reload().catch(() => {}) }, [reload])

  const dirty = original.some((l) => {
    const d = drafts[l.level]
    if (!d) return false
    return d.label !== l.label || d.description !== l.description || d.is_reserved !== l.is_reserved
  })

  async function handleSave() {
    setBusy(true); setError(null)
    try {
      for (const l of original) {
        const d = drafts[l.level]
        if (!d) continue
        if (
          d.label !== l.label ||
          d.description !== l.description ||
          d.is_reserved !== l.is_reserved
        ) {
          await levelsApi.updateMeta(l.level, {
            label: d.label,
            description: d.description,
            is_reserved: d.is_reserved,
          })
        }
      }
      await reload()
      setToast('Cambios guardados')
      setTimeout(() => setToast(null), 2500)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar')
    } finally { setBusy(false) }
  }

  function handleDiscard() {
    setDrafts(Object.fromEntries(original.map((l) => [l.level, l])))
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-app">Descripciones de niveles</h3>
          <p className="text-xs text-app-muted mt-1">
            El número de nivel es fijo. Edita label, descripción o desactiva la
            columna <strong>Visible</strong> para ocultar un nivel del sistema.
            Los niveles ocultos no aparecen en el selector al crear/editar usuarios
            ni en la matriz de permisos.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" onClick={handleDiscard} disabled={!dirty || busy}>Descartar</Button>
          <Button onClick={handleSave} disabled={!dirty || busy}>
            {busy ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      {error && <div className="text-xs text-danger">{error}</div>}

      <LevelsDescriptionsTable
        levels={original}
        drafts={drafts}
        onChange={(level, field, value) =>
          setDrafts({
            ...drafts,
            [level]: { ...drafts[level]!, [field]: value },
          })
        }
      />

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
