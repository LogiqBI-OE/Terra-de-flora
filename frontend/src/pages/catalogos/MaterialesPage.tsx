// Pagina catalogo: Proveedores | Materiales.

import { useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import Tabs from '../../components/ui/Tabs'
import ProveedoresTab from './sections/ProveedoresTab'
import MaterialesTab from './sections/MaterialesTab'

type TabKey = 'proveedores' | 'materiales'

export default function MaterialesPage() {
  const [tab, setTab] = useState<TabKey>('proveedores')

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'proveedores', label: 'Proveedores' },
    { key: 'materiales', label: 'Materiales' },
  ]

  return (
    <AppShell title="Materiales y proveedores">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-app">Materiales y proveedores</h2>
          <p className="text-sm text-app-secondary">
            Agenda de proveedores y catálogo de materiales / flores que usas en cotizaciones.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="px-2 pt-2">
            <Tabs tabs={tabs} active={tab} onChange={setTab} />
          </div>
          <div className="p-5">
            {tab === 'proveedores' && <ProveedoresTab />}
            {tab === 'materiales' && <MaterialesTab />}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
