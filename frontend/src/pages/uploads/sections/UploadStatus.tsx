import type { UploadResult } from '../../../lib/api'

export default function UploadStatus({ result }: { result: UploadResult }) {
  const tieneErrores = result.filas_err > 0 || (result.filas_ok === 0 && result.errores.length > 0)
  return (
    <div
      className="rounded-lg border px-4 py-3 mt-3"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-center justify-between text-sm">
        <div className="text-app font-semibold">{result.archivo}</div>
        <div style={{ color: tieneErrores ? '#b45309' : 'var(--accent-text)' }}>
          {result.filas_ok} ok · {result.filas_err} con error
        </div>
      </div>
      {result.errores.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs max-h-40 overflow-auto" style={{ color: '#b91c1c' }}>
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
