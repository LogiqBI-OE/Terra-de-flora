import { useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import TextField from '../../../components/ui/TextField'
import { IconPlus } from '../../../components/icons/Icons'
import { ApiError, catalogApi, type Customer } from '../../../lib/api'
import CrudTable, { type Column } from './CrudTable'

interface FormState {
  id: number | null
  codigo: string
  nombre: string
}
const EMPTY: FormState = { id: null, codigo: '', nombre: '' }

export default function CustomersTab() {
  const [rows, setRows] = useState<Customer[]>([])
  const [modal, setModal] = useState<FormState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function reload() { setRows(await catalogApi.customers()) }
  useEffect(() => { reload() }, [])

  async function handleSave() {
    if (!modal) return
    setBusy(true); setError(null)
    try {
      if (modal.id === null) {
        await catalogApi.createCustomer({ codigo: modal.codigo, nombre: modal.nombre })
      } else {
        await catalogApi.updateCustomer(modal.id, { nombre: modal.nombre })
      }
      setModal(null); await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error inesperado.')
    } finally { setBusy(false) }
  }

  async function handleDelete(row: Customer) {
    if (!confirm(`¿Eliminar cliente "${row.codigo} — ${row.nombre}"?`)) return
    try { await catalogApi.deleteCustomer(row.id); await reload() }
    catch (e) { alert(e instanceof ApiError ? e.message : 'Error') }
  }

  const columns: Column<Customer>[] = [
    { header: 'Código', cell: (c) => <span className="font-mono text-app-secondary">{c.codigo}</span> },
    { header: 'Nombre', cell: (c) => c.nombre },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setModal({ ...EMPTY })}><IconPlus size={14} /> Nuevo cliente</Button>
      </div>
      <CrudTable
        rows={rows}
        columns={columns}
        onEdit={(c) => setModal({ id: c.id, codigo: c.codigo, nombre: c.nombre })}
        onDelete={handleDelete}
        empty="Sin clientes registrados."
      />
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.id === null ? 'Nuevo cliente' : `Editar ${modal?.codigo}`}
        footer={<>
          <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</Button>
        </>}
      >
        {modal && (
          <div className="space-y-3">
            <TextField label="Código" value={modal.codigo} disabled={modal.id !== null}
              onChange={(e) => setModal({ ...modal, codigo: e.target.value })} placeholder="WALMART" />
            <TextField label="Nombre" value={modal.nombre}
              onChange={(e) => setModal({ ...modal, nombre: e.target.value })} placeholder="Walmart México" />
            {error && <div className="text-xs text-danger">{error}</div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
