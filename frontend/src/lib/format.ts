// Formatters de fechas y números para la UI.
// Locale fijo en es-MX. Cambia aquí si necesitas otro.

const LOCALE = 'es-MX'

export function fmtNumber(n: number, decimals = 0): string {
  return n.toLocaleString(LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function fmtBucketSemanal(isoDate: string): string {
  const d = new Date(isoDate)
  // “12 May” formato corto
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' })
}

export function fmtBucketMensual(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleDateString(LOCALE, { month: 'short', year: '2-digit' })
}

export function fmtDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
