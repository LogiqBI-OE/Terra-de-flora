import type { Planta } from '../../../lib/api'

interface Props {
  granularidad: 'semanal' | 'mensual'
  onChangeGranularidad: (g: 'semanal' | 'mensual') => void

  planta: string
  onChangePlanta: (p: string) => void
  plantas: Planta[]

  nBuckets: number
  onChangeNBuckets: (n: number) => void
}

export default function CoberturaToolbar({
  granularidad,
  onChangeGranularidad,
  planta,
  onChangePlanta,
  plantas,
  nBuckets,
  onChangeNBuckets,
}: Props) {
  return (
    <div
      className="flex flex-wrap items-center gap-4 px-4 py-3 border-b"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
    >
      <div
        className="flex items-center gap-1 rounded-full p-1 text-xs font-semibold"
        style={{ background: 'var(--bg-toggle)' }}
      >
        {(['semanal', 'mensual'] as const).map((g) => (
          <button
            key={g}
            onClick={() => onChangeGranularidad(g)}
            className="px-3 py-1.5 rounded-full transition"
            style={{
              background: granularidad === g ? 'var(--accent)' : 'transparent',
              color: granularidad === g ? 'var(--text-on-accent)' : 'var(--text-secondary)',
            }}
          >
            {g === 'semanal' ? 'Semanal' : 'Mensual'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs">
        <label className="text-app-muted">Planta</label>
        <select
          value={planta}
          onChange={(e) => onChangePlanta(e.target.value)}
          className="rounded px-2 py-1.5 border"
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
          }}
        >
          <option value="TODAS">Todas</option>
          {plantas.map((p) => (
            <option key={p.id} value={p.codigo}>{p.codigo} — {p.nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <label className="text-app-muted">Horizonte</label>
        <input
          type="number"
          min={1}
          max={52}
          value={nBuckets}
          onChange={(e) => onChangeNBuckets(Number(e.target.value))}
          className="w-16 rounded px-2 py-1.5 border"
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
          }}
        />
        <span className="text-app-muted">{granularidad === 'semanal' ? 'semanas' : 'meses'}</span>
      </div>
    </div>
  )
}
