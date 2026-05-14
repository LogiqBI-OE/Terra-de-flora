// Drawer "Nuevo Cliente" — abre desde el formulario de nuevo proyecto.
// Inspirado en el patron de Dinox: persona fisica / moral toggle + form.
// Por ahora solo retorna un cliente "creado" en memoria (no persiste).

import { useState } from 'react'
import Drawer from '../../../components/ui/Drawer'
import Button from '../../../components/ui/Button'
import TextField from '../../../components/ui/TextField'
import type { Cliente } from '../data/mockData'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (c: Cliente) => void
}

type TipoCliente = 'PF' | 'PM'

export default function NuevoClienteDrawer({ open, onClose, onCreated }: Props) {
  const [tipo, setTipo] = useState<TipoCliente>('PF')
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [razon, setRazon] = useState('')  // si PM
  const [rfc, setRfc] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')

  function handleSave() {
    const fullName = tipo === 'PF'
      ? `${nombre} ${apellidos}`.trim()
      : razon.trim()
    if (!fullName || !telefono.trim()) return
    const newCliente: Cliente = {
      id: Date.now(),
      nombre: fullName,
      tipo,
      telefono: telefono.trim(),
      email: email.trim() || undefined,
      rfc: rfc.trim() || undefined,
    }
    onCreated(newCliente)
    // Reset
    setNombre(''); setApellidos(''); setRazon(''); setRfc(''); setTelefono(''); setEmail('')
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nuevo Cliente"
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar cliente</Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Tipo cliente segmented */}
        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase mb-2 text-app-secondary">
            Tipo de cliente
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

        {/* Datos básicos */}
        {tipo === 'PF' ? (
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Nombre(s)"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Carlos"
            />
            <TextField
              label="Apellidos"
              required
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              placeholder="Sada Martínez"
            />
          </div>
        ) : (
          <TextField
            label="Razón social"
            required
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            placeholder="Hotel Quinta Real S.A. de C.V."
          />
        )}

        <TextField
          label="RFC"
          value={rfc}
          onChange={(e) => setRfc(e.target.value.toUpperCase())}
          placeholder={tipo === 'PF' ? 'SADC850412XXX' : 'IME000101ABC'}
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Teléfono"
            required
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

        <div className="text-[11px] text-app-muted">
          Estos datos son mínimos. Una vez creado el cliente podrás completar dirección,
          notas internas y otra información desde el catálogo de clientes.
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
