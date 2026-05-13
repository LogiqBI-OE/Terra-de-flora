import { COLOR_HEX, COLOR_LABEL, type ColorCobertura } from '../../../lib/colors'

const ORDEN: ColorCobertura[] = ['white', 'green', 'yellow', 'red']

export default function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      {ORDEN.map((c) => (
        <div key={c} className="flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded border border-white/10"
            style={{ background: COLOR_HEX[c] }}
          />
          <span className="text-slate-400">{COLOR_LABEL[c]}</span>
        </div>
      ))}
    </div>
  )
}
