// Tab: "hoja de trabajo" del SystemConfig.
// Las claves del backend se agrupan por su campo `section` (Accesos, etc).
// Tambien renderiza secciones placeholder solo-HTML (Licencia) — esos campos
// no estan conectados a la DB todavia.

import { useEffect, useMemo, useState } from 'react'
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

  // Agrupa items por section, preservando el orden de aparicion del array.
  const grouped = useMemo(() => {
    const map = new Map<string, SystemConfigItem[]>()
    for (const it of items) {
      const k = it.section || 'Accesos'
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(it)
    }
    return Array.from(map.entries()) // [ [section, items[]], ... ]
  }, [items])

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
    <div className="space-y-8">
      {grouped.map(([section, sectionItems]) => (
        <SectionBlock key={section} title={section}>
          <div className="space-y-5">
            {sectionItems.map((item) => (
              <ConfigItemEditor
                key={item.key}
                item={item}
                draft={draft[item.key] ?? ''}
                onChange={(v) => setDraft({ ...draft, [item.key]: v })}
              />
            ))}
          </div>
        </SectionBlock>
      ))}

      {/* Placeholder: Licencia (no conectado a backend todavia) */}
      <LicenciaPlaceholderSection />

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

// ── Helpers UI ─────────────────────────────────────────────────────────────

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-app-secondary">
          {title}
        </h3>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>
      <div className="pl-1">{children}</div>
    </section>
  )
}

// Seccion estatica solo-HTML, sin persistencia. Sirve de placeholder visual
// hasta que decidamos meterlo a DB.
function LicenciaPlaceholderSection() {
  return (
    <SectionBlock title="Licencia">
      <div className="space-y-5 opacity-90">
        <div className="text-[11px] uppercase tracking-widest text-app-muted -mt-2 mb-2">
          (placeholder — los valores aún no se persisten en BD)
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-app">Estatus de licencia</div>
          <div className="text-xs text-app-muted">¿La licencia está activa?</div>
          <select
            className="w-full max-w-sm px-3 py-2 rounded-lg border text-sm"
            defaultValue="activa"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="activa">Activa</option>
            <option value="suspendida">Suspendida</option>
            <option value="vencida">Vencida</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-app">Tipo de licencia</div>
          <div className="text-xs text-app-muted">Plan contratado actual.</div>
          <select
            className="w-full max-w-sm px-3 py-2 rounded-lg border text-sm"
            defaultValue="standard"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="trial">Trial</option>
            <option value="standard">Standard</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-app">Vigente hasta</div>
          <div className="text-xs text-app-muted">Fecha de expiración de la licencia.</div>
          <input
            type="date"
            defaultValue="2026-12-31"
            className="w-full max-w-sm px-3 py-2 rounded-lg border text-sm"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold text-app">Máximo de usuarios</div>
          <div className="text-xs text-app-muted">Límite de cuentas activas que permite la licencia.</div>
          <input
            type="number"
            min={1}
            defaultValue={50}
            className="w-full max-w-sm px-3 py-2 rounded-lg border text-sm"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>
    </SectionBlock>
  )
}
