export { authApi } from './auth'
export type { Role, LoginPayload, LoginResponse } from './auth'

export { snapshotsApi } from './snapshots'
export type { Snapshot, SnapshotStatus } from './snapshots'

export { uploadsApi } from './uploads'
export type { TipoUpload, UploadResult, UploadError } from './uploads'

export { templatesApi } from './templates'

export { coberturaApi } from './cobertura'
export type { CoberturaCell, CoberturaRow, CoberturaMatrix, CoberturaParams } from './cobertura'

export { catalogApi } from './catalog'
export type { Planta, Customer, Producto } from './catalog'

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
} from './users'

export { ApiError, API_URL } from './client'
