import { useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import TextField from '../../../components/ui/TextField'
import { IconPlus } from '../../../components/icons/Icons'
import { ApiError, catalogApi, type Producto } from '../../../lib/api'
import CrudTable, { type Column } from './CrudTable'

interface FormState {
  id: number | null
  sku: string
  nombre: string
  unidad: string
  familia: string
  categoria: string
}

const EMPTY: FormState = { id: null, sku: '', nombre: '', unidad: 'kg', familia: '', categoria: '' }

export default function ProductosTab() {
  const [rows, setRows] = useState<Producto[]>([])
  const [modal, setModal] = useState<FormState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function reload() {
    setRows(await catalogApi.productos())
  }
  useEffect(() => { reload() }, [])

  async function handleSave() {
    if (!modal) return
    setBusy(true)
    setError(null)
    try {
      if (modal.id === null) {
        await catalogApi.createProducto({
          sku: modal.sku, nombre: modal.nombre, unidad: modal.unidad,
          familia: modal.familia || null, categoria: modal.categoria || null,
        })
      } else {
        await catalogApi.updateProducto(modal.id, {
          nombre: modal.nombre, unidad: modal.unidad,
          familia: modal.familia || null, categoria: modal.categoria || null,
        })
      }
      setModal(null)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error inesperado.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(row: Producto) {
    if (!confirm(`¿Eliminar producto "${row.sku} — ${row.nombre}"?`)) return
    try {
      await catalogApi.deleteProducto(row.id)
      await reload()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Error al eliminar')
    }
  }

  const columns: Column<Producto>[] = [
    { header: 'SKU', cell: (p) => <span className="font-mono text-app-secondary">{p.sku}</span> },
    { header: 'Nombre', cell: (p) => p.nombre },
    { header: 'Unidad', cell: (p) => p.unidad, width: '90px' },
    { header: 'Familia', cell: (p) => p.familia || '—' },
    { header: 'Categoría', cell: (p) => p.categoria || '—' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModal({ ...EMPTY })}>
          <IconPlus size={14} />
          Nuevo producto
        </Button>
      </div>

      <CrudTable
        rows={rows}
        columns={columns}
        onEdit={(p) => setModal({
          id: p.id, sku: p.sku, nombre: p.nombre, unidad: p.unidad,
          familia: p.familia || '', categoria: p.categoria || '',
        })}
        onDelete={handleDelete}
        empty="Sin productos. Crea el primero o sube un Excel."
      />

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.id === null ? 'Nuevo producto' : `Editar ${modal?.sku}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        {modal && (
          <div className="space-y-3">
            <TextField
              label="SKU"
              value={modal.sku}
              disabled={modal.id !== null}
              onChange={(e) => setModal({ ...modal, sku: e.target.value })}
              placeholder="AGU-001"
            />
            <TextField
              label="Nombre"
              value={modal.nombre}
              onChange={(e) => setModal({ ...modal, nombre: e.target.value })}
              placeholder="Aguacate Hass A"
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Unidad"
                value={modal.unidad}
                onChange={(e) => setModal({ ...modal, unidad: e.target.value })}
                placeholder="kg, L, pz"
              />
              <TextField
                label="Familia"
                value={modal.familia}
                onChange={(e) => setModal({ ...modal, familia: e.target.value })}
                placeholder="Aceites"
              />
            </div>
            <TextField
              label="Categoría"
              value={modal.categoria}
              onChange={(e) => setModal({ ...modal, categoria: e.target.value })}
              placeholder="Retail / Industrial"
            />
            {error && <div className="text-xs text-danger">{error}</div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
