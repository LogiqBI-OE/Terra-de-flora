import type { UploadResult } from '../../../lib/api'

export default function UploadStatus({ result }: { result: UploadResult }) {
  const tieneErrores = result.filas_err > 0 || (result.filas_ok === 0 && result.errores.length > 0)
  return (
    <div className="rounded-lg border border-white/5 px-4 py-3 mt-3" style={{ background: 'rgba(11,15,8,0.6)' }}>
      <div className="flex items-center justify-between text-sm">
        <div className="text-white font-semibold">{result.archivo}</div>
        <div className={tieneErrores ? 'text-yellow-300' : 'text-oleo-green'}>
          {result.filas_ok} ok · {result.filas_err} con error
        </div>
      </div>
      {result.errores.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-red-300 max-h-40 overflow-auto">
          {result.errores.map((e, i) => (
            <li key={i}>
              {e.fila ? `Fila ${e.fila}: ` : ''}
              {e.detalle}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
