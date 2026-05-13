// Página Catálogos con horizontal menu (tabs).
// Cada tab vive en su propio archivo en sections/.
// Para añadir un tab nuevo: edita TABS abajo + crea su componente.

import { useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import ProductosTab from './sections/ProductosTab'
import PlantasTab from './sections/PlantasTab'
import CustomersTab from './sections/CustomersTab'
import ReglasTab from './sections/ReglasTab'
import NotificacionesTab from './sections/NotificacionesTab'

type TabKey = 'productos' | 'plantas' | 'customers' | 'reglas' | 'notificaciones'

interface TabDef {
  key: TabKey
  label: string
  disabled?: boolean
  hint?: string
}

const TABS: TabDef[] = [
  { key: 'productos', label: 'Productos' },
  { key: 'plantas', label: 'Plantas' },
  { key: 'customers', label: 'Clientes' },
  { key: 'reglas', label: 'Reglas de coloreo', disabled: true, hint: 'Próximamente' },
  { key: 'notificaciones', label: 'Notificaciones', disabled: true, hint: 'Próximamente' },
]

export default function CatalogosPage() {
  const [tab, setTab] = useState<TabKey>('productos')

  return (
    <AppShell title="Catálogos">
      <div className="max-w-6xl space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-app">Catálogos</h2>
          <p className="text-sm text-app-secondary">
            Master data del workspace: productos, plantas, clientes y reglas del sistema.
          </p>
        </div>

        <Card className="overflow-hidden">
          {/* Horizontal menu */}
          <div
            className="flex items-center gap-1 px-2 pt-2 border-b overflow-x-auto"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            {TABS.map((t) => {
              const active = t.key === tab
              return (
                <button
                  key={t.key}
                  onClick={() => !t.disabled && setTab(t.key)}
                  disabled={t.disabled}
                  title={t.disabled ? t.hint : undefined}
                  className="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap border-b-2"
                  style={{
                    background: active ? 'var(--bg-card)' : 'transparent',
                    color: t.disabled
                      ? 'var(--text-faint)'
                      : active
                        ? 'var(--accent-text)'
                        : 'var(--text-secondary)',
                    borderColor: active ? 'var(--accent)' : 'transparent',
                    cursor: t.disabled ? 'not-allowed' : 'pointer',
                    opacity: t.disabled ? 0.6 : 1,
                  }}
                >
                  {t.label}
                  {t.disabled && (
                    <span className="ml-2 text-[9px] uppercase tracking-widest opacity-70">Pronto</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Contenido */}
          <div className="p-5">
            {tab === 'productos' && <ProductosTab />}
            {tab === 'plantas' && <PlantasTab />}
            {tab === 'customers' && <CustomersTab />}
            {tab === 'reglas' && <ReglasTab />}
            {tab === 'notificaciones' && <NotificacionesTab />}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
