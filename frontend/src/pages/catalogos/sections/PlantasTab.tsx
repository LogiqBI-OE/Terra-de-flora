import { useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import TextField from '../../../components/ui/TextField'
import { IconPlus } from '../../../components/icons/Icons'
import { ApiError, catalogApi, type Planta } from '../../../lib/api'
import CrudTable, { type Column } from './CrudTable'

interface FormState {
  id: number | null
  codigo: string
  nombre: string
  ubicacion: string
}
const EMPTY: FormState = { id: null, codigo: '', nombre: '', ubicacion: '' }

export default function PlantasTab() {
  const [rows, setRows] = useState<Planta[]>([])
  const [modal, setModal] = useState<FormState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function reload() { setRows(await catalogApi.plantas()) }
  useEffect(() => { reload() }, [])

  async function handleSave() {
    if (!modal) return
    setBusy(true); setError(null)
    try {
      if (modal.id === null) {
        await catalogApi.createPlanta({ codigo: modal.codigo, nombre: modal.nombre, ubicacion: modal.ubicacion || null })
      } else {
        await catalogApi.updatePlanta(modal.id, { nombre: modal.nombre, ubicacion: modal.ubicacion || null })
      }
      setModal(null); await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error inesperado.')
    } finally { setBusy(false) }
  }

  async function handleDelete(row: Planta) {
    if (!confirm(`¿Eliminar planta "${row.codigo} — ${row.nombre}"?`)) return
    try { await catalogApi.deletePlanta(row.id); await reload() }
    catch (e) { alert(e instanceof ApiError ? e.message : 'Error') }
  }

  const columns: Column<Planta>[] = [
    { header: 'Código', cell: (p) => <span className="font-mono text-app-secondary">{p.codigo}</span> },
    { header: 'Nombre', cell: (p) => p.nombre },
    { header: 'Ubicación', cell: (p) => p.ubicacion || '—' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModal({ ...EMPTY })}><IconPlus size={14} /> Nueva planta</Button>
      </div>
      <CrudTable
        rows={rows}
        columns={columns}
        onEdit={(p) => setModal({ id: p.id, codigo: p.codigo, nombre: p.nombre, ubicacion: p.ubicacion || '' })}
        onDelete={handleDelete}
        empty="Sin plantas registradas."
      />
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.id === null ? 'Nueva planta' : `Editar ${modal?.codigo}`}
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</Button>
        </>}
      >
        {modal && (
          <div className="space-y-3">
            <TextField label="Código" value={modal.codigo} disabled={modal.id !== null}
              onChange={(e) => setModal({ ...modal, codigo: e.target.value })} placeholder="MTY" />
            <TextField label="Nombre" value={modal.nombre}
              onChange={(e) => setModal({ ...modal, nombre: e.target.value })} placeholder="Monterrey" />
            <TextField label="Ubicación" value={modal.ubicacion}
              onChange={(e) => setModal({ ...modal, ubicacion: e.target.value })} placeholder="Apodaca, NL" />
            {error && <div className="text-xs text-danger">{error}</div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
