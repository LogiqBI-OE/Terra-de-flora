// Gestor de Proyectos — pagina principal /proyectos.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import { IconChevronRight, IconPlus } from '../../components/icons/Icons'
import { useAuth } from '../../lib/auth'
import KpiCards from './sections/KpiCards'
import ProyectosFilters from './sections/ProyectosFilters'
import ProyectosTable from './sections/ProyectosTable'
import { MOCK_PROYECTOS, type EstadoProyecto } from './data/mockData'

export default function ProyectosPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [vendedor, setVendedor] = useState<string | 'todos'>('todos')
  const [tipo, setTipo] = useState<string | 'todos'>('todos')
  const [estado, setEstado] = useState<EstadoProyecto | 'todos'>('todos')

  const filtered = useMemo(() => {
    return MOCK_PROYECTOS.filter((p) => {
      if (vendedor !== 'todos' && p.vendedor_handle !== vendedor) return false
      if (tipo !== 'todos' && p.tipo !== tipo) return false
      if (estado !== 'todos' && p.estado !== estado) return false
      return true
    })
  }, [vendedor, tipo, estado])

  const firstName = (user?.full_name?.split(' ')[0] ?? user?.username ?? user?.email?.split('@')[0] ?? 'usuario')

  return (
    <AppShell title="Gestor de proyectos">
      <div className="space-y-5">
        {/* Header con breadcrumb + saludo + CTA */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-app-muted mb-3">
                <span>Inicio</span>
                <IconChevronRight size={12} />
                <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>Mis Proyectos</span>
              </div>
              <h1 className="text-3xl font-bold text-app capitalize">Bienvenido, {firstName}</h1>
              <p className="text-sm text-app-secondary mt-1">
                Gestiona tus eventos y cotizaciones de Terra de Flora.
              </p>
            </div>
            <button
              onClick={() => navigate('/proyectos/nuevo')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-lg transition"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                boxShadow: '0 6px 20px var(--accent-shadow)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-dark)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)' }}
            >
              <IconPlus size={16} />
              Nuevo Proyecto
            </button>
          </div>

          <div className="mt-5">
            <KpiCards />
          </div>
        </div>

        {/* Filtros + tabla */}
        <Card>
          <div className="p-5 space-y-4">
            <ProyectosFilters
              totalCount={MOCK_PROYECTOS.length}
              vendedor={vendedor} setVendedor={setVendedor}
              tipo={tipo} setTipo={setTipo}
              estado={estado} setEstado={setEstado}
            />
            <ProyectosTable rows={filtered} />
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
