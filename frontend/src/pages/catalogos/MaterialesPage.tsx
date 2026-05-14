// Pagina catalogo: Proveedores | Materiales (Materiales pendiente).

import { useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import Tabs from '../../components/ui/Tabs'
import ProveedoresTab from './sections/ProveedoresTab'

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
            {tab === 'materiales' && <MaterialesPlaceholder />}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

function MaterialesPlaceholder() {
  return (
    <div className="py-16 text-center">
      <div className="text-4xl mb-3">🌷</div>
      <h3 className="text-base font-semibold text-app mb-1">Catálogo de materiales</h3>
      <p className="text-sm text-app-muted max-w-md mx-auto">
        Aquí vivirá el catálogo de flores, bases, oasis, velas y demás insumos.
        Cuando lo construyamos, podrás importar desde Excel o capturarlos manualmente,
        y cada uno se vinculará a un proveedor de la agenda para generar pedidos automáticos.
      </p>
    </div>
  )
}
