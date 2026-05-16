export { authApi } from './auth'
export type { Role, LoginPayload, LoginResponse } from './auth'

export { systemConfigApi } from './systemConfig'
export type { SystemConfigItem, RuntimeConfig } from './systemConfig'

export { levelsApi } from './levels'
export type { LevelDetail, LevelsPayload } from './levels'

export { usersApi } from './users'
export type {
  LevelDef,
  PermissionsCatalog,
  UserDetail,
  UserCreatePayload,
  UserUpdatePayload,
  LoginEvent,
  LoginEventsFilters,
} from './users'

export { proveedoresApi } from './proveedores'
export type { Proveedor, ProveedorCreatePayload, ProveedorUpdatePayload } from './proveedores'

export { clientesApi } from './clientes'
export type { Cliente, ClienteCreatePayload, ClienteUpdatePayload, TipoCliente } from './clientes'

export { materialesApi } from './materiales'
export type {
  Material, MaterialCreatePayload, MaterialUpdatePayload, MaterialCatalog,
  CatalogItem, CatalogItemCreatePayload, CatalogItemUpdatePayload,
  MaterialPrecioHistoricoRow,
} from './materiales'

export { recetasApi } from './recetas'
export type {
  Receta, RecetaSummary, RecetaItem, RecetaItemIn,
  RecetaCreatePayload, RecetaUpdatePayload, RecetaCatalog,
} from './recetas'

export { proyectosApi } from './proyectos'
export type {
  ProyectoRow, ProyectoCreatePayload, ProyectoUpdatePayload, ProyectoCatalog,
  ProyectoLocation,
  TipoProyecto, EstadoProyecto, TipoMeta, EstadoMeta, VendedorOption,
} from './proyectos'

export { comentariosApi, ALLOWED_EMOJIS } from './comentarios'
export type {
  Comentario, ComentarioCreatePayload, ComentarioUpdatePayload,
  ParentSnippet, ReaccionAgg, AllowedEmoji,
  TeamUser, ConversacionItem, BadgeProyecto, TopbarBadge,
} from './comentarios'

export { pagosApi } from './pagos'
export type {
  PagoRow, PagosResumen, PagosTabResponse,
  PagoCreatePayload, PagoUpdatePayload, MetodoPago,
  TipoPago, StatusPago,
} from './pagos'

export { cotizacionesApi } from './cotizaciones'
export type {
  Cotizacion, CotizacionItem, CotizacionSeccion, CotizacionSummary,
  CotizacionCatalog, CotizacionCreatePayload, CotizacionUpdatePayload,
  SeccionCreatePayload, SeccionUpdatePayload,
  ItemCreatePayload, ItemUpdatePayload,
  EstadoCotizacion,
  DesviacionItem, DesviacionResumen,
} from './cotizaciones'

export { navApi } from './nav'
export type {
  NavConfig, NavSectionDTO, NavItemDTO,
  NavAdminConfig, NavSectionAdminDTO, NavItemAdminDTO,
  NavSectionCreatePayload, NavSectionUpdatePayload, NavItemUpdatePayload,
} from './nav'

export { eventosApi } from './eventos'
export type {
  Evento, EventoCreatePayload, EventoUpdatePayload,
  ParticipanteEvento, TipoEvento, EventoKind,
} from './eventos'

export { ApiError, API_URL } from './client'
