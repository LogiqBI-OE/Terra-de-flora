// Barra de filtros: selects (Vendedores, Tipo) + segmented por estado.

import {
  ESTADOS_PROYECTO,
  MOCK_VENDEDORES,
  TIPOS_PROYECTO,
  type EstadoProyecto,
} from '../data/mockData'

interface Props {
  totalCount: number
  vendedor: string | 'todos'
  setVendedor: (v: string | 'todos') => void
  tipo: string | 'todos'
  setTipo: (v: string | 'todos') => void
  estado: EstadoProyecto | 'todos'
  setEstado: (v: EstadoProyecto | 'todos') => void
}

export default function ProyectosFilters({
  totalCount,
  vendedor, setVendedor,
  tipo, setTipo,
  estado, setEstado,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-bold text-app">Mis Proyectos</h3>
        <span className="text-sm text-app-muted">{totalCount} proyectos</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Vendedor */}
        <select
          value={vendedor}
          onChange={(e) => setVendedor(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm cursor-pointer"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="todos">Vendedores</option>
          {MOCK_VENDEDORES.map((v) => (
            <option key={v.handle} value={v.handle}>{v.nombre}</option>
          ))}
        </select>

        {/* Tipo */}
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm cursor-pointer"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="todos">Tipo</option>
          {TIPOS_PROYECTO.map((t) => (
            <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
          ))}
        </select>

        {/* Estado pills */}
        <div className="flex flex-wrap gap-1.5">
          <EstadoPill
            label="Todos"
            active={estado === 'todos'}
            onClick={() => setEstado('todos')}
          />
          {ESTADOS_PROYECTO.map((e) => (
            <EstadoPill
              key={e.id}
              label={`${e.emoji} ${e.label}`}
              active={estado === e.id}
              onClick={() => setEstado(e.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function EstadoPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-semibold transition border"
      style={{
        background: active ? 'var(--text-primary)' : 'var(--bg-input)',
        color: active ? 'var(--bg-page)' : 'var(--text-secondary)',
        borderColor: active ? 'var(--text-primary)' : 'var(--border)',
      }}
    >
      {label}
    </button>
  )
}
