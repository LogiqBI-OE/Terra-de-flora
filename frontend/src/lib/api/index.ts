export { authApi } from './auth'
export type { Role, LoginPayload, LoginResponse } from './auth'

export { systemConfigApi } from './systemConfig'
export type { SystemConfigItem } from './systemConfig'

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

export { comentariosApi } from './comentarios'
export type { Comentario, ComentarioCreatePayload } from './comentarios'

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
} from './cotizaciones'

export { ApiError, API_URL } from './client'
