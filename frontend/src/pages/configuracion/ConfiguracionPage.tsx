// System Settings — solo nivel 9.
// Página contenedora con horizontal tabs.
// Tabs:
//   · Generales         — claves del SystemConfig (standard_password, etc.)
//   · Niveles de usuarios — descripciones + matriz de permisos

import { useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import Tabs from '../../components/ui/Tabs'
import GeneralesTab from './sections/GeneralesTab'
import NivelesTab from './sections/NivelesTab'

type TabKey = 'generales' | 'niveles'

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<TabKey>('generales')

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'generales', label: 'Generales' },
    { key: 'niveles', label: 'Niveles de usuarios' },
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
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
