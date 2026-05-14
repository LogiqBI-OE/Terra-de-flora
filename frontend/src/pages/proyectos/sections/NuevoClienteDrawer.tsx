// Drawer "Nuevo Cliente" — abre desde el formulario de nuevo proyecto.
// Crea el cliente contra el backend real (POST /clientes) y devuelve el resultado.

import { useState } from 'react'
import Drawer from '../../../components/ui/Drawer'
import Button from '../../../components/ui/Button'
import TextField from '../../../components/ui/TextField'
import { ApiError, clientesApi, type Cliente, type TipoCliente } from '../../../lib/api'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (c: Cliente) => void
}

const FUENTES_CONTACTO = ['Instagram', 'Facebook', 'Recomendado', 'De otro evento', 'Otros']

export default function NuevoClienteDrawer({ open, onClose, onCreated }: Props) {
  const [tipo, setTipo] = useState<TipoCliente>('PF')
  const [nombre, setNombre] = useState('')
  const [razon, setRazon] = useState('')
  const [rfc, setRfc] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [contactoFuente, setContactoFuente] = useState<string>('')
  const [contactoOtro, setContactoOtro] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setNombre(''); setRazon(''); setRfc(''); setTelefono(''); setEmail('')
    setContactoFuente(''); setContactoOtro('')
    setError(null)
  }

  function resolveContacto(): string | null {
    if (!contactoFuente) return null
    if (contactoFuente === 'Otros') return contactoOtro.trim() || 'Otros'
    return contactoFuente
  }

  async function handleSave() {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    setBusy(true); setError(null)
    try {
      const created = await clientesApi.create({
        nombre: nombre.trim(),
        tipo,
        razon_social: tipo === 'PM' ? (razon.trim() || null) : null,
        rfc: rfc.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        como_nos_contacto: resolveContacto(),
      })
      onCreated(created)
      reset()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al crear cliente')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={() => { onClose(); reset() }}
      title="Nuevo Cliente"
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={() => { onClose(); reset() }} disabled={busy}>Cancelar</Button>
          <Button onClick={handleSave} disabled={busy || !nombre.trim()}>
            {busy ? 'Guardando…' : 'Guardar cliente'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase mb-2 text-app-secondary">
            Tipo de cliente <span style={{ color: 'var(--danger)' }}>*</span>
          </div>
          <div className="inline-flex rounded-lg p-1" style={{ background: 'var(--bg-toggle)' }}>
            <SegButton active={tipo === 'PF'} onClick={() => setTipo('PF')}>
              👤 Persona física
            </SegButton>
            <SegButton active={tipo === 'PM'} onClick={() => setTipo('PM')}>
              🏢 Persona moral
            </SegButton>
          </div>
        </div>

        <TextField
          label={tipo === 'PF' ? 'Nombre completo' : 'Nombre comercial'}
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={tipo === 'PF' ? 'Carlos Sada Martínez' : 'Hotel Quinta Real'}
        />
        {tipo === 'PM' && (
          <TextField
            label="Razón social"
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            placeholder="Hotel Quinta Real S.A. de C.V."
          />
        )}
        <TextField
          label="RFC"
          value={rfc}
          onChange={(e) => setRfc(e.target.value.toUpperCase())}
          placeholder={tipo === 'PF' ? 'SADC850412XXX' : 'QRH000101ABC'}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="818-234-5678"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@ejemplo.com"
          />
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
            ¿Cómo nos contactó?
          </div>
          <select
            value={contactoFuente}
            onChange={(e) => setContactoFuente(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="">— Selecciona —</option>
            {FUENTES_CONTACTO.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          {contactoFuente === 'Otros' && (
            <input
              type="text"
              value={contactoOtro}
              onChange={(e) => setContactoOtro(e.target.value)}
              placeholder="Especifica cómo nos contactó"
              className="w-full mt-2 px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          )}
        </div>

        {error && <div className="text-xs text-danger">{error}</div>}

        <div className="text-[11px] text-app-muted">
          Más adelante puedes completar dirección, notas internas y otra
          información desde el catálogo de Clientes.
        </div>
      </div>
    </Drawer>
  )
}

function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-md text-xs font-semibold transition"
      style={{
        background: active ? 'var(--bg-card)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {children}
    </button>
  )
}
