import { templatesApi } from '../../../lib/api'
import type { TipoUpload } from '../../../lib/api'
import Button from '../../../components/ui/Button'

const TIPOS: { tipo: TipoUpload; label: string; descripcion: string }[] = [
  { tipo: 'inventario', label: 'Inventario', descripcion: 'SKU · Producto · Planta · Fecha · Cantidad · Unidad' },
  { tipo: 'produccion', label: 'Producción', descripcion: 'SKU · Producto · Planta · Fecha · Cantidad' },
  { tipo: 'compras', label: 'Compras', descripcion: 'SKU · Producto · Planta · OC · ETA · Cantidad' },
  { tipo: 'demanda', label: 'Demanda', descripcion: 'SKU · Producto · Cliente · Fecha · Cantidad' },
]

export default function TemplateDownloader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {TIPOS.map((t) => (
        <div key={t.tipo} className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-3" style={{ background: 'rgba(11,15,8,0.4)' }}>
          <div>
            <div className="text-sm font-semibold text-white">{t.label}</div>
            <div className="text-xs text-slate-500">{t.descripcion}</div>
          </div>
          <Button variant="secondary" onClick={() => templatesApi.downloadAndSave(t.tipo)}>
            Descargar
          </Button>
        </div>
      ))}
    </div>
  )
}
