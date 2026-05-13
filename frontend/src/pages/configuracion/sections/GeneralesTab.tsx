// Tab: claves del SystemConfig (standard_password, futuras claves).

import { useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import { ApiError, systemConfigApi, type SystemConfigItem } from '../../../lib/api'
import ConfigItemEditor from './ConfigItemEditor'

export default function GeneralesTab() {
  const [items, setItems] = useState<SystemConfigItem[]>([])
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function reload() {
    const data = await systemConfigApi.list()
    setItems(data)
    setDraft(Object.fromEntries(data.map((i) => [i.key, i.value])))
  }
  useEffect(() => { reload().catch(() => {}) }, [])

  const dirty = items.some((i) => draft[i.key] !== i.value)

  async function handleSave() {
    setBusy(true); setError(null)
    try {
      const changed = Object.fromEntries(
        items.filter((i) => draft[i.key] !== i.value).map((i) => [i.key, draft[i.key]!])
      )
      const updated = await systemConfigApi.update(changed)
      setItems(updated)
      setDraft(Object.fromEntries(updated.map((i) => [i.key, i.value])))
      setToast('Cambios guardados')
      setTimeout(() => setToast(null), 2500)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar')
    } finally { setBusy(false) }
  }

  function handleDiscard() {
    setDraft(Object.fromEntries(items.map((i) => [i.key, i.value])))
    setError(null)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-0">
        {items.map((item, idx) => (
          <div
            key={item.key}
            className="py-4"
            style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border-soft)' }}
          >
            <ConfigItemEditor
              item={item}
              draft={draft[item.key] ?? ''}
              onChange={(v) => setDraft({ ...draft, [item.key]: v })}
            />
          </div>
        ))}
      </div>

      {error && <div className="text-xs text-danger">{error}</div>}

      <div className="flex items-center justify-end gap-2 pt-2">
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
