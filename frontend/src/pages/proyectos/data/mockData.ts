// Mock data del gestor de proyectos.
// Cuando este conectado a backend, esto se va y el page hace fetch real.

export type EstadoProyecto = 'cotizando' | 'aprobado' | 'produccion' | 'montaje' | 'entregado'

export interface Cliente {
  id: number
  nombre: string
  tipo: 'PF' | 'PM'  // Persona Fisica / Moral
  telefono: string
  email?: string
  rfc?: string
}

export interface Proyecto {
  id: number
  codigo: string           // PROY-245
  nombre: string
  descripcion: string      // subtitulo del nombre en la tabla
  cliente: Cliente
  vendedor_handle: string  // @atorres
  vendedor_nombre: string  // Ana Torres
  tipo: 'boda' | 'iglesia' | 'bautizo' | 'cumple' | 'xv' | 'corporativo' | 'otro'
  fecha_evento: string     // 2026-06-15
  fecha_creacion: string   // 2026-04-20
  valor: number            // 285450
  comentarios: number
  estado: EstadoProyecto
}

export const MOCK_VENDEDORES = [
  { handle: 'atorres', nombre: 'Ana Torres' },
  { handle: 'lgarza', nombre: 'Luis Garza' },
  { handle: 'mtamez', nombre: 'Miguel Tamez' },
  { handle: 'cmoreno', nombre: 'Carolina Moreno' },
]

export const MOCK_CLIENTES: Cliente[] = [
  { id: 1, nombre: 'Carlos Sada', tipo: 'PF', telefono: '818-234-5678', rfc: 'SADC850412XXX' },
  { id: 2, nombre: 'Familia Martínez', tipo: 'PF', telefono: '818-111-2233' },
  { id: 3, nombre: 'IMEF Monterrey', tipo: 'PM', telefono: '818-555-7890', rfc: 'IME000101ABC' },
  { id: 4, nombre: 'Hotel Camino Real', tipo: 'PM', telefono: '818-345-6789' },
  { id: 5, nombre: 'Fernando Elizondo', tipo: 'PF', telefono: '811-200-4400' },
  { id: 6, nombre: 'Roberto Valle', tipo: 'PF', telefono: '818-555-7890' },
  { id: 7, nombre: 'Parroquia San Pedro', tipo: 'PM', telefono: '818-777-1010' },
  { id: 8, nombre: 'Mariana López', tipo: 'PF', telefono: '811-444-5566' },
  { id: 9, nombre: 'Quinta Real Hotels', tipo: 'PM', telefono: '818-345-6789' },
  { id: 10, nombre: 'Familia García', tipo: 'PF', telefono: '811-333-2222' },
]

const c = (id: number) => MOCK_CLIENTES.find((x) => x.id === id)!

export const MOCK_PROYECTOS: Proyecto[] = [
  {
    id: 245,
    codigo: 'PROY-245',
    nombre: 'Boda Sada',
    descripcion: 'ARREGLOS CEREMONIA & BANQUETE',
    cliente: c(1),
    vendedor_handle: 'atorres',
    vendedor_nombre: 'Ana Torres',
    tipo: 'boda',
    fecha_evento: '2026-06-15',
    fecha_creacion: '2026-04-20',
    valor: 285450,
    comentarios: 4,
    estado: 'cotizando',
  },
  {
    id: 244,
    codigo: 'PROY-244',
    nombre: 'XV Años Sofía',
    descripcion: 'SALÓN + CENTROS DE MESA',
    cliente: c(2),
    vendedor_handle: 'lgarza',
    vendedor_nombre: 'Luis Garza',
    tipo: 'xv',
    fecha_evento: '2026-05-30',
    fecha_creacion: '2026-04-18',
    valor: 124000,
    comentarios: 2,
    estado: 'aprobado',
  },
  {
    id: 243,
    codigo: 'PROY-243',
    nombre: 'Convención IMEF',
    descripcion: 'CORPORATIVO 2 DÍAS',
    cliente: c(3),
    vendedor_handle: 'atorres',
    vendedor_nombre: 'Ana Torres',
    tipo: 'corporativo',
    fecha_evento: '2026-05-25',
    fecha_creacion: '2026-04-15',
    valor: 180200,
    comentarios: 8,
    estado: 'produccion',
  },
  {
    id: 242,
    codigo: 'PROY-242',
    nombre: 'Aniversario Camino Real',
    descripcion: 'LOBBY + SALONES',
    cliente: c(4),
    vendedor_handle: 'mtamez',
    vendedor_nombre: 'Miguel Tamez',
    tipo: 'corporativo',
    fecha_evento: '2026-06-30',
    fecha_creacion: '2026-04-10',
    valor: 345000,
    comentarios: 12,
    estado: 'montaje',
  },
  {
    id: 241,
    codigo: 'PROY-241',
    nombre: 'Cumple Doña Marta',
    descripcion: 'JARDÍN PRIVADO',
    cliente: c(5),
    vendedor_handle: 'lgarza',
    vendedor_nombre: 'Luis Garza',
    tipo: 'cumple',
    fecha_evento: '2026-04-22',
    fecha_creacion: '2026-04-01',
    valor: 92300,
    comentarios: 1,
    estado: 'entregado',
  },
  {
    id: 240,
    codigo: 'PROY-240',
    nombre: 'Boda Valle-Treviño',
    descripcion: 'CAPILLA + RECEPCIÓN',
    cliente: c(6),
    vendedor_handle: 'cmoreno',
    vendedor_nombre: 'Carolina Moreno',
    tipo: 'boda',
    fecha_evento: '2026-08-15',
    fecha_creacion: '2026-04-22',
    valor: 412000,
    comentarios: 3,
    estado: 'cotizando',
  },
  {
    id: 239,
    codigo: 'PROY-239',
    nombre: 'Primera Comunión San Pedro',
    descripcion: 'IGLESIA + ATRIO',
    cliente: c(7),
    vendedor_handle: 'mtamez',
    vendedor_nombre: 'Miguel Tamez',
    tipo: 'iglesia',
    fecha_evento: '2026-05-12',
    fecha_creacion: '2026-04-12',
    valor: 56800,
    comentarios: 0,
    estado: 'aprobado',
  },
  {
    id: 238,
    codigo: 'PROY-238',
    nombre: 'Bautizo Mariana López',
    descripcion: 'IGLESIA SAN MIGUEL',
    cliente: c(8),
    vendedor_handle: 'atorres',
    vendedor_nombre: 'Ana Torres',
    tipo: 'bautizo',
    fecha_evento: '2026-05-08',
    fecha_creacion: '2026-04-09',
    valor: 32500,
    comentarios: 2,
    estado: 'cotizando',
  },
  {
    id: 237,
    codigo: 'PROY-237',
    nombre: 'Gala Quinta Real',
    descripcion: '3 SALONES + JARDÍN',
    cliente: c(9),
    vendedor_handle: 'cmoreno',
    vendedor_nombre: 'Carolina Moreno',
    tipo: 'corporativo',
    fecha_evento: '2026-07-20',
    fecha_creacion: '2026-04-05',
    valor: 580000,
    comentarios: 6,
    estado: 'aprobado',
  },
  {
    id: 236,
    codigo: 'PROY-236',
    nombre: 'Boda García-Pérez',
    descripcion: 'TERRAZA & PISTA',
    cliente: c(10),
    vendedor_handle: 'lgarza',
    vendedor_nombre: 'Luis Garza',
    tipo: 'boda',
    fecha_evento: '2026-09-05',
    fecha_creacion: '2026-04-25',
    valor: 268000,
    comentarios: 1,
    estado: 'cotizando',
  },
]

export const TIPOS_PROYECTO: { id: Proyecto['tipo']; label: string; emoji: string }[] = [
  { id: 'boda', label: 'Boda', emoji: '💐' },
  { id: 'iglesia', label: 'Iglesia', emoji: '⛪' },
  { id: 'bautizo', label: 'Bautizo', emoji: '👶' },
  { id: 'cumple', label: 'Cumpleaños', emoji: '🎂' },
  { id: 'xv', label: 'XV años', emoji: '👑' },
  { id: 'corporativo', label: 'Corporativo', emoji: '🏢' },
  { id: 'otro', label: 'Otro', emoji: '🎉' },
]

export const ESTADOS_PROYECTO: {
  id: EstadoProyecto
  label: string
  emoji: string
  color: string  // bg / text in light mode
}[] = [
  { id: 'cotizando', label: 'Cotizando', emoji: '🔥', color: 'amber' },
  { id: 'aprobado', label: 'Aprobado', emoji: '✅', color: 'emerald' },
  { id: 'produccion', label: 'Producción', emoji: '🌷', color: 'sky' },
  { id: 'montaje', label: 'Montaje', emoji: '🚚', color: 'violet' },
  { id: 'entregado', label: 'Entregado', emoji: '🎉', color: 'rose' },
]

export function tipoMeta(t: Proyecto['tipo']) {
  return TIPOS_PROYECTO.find((x) => x.id === t)!
}
export function estadoMeta(e: EstadoProyecto) {
  return ESTADOS_PROYECTO.find((x) => x.id === e)!
}

export function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('es-MX')}`
}
export function fmtMoneyFull(n: number): string {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
}
export function fmtFechaCorta(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
export function fmtFechaDM(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })
}
