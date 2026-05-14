// System Settings — solo nivel 9.
// 3 horizontal tabs (sin scroll vertical):
//   · Generales — claves del SystemConfig (standard_password, etc.)
//   · Niveles   — tabla de descripciones + columna Visible (toggle ocultar)
//   · Permisos  — matriz de permisos por nivel

import { useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import Tabs from '../../components/ui/Tabs'
import GeneralesTab from './sections/GeneralesTab'
import NivelesTab from './sections/NivelesTab'
import PermisosTab from './sections/PermisosTab'

type TabKey = 'niveles' | 'permisos' | 'generales'

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<TabKey>('niveles')

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'niveles', label: 'Niveles' },
    { key: 'permisos', label: 'Permisos' },
    { key: 'generales', label: 'Generales' },
  ]

  return (
    <AppShell title="System settings">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-app">System settings</h2>
          <p className="text-sm text-app-secondary">
            Solo nivel 9. Parámetros que controlan el comportamiento del sistema.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="px-2 pt-2">
            <Tabs tabs={tabs} active={tab} onChange={setTab} />
          </div>
          <div className="p-5">
            {tab === 'generales' && <GeneralesTab />}
            {tab === 'niveles' && <NivelesTab />}
            {tab === 'permisos' && <PermisosTab />}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
