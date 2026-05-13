// Mapping de los colores semánticos del backend → CSS variables.
// Los colores reales viven en index.css como --cobertura-*.
// Edita ahí si quieres cambiar la paleta. NO pongas hex aquí.

export type ColorCobertura = 'white' | 'green' | 'yellow' | 'red'

export const COLOR_HEX: Record<ColorCobertura, string> = {
  white: 'var(--cobertura-white)',
  green: 'var(--cobertura-green)',
  yellow: 'var(--cobertura-yellow)',
  red: 'var(--cobertura-red)',
}

export const COLOR_TEXTO: Record<ColorCobertura, string> = {
  white: 'var(--cobertura-text)',
  green: 'var(--cobertura-text)',
  yellow: 'var(--cobertura-text)',
  red: 'var(--cobertura-text)',
}

export const COLOR_LABEL: Record<ColorCobertura, string> = {
  white: 'Cubierto con inventario',
  green: 'Cubierto con producción',
  yellow: 'Cubierto con compras',
  red: 'Negativo / sin cobertura',
}
