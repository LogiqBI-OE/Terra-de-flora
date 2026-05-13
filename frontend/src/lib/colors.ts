// Mapping de los colores semánticos del backend → hex / clases Tailwind.
// Para cambiar la paleta de coloreo, edita este archivo.

export type ColorCobertura = 'white' | 'green' | 'yellow' | 'red'

export const COLOR_HEX: Record<ColorCobertura, string> = {
  white: '#FFFFFF',
  green: '#BBE07A',   // verde claro (cubierto con producción)
  yellow: '#F5D26B',  // amarillo (cubierto con compras)
  red: '#E16B6B',     // rojo (negativo)
}

export const COLOR_TEXTO: Record<ColorCobertura, string> = {
  white: '#0B0F08',
  green: '#0B0F08',
  yellow: '#0B0F08',
  red: '#0B0F08',
}

export const COLOR_LABEL: Record<ColorCobertura, string> = {
  white: 'Cubierto con inventario',
  green: 'Cubierto con producción',
  yellow: 'Cubierto con compras',
  red: 'Negativo / sin cobertura',
}
