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
} from './users'

export { proveedoresApi } from './proveedores'
export type { Proveedor, ProveedorCreatePayload, ProveedorUpdatePayload } from './proveedores'

export { clientesApi } from './clientes'
export type { Cliente, ClienteCreatePayload, ClienteUpdatePayload, TipoCliente } from './clientes'

export { materialesApi } from './materiales'
export type { Material, MaterialCreatePayload, MaterialUpdatePayload, MaterialCatalog } from './materiales'

export { ApiError, API_URL } from './client'
