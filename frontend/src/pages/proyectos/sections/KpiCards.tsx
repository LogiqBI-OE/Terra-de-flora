// KPI cards del gestor — alimentadas con KPIs reales calculadas en el page.

import type { ReactNode } from 'react'

interface KpisInput {
  activos: number
  cotizando: number
  pipelineValor: number
  aprobadosCount: number
  aprobadoValor: number
  entregadosCount: number
  entregadoValor: number
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
}

interface KpiSpec {
  topBar: string
  iconBg: string
  icon: ReactNode
  value: string
  title: string
  sub: string
}

export default function KpiCards({ kpis }: { kpis: KpisInput }) {
  const items: KpiSpec[] = [
    {
      topBar: 'linear-gradient(90deg, #60A5FA 0%, #3B82F6 100%)',
      iconBg: 'rgba(59, 130, 246, 0.12)',
      icon: <BuildingMini color="#3B82F6" />,
      value: String(kpis.activos),
      title: 'Proyectos Activos',
      sub: 'En curso ahora',
    },
    {
      topBar: 'linear-gradient(90deg, #FB923C 0%, #F97316 100%)',
      iconBg: 'rgba(249, 115, 22, 0.12)',
      icon: <FireMini color="#F97316" />,
      value: String(kpis.cotizando),
      title: 'En Cotización',
      sub: 'Calientes',
    },
    {
      topBar: 'linear-gradient(90deg, #34D399 0%, #10B981 100%)',
      iconBg: 'rgba(16, 185, 129, 0.12)',
      icon: <DollarMini color="#10B981" />,
      value: fmtMoney(kpis.pipelineValor),
      title: 'Pipeline',
      sub: `${kpis.cotizando} ${kpis.cotizando === 1 ? 'propuesta' : 'propuestas'}`,
    },
    {
      topBar: 'linear-gradient(90deg, #A78BFA 0%, #8B5CF6 100%)',
      iconBg: 'rgba(139, 92, 246, 0.12)',
      icon: <CheckMini color="#8B5CF6" />,
      value: fmtMoney(kpis.aprobadoValor),
      title: `${kpis.aprobadosCount} ${kpis.aprobadosCount === 1 ? 'Aprobado' : 'Aprobados'}`,
      sub: 'Este mes',
    },
    {
      topBar: 'linear-gradient(90deg, #4ADE80 0%, #22C55E 100%)',
      iconBg: 'rgba(34, 197, 94, 0.12)',
      icon: <CheckCircleMini color="#22C55E" />,
      value: fmtMoney(kpis.entregadoValor),
      title: `${kpis.entregadosCount} ${kpis.entregadosCount === 1 ? 'Entregado' : 'Entregados'}`,
      sub: 'Este mes',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {items.map((k, i) => (
        <div
          key={i}
          className="relative rounded-xl border overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="h-1" style={{ background: k.topBar }} />
          <div className="p-4 flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: k.iconBg }}
            >
              {k.icon}
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold text-app leading-tight">{k.value}</div>
              <div className="text-sm font-medium text-app">{k.title}</div>
              <div className="text-xs text-app-muted">{k.sub}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function BuildingMini({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
    </svg>
  )
}
function FireMini({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2s4 4 4 9-4 11-4 11-4-6-4-11 4-9 4-9z" />
      <path d="M9 14c0-1.5 1-3 3-3" />
    </svg>
  )
}
function DollarMini({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}
function CheckMini({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function CheckCircleMini({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}
