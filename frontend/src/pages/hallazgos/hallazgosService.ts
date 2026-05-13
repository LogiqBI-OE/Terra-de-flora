// Cálculo derivado: a partir de la matriz de cobertura, identifica productos
// críticos (con celdas rojas) y resume el peor escenario por producto.
// La fórmula vive AQUÍ en frontend; si después la quieres en backend, mueve a
// services/cobertura/hallazgos.py — la firma del Hallazgo no cambia.

import type { CoberturaMatrix } from '../../lib/api'

export interface Hallazgo {
  producto_id: number
  sku: string
  producto: string
  unidad: string
  bucket_quiebre: string | null   // ISO date de la primera celda roja
  dias_hasta_quiebre: number | null
  deficit: number                 // max(|balance negativo|) en el horizonte
  worst_color: 'red' | 'yellow' | 'green' | 'white'
}

const COLOR_PRIORITY: Record<string, number> = { red: 3, yellow: 2, green: 1, white: 0 }

export function calcularHallazgos(matrix: CoberturaMatrix): Hallazgo[] {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const out: Hallazgo[] = []
  for (const fila of matrix.filas) {
    let worst: 'red' | 'yellow' | 'green' | 'white' = 'white'
    let bucketQuiebre: string | null = null
    let deficit = 0

    for (let i = 0; i < fila.celdas.length; i++) {
      const cell = fila.celdas[i]!
      if (COLOR_PRIORITY[cell.color]! > COLOR_PRIORITY[worst]) worst = cell.color
      if (cell.color === 'red' && bucketQuiebre === null) {
        bucketQuiebre = matrix.buckets[i] ?? null
      }
      if (cell.balance < deficit) deficit = cell.balance
    }

    if (worst === 'red' || worst === 'yellow') {
      const dias =
        bucketQuiebre !== null
          ? Math.max(0, Math.round((new Date(bucketQuiebre).getTime() - hoy.getTime()) / 86400000))
          : null
      out.push({
        producto_id: fila.producto_id,
        sku: fila.sku,
        producto: fila.producto,
        unidad: fila.unidad,
        bucket_quiebre: bucketQuiebre,
        dias_hasta_quiebre: dias,
        deficit: Math.round(Math.abs(deficit)),
        worst_color: worst,
      })
    }
  }

  // Ordenar: primero red, luego por días-hasta-quiebre (más urgente arriba)
  out.sort((a, b) => {
    if (a.worst_color !== b.worst_color) return COLOR_PRIORITY[b.worst_color]! - COLOR_PRIORITY[a.worst_color]!
    const da = a.dias_hasta_quiebre ?? 9999
    const db = b.dias_hasta_quiebre ?? 9999
    return da - db
  })

  return out
}
