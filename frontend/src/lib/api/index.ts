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

export { ApiError, API_URL } from './client'
