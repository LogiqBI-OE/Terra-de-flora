// Modal para crear un material nuevo desde el editor de receta.
// Permite también crear proveedor en línea (otro modal anidado).

import { useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import {
  ApiError,
  materialesApi,
  proveedoresApi,
  type Material,
  type MaterialCatalog,
  type Proveedor,
} from '../../../lib/api'
import ProveedorQuickCreateModal from './ProveedorQuickCreateModal'

interface Props {
  initialNombre?: string
  onClose: () => void
  onCreated: (m: Material) => void
}

export default function MaterialQuickCreateModal({ initialNombre, onClose, onCreated }: Props) {
  const [nombre, setNombre] = useState(initialNombre ?? '')
  const [familia, setFamilia] = useState('Flor')
  const [unidad, setUnidad] = useState('Pieza')
  const [contenido, setContenido] = useState('1')
  const [precio, setPrecio] = useState('0')
  const [proveedorId, setProveedorId] = useState<number | null>(null)
  const [colorHex, setColorHex] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [catalog, setCatalog] = useState<MaterialCatalog | null>(null)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [proveedorModalOpen, setProveedorModalOpen] = useState(false)

  // Carga inicial de familias, unidades y proveedores
  useEffect(() => {
    Promise.all([
      materialesApi.catalog(),
      proveedoresApi.list(),
    ]).then(([cat, provs]) => {
      setCatalog(cat)
      setProveedores(provs)
      if (cat.familias.length && !cat.familias.includes(familia)) {
        setFamilia(cat.familias[0])
      }
      if (cat.unidades.length && !cat.unidades.includes(unidad)) {
        setUnidad(cat.unidades[0])
      }
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    if (!nombre.trim()) {
      setError('Nombre es obligatorio')
      return
    }
    const contenidoN = Number(contenido)
    const precioN = Number(precio)
    if (!Number.isFinite(contenidoN) || contenidoN <= 0) {
      setError('Piezas por paquete debe ser un número mayor a 0')
      return
    }
    if (!Number.isFinite(precioN) || precioN < 0) {
      setError('Precio del paquete debe ser un número >= 0')
      return
    }
    setBusy(true); setError(null)
    try {
      const m = await materialesApi.create({
        nombre: nombre.trim(),
        familia,
        unidad,
        contenido_por_paquete: contenidoN,
        precio_paquete: precioN,
        proveedor_id: proveedorId,
        color_hex: colorHex.trim() || null,
      })
      onCreated(m)
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear el material')
    } finally { setBusy(false) }
  }

  function handleProveedorCreated(p: Proveedor) {
    setProveedores((prev) => [p, ...prev])
    setProveedorId(p.id)
  }

  const precioUnit = (() => {
    const cn = Number(contenido)
    const pn = Number(precio)
    if (!Number.isFinite(cn) || cn <= 0 || !Number.isFinite(pn)) return 0
    return pn / cn
  })()

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title="Nuevo material"
        width={520}
        footer={(
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button>
            <Button onClick={handleSave} disabled={busy || !nombre.trim()}>
              {busy ? 'Creando…' : 'Crear material'}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          <Field label="Nombre del material" required>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Rosa - lila"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Familia">
              <select
                value={familia}
                onChange={(e) => setFamilia(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                {(catalog?.familias ?? [familia]).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Unidad">
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                {(catalog?.unidades ?? [unidad]).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Pzas por paquete" required>
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm text-right"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </Field>
            <Field label="Precio del paquete" required>
              <input
                type="number"
                min={0}
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm text-right"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </Field>
          </div>

          {precioUnit > 0 && (
            <div
              className="text-xs px-3 py-2 rounded-lg flex items-center justify-between"
              style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
            >
              <span>Precio unitario calculado:</span>
              <strong>${precioUnit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</strong>
            </div>
          )}

          <Field label="Proveedor">
            <div className="flex items-center gap-2">
              <select
                value={proveedorId ?? 0}
                onChange={(e) => setProveedorId(Number(e.target.value) || null)}
                className="flex-1 px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value={0}>— Sin proveedor —</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              <button
                onClick={() => setProveedorModalOpen(true)}
                className="px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
              >
                + Nuevo
              </button>
            </div>
          </Field>

          <Field label="Color (opcional)">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorHex || '#cccccc'}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-12 h-10 rounded-md border cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              />
              <input
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                placeholder="#ec4899"
                className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              {colorHex && (
                <button
                  onClick={() => setColorHex('')}
                  className="text-xs text-app-muted hover:text-app px-2"
                  title="Quitar color (se genera automático del nombre)"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="text-[10px] text-app-muted mt-1">
              Si lo dejas vacío, se genera un color automático del nombre.
            </div>
          </Field>

          {error && (
            <div
              className="text-xs px-3 py-2 rounded-lg border"
              style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}
        </div>
      </Modal>

      {proveedorModalOpen && (
        <ProveedorQuickCreateModal
          onClose={() => setProveedorModalOpen(false)}
          onCreated={handleProveedorCreated}
        />
      )}
    </>
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
