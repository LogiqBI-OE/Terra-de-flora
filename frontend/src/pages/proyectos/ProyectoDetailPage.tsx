// Detalle de proyecto — /proyectos/:id. Contenedor de tabs.

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import { IconChevronRight } from '../../components/icons/Icons'
import { ApiError, proyectosApi, type ProyectoRow } from '../../lib/api'
import FolioTab from './sections/FolioTab'
import PagosTab from './sections/PagosTab'
import ComentariosTab from './sections/ComentariosTab'
import PlaceholderTab from './sections/PlaceholderTab'

type TabKey = 'folio' | 'pagos' | 'cotizacion' | 'comprar' | 'gestion' | 'comentarios'

const TABS: { id: TabKey; label: string; emoji: string }[] = [
  { id: 'folio', label: 'Folio', emoji: '📋' },
  { id: 'pagos', label: 'Pagos', emoji: '💳' },
  { id: 'cotizacion', label: 'Cotización', emoji: '🧾' },
  { id: 'comprar', label: 'Por comprar', emoji: '🛒' },
  { id: 'gestion', label: 'Gestión', emoji: '🛠️' },
  { id: 'comentarios', label: 'Comentarios', emoji: '💬' },
]

const TIPO_EMOJI: Record<string, string> = {
  boda: '💐', iglesia: '⛪', bautizo: '👶', cumple: '🎂',
  xv: '👑', corporativo: '🏢', otro: '🎉',
}
const TIPO_LABEL: Record<string, string> = {
  boda: 'Boda', iglesia: 'Iglesia', bautizo: 'Bautizo', cumple: 'Cumpleaños',
  xv: 'XV años', corporativo: 'Corporativo', otro: 'Otro',
}
const ESTADO_LABEL: Record<string, string> = {
  cotizando: 'Cotizando', aprobado: 'Aprobado', produccion: 'Producción',
  montaje: 'Montaje', entregado: 'Entregado', cancelado: 'Cancelado',
}
const ESTADO_COLORS: Record<string, { bg: string; text: string }> = {
  cotizando: { bg: 'rgba(245, 158, 11, 0.18)', text: '#D97706' },
  aprobado: { bg: 'rgba(16, 185, 129, 0.18)', text: '#059669' },
  produccion: { bg: 'rgba(14, 165, 233, 0.18)', text: '#0284C7' },
  montaje: { bg: 'rgba(139, 92, 246, 0.18)', text: '#7C3AED' },
  entregado: { bg: 'rgba(244, 63, 94, 0.18)', text: '#E11D48' },
  cancelado: { bg: 'rgba(148, 163, 184, 0.18)', text: '#475569' },
}

export default function ProyectoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [proyecto, setProyecto] = useState<ProyectoRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('folio')

  useEffect(() => {
    if (!id) return
    let alive = true
    setLoading(true)
    proyectosApi.get(Number(id))
      .then((p) => { if (alive) setProyecto(p) })
      .catch((e) => {
        if (!alive) return
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar el proyecto')
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  if (loading) {
    return (
      <AppShell title="Proyecto">
        <div className="py-16 text-center text-sm text-app-muted">Cargando proyecto…</div>
      </AppShell>
    )
  }

  if (error || !proyecto) {
    return (
      <AppShell title="Proyecto">
        <div className="py-16 text-center space-y-4">
          <div className="text-sm" style={{ color: 'var(--danger)' }}>{error ?? 'Proyecto no encontrado'}</div>
          <Button variant="secondary" onClick={() => navigate('/proyectos')}>Volver al gestor</Button>
        </div>
      </AppShell>
    )
  }

  const estadoColor = ESTADO_COLORS[proyecto.estado] ?? ESTADO_COLORS.cotizando

  return (
    <AppShell title={proyecto.nombre}>
      <div className="space-y-5">
        {/* Header */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-app-muted mb-2">
                <button onClick={() => navigate('/proyectos')} className="hover:text-app transition">
                  Mis Proyectos
                </button>
                <IconChevronRight size={12} />
                <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
                  {proyecto.codigo}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-app truncate">
                  <span className="mr-2">{TIPO_EMOJI[proyecto.tipo] ?? '🎉'}</span>
                  {proyecto.nombre}
                </h1>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide"
                  style={{ background: estadoColor.bg, color: estadoColor.text }}
                >
                  {ESTADO_LABEL[proyecto.estado] ?? proyecto.estado}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-app-secondary flex-wrap">
                <span>{TIPO_LABEL[proyecto.tipo] ?? proyecto.tipo}</span>
                <span className="text-app-muted">·</span>
                <span>Cliente: <strong className="text-app">{proyecto.cliente_nombre}</strong></span>
                {proyecto.vendedor_nombre && (
                  <>
                    <span className="text-app-muted">·</span>
                    <span>Vendedor: <strong className="text-app">{proyecto.vendedor_nombre}</strong></span>
                  </>
                )}
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/proyectos')}>Volver</Button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center gap-1 px-3 pt-3 border-b overflow-x-auto"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            {TABS.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="px-4 py-2.5 text-sm font-semibold rounded-t-lg transition whitespace-nowrap"
                  style={{
                    background: active ? 'var(--bg-elevated)' : 'transparent',
                    color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  <span className="mr-1.5">{t.emoji}</span>
                  {t.label}
                </button>
              )
            })}
          </div>

          <div className="p-5">
            {tab === 'folio' && (
              <FolioTab proyecto={proyecto} onUpdated={setProyecto} />
            )}
            {tab === 'pagos' && <PagosTab proyecto={proyecto} />}
            {tab === 'cotizacion' && (
              <PlaceholderTab
                emoji="🧾"
                title="Cotización"
                description="Aquí construiremos la cotización detallada con recetas, materiales y mano de obra."
                hint="Próximamente"
              />
            )}
            {tab === 'comprar' && (
              <PlaceholderTab
                emoji="🛒"
                title="Por comprar"
                description="Lista consolidada de materiales pendientes de compra para este evento, derivada de las recetas."
                hint="Próximamente"
              />
            )}
            {tab === 'gestion' && (
              <PlaceholderTab
                emoji="🛠️"
                title="Gestión"
                description="Control de producción: tareas, asignaciones, montaje y desmontaje del evento."
                hint="Próximamente"
              />
            )}
            {tab === 'comentarios' && <ComentariosTab proyecto={proyecto} />}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
