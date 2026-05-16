// Modal corto para crear un proveedor nuevo desde cualquier flujo
// (editor de receta, drawer de material, etc.). Devuelve el proveedor
// creado al callback `onCreated` para que el padre lo seleccione.

import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { ApiError, proveedoresApi, type Proveedor } from '../../../lib/api'

interface Props {
  initialNombre?: string  // pre-llena el campo si vienes de un buscador
  onClose: () => void
  onCreated: (p: Proveedor) => void
}

export default function ProveedorQuickCreateModal({ initialNombre, onClose, onCreated }: Props) {
  const [nombre, setNombre] = useState(initialNombre ?? '')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!nombre.trim()) {
      setError('Nombre es obligatorio')
      return
    }
    setBusy(true); setError(null)
    try {
      const p = await proveedoresApi.create({
        nombre: nombre.trim(),
        contacto_telefono: telefono.trim() || null,
        notas: notas.trim() || null,
      })
      onCreated(p)
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear')
    } finally { setBusy(false) }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Nuevo proveedor"
      width={420}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={handleSave} disabled={busy || !nombre.trim()}>
            {busy ? 'Creando…' : 'Crear proveedor'}
          </Button>
        </>
      )}
    >
      <div className="space-y-3">
        <Field label="Nombre" required>
          <input
            autoFocus
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Floristería Central"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </Field>
        <Field label="Teléfono">
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Opcional"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </Field>
        <Field label="Notas">
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </Field>

        {error && (
          <div className="text-xs" style={{ color: 'var(--danger)' }}>{error}</div>
        )}
      </div>
    </Modal>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-app-muted font-semibold mb-1">
        {label}{required && <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}
