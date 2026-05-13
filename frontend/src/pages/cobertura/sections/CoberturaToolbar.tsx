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
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b border-white/5" style={{ background: 'rgba(11,15,8,0.6)' }}>
      {/* Toggle granularidad */}
      <div className="flex items-center gap-1 rounded-full p-1 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {(['semanal', 'mensual'] as const).map((g) => (
          <button
            key={g}
            onClick={() => onChangeGranularidad(g)}
            className="px-3 py-1.5 rounded-full transition"
            style={{
              background: granularidad === g ? '#A8D060' : 'transparent',
              color: granularidad === g ? '#0B0F08' : '#94a3b8',
            }}
          >
            {g === 'semanal' ? 'Semanal' : 'Mensual'}
          </button>
        ))}
      </div>

      {/* Planta selector */}
      <div className="flex items-center gap-2 text-xs">
        <label className="text-slate-500">Planta</label>
        <select
          value={planta}
          onChange={(e) => onChangePlanta(e.target.value)}
          className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white"
        >
          <option value="TODAS">Todas</option>
          {plantas.map((p) => (
            <option key={p.id} value={p.codigo}>{p.codigo} — {p.nombre}</option>
          ))}
        </select>
      </div>

      {/* Horizonte */}
      <div className="flex items-center gap-2 text-xs">
        <label className="text-slate-500">Horizonte</label>
        <input
          type="number"
          min={1}
          max={52}
          value={nBuckets}
          onChange={(e) => onChangeNBuckets(Number(e.target.value))}
          className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white"
        />
        <span className="text-slate-500">{granularidad === 'semanal' ? 'semanas' : 'meses'}</span>
      </div>
    </div>
  )
}
