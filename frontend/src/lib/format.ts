// Formatters de fechas y números para la UI.

// Locale para fechas: español de México.
const LOCALE = 'es-MX'

// Locale para números/dinero: en-US garantiza coma para miles y punto para
// decimales (formato estándar en MX para montos: $1,234.56). Evitamos es-MX
// porque algunos navegadores caen a es-ES y usan "1.234,56".
const NUMBER_LOCALE = 'en-US'

export function fmtNumber(n: number, decimals = 0): string {
  return n.toLocaleString(NUMBER_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Formatea como dinero con comas para miles y punto para decimales.
 *  Por default usa 2 decimales (estándar contable). Pasar `decimals=0` para
 *  montos redondos (KPIs grandes).
 */
export function fmtMoney(n: number | string | null | undefined, decimals = 2): string {
  const v = Number(n) || 0
  return `$${v.toLocaleString(NUMBER_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
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

export function fmtDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
