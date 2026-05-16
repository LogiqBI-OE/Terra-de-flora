// Gestor de Proyectos — /proyectos. Backend real.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import { IconChevronRight, IconPlus } from '../../components/icons/Icons'
import { useAuth } from '../../lib/auth'
import { usePolling } from '../../lib/usePolling'
import {
  comentariosApi,
  proyectosApi,
  type BadgeProyecto,
  type EstadoProyecto,
  type ProyectoCatalog,
  type ProyectoRow,
} from '../../lib/api'
import KpiCards from './sections/KpiCards'
import ProyectosFilters from './sections/ProyectosFilters'
import ProyectosTable from './sections/ProyectosTable'
import { SkeletonTable } from '../../components/ui/Skeleton'

export default function ProyectosPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [rows, setRows] = useState<ProyectoRow[]>([])
  const [catalog, setCatalog] = useState<ProyectoCatalog | null>(null)
  const [badges, setBadges] = useState<Record<number, BadgeProyecto>>({})
  const [loading, setLoading] = useState(true)

  const [vendedor, setVendedor] = useState<string | 'todos'>('todos')
  const [tipo, setTipo] = useState<string | 'todos'>('todos')
  const [estado, setEstado] = useState<EstadoProyecto | 'todos'>('todos')

  async function reload() {
    try {
      const [r, c, b] = await Promise.all([
        proyectosApi.list(),
        proyectosApi.catalog(),
        comentariosApi.getBadgesMap().catch(() => ({ items: [] as BadgeProyecto[] })),
      ])
      setRows(r); setCatalog(c)
      const bm: Record<number, BadgeProyecto> = {}
      for (const it of b.items) bm[it.proyecto_id] = it
      setBadges(bm)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { reload() }, [])
  usePolling(reload, 60000)

  const filtered = useMemo(() => {
    return rows.filter((p) => {
      if (vendedor !== 'todos' && p.vendedor_username !== vendedor) return false
      if (tipo !== 'todos' && p.tipo !== tipo) return false
      if (estado !== 'todos' && p.estado !== estado) return false
      return true
    })
  }, [rows, vendedor, tipo, estado])

  // KPIs calculadas en vivo
  const kpis = useMemo(() => computeKpis(rows), [rows])

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
            <KpiCards kpis={kpis} />
          </div>
        </div>

        {/* Filtros + tabla */}
        <Card>
          <div className="p-5 space-y-4">
            <ProyectosFilters
              totalCount={rows.length}
              vendedor={vendedor} setVendedor={setVendedor}
              tipo={tipo} setTipo={setTipo}
              estado={estado} setEstado={setEstado}
              catalog={catalog}
            />
            {loading ? (
              <SkeletonTable rows={6} cols={8} />
            ) : rows.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl mb-2">📋</div>
                <h3 className="text-base font-semibold text-app mb-1">Sin proyectos todavía</h3>
                <p className="text-sm text-app-muted mb-4">
                  Crea tu primer evento para empezar a cotizar.
                </p>
                <button
                  onClick={() => navigate('/proyectos/nuevo')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition"
                  style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
                >
                  <IconPlus size={14} /> Nuevo proyecto
                </button>
              </div>
            ) : (
              <ProyectosTable rows={filtered} badges={badges} onClick={(p) => navigate(`/proyectos/${p.id}`)} />
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

// ── KPIs calc ─────────────────────────────────────────────────────────────
function computeKpis(rows: ProyectoRow[]) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const activos = rows.filter(r => !['entregado', 'cancelado'].includes(r.estado))
  const cotizando = rows.filter(r => r.estado === 'cotizando')
  const aprobadosMes = rows.filter(r =>
    r.estado === 'aprobado' && new Date(r.updated_at) >= monthStart
  )
  const entregadosMes = rows.filter(r =>
    r.estado === 'entregado' && new Date(r.updated_at) >= monthStart
  )
  const pipelineValor = cotizando.reduce((acc, r) => acc + Number(r.valor_estimado), 0)
  const aprobadoValor = aprobadosMes.reduce((acc, r) => acc + Number(r.valor_estimado), 0)
  const entregadoValor = entregadosMes.reduce((acc, r) => acc + Number(r.valor_estimado), 0)

  return {
    activos: activos.length,
    cotizando: cotizando.length,
    pipelineValor,
    aprobadosCount: aprobadosMes.length,
    aprobadoValor,
    entregadosCount: entregadosMes.length,
    entregadoValor,
  }
}
