import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { snapshotsApi } from '../../../lib/api'
import Button from '../../../components/ui/Button'

export default function NewSnapshotButton() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    try {
      const nombre = `Snapshot ${new Date().toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
      const s = await snapshotsApi.create(nombre)
      navigate(`/uploads?snapshot=${s.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handle} disabled={loading}>
      {loading ? 'Creando...' : '+ Nuevo snapshot'}
    </Button>
  )
}
