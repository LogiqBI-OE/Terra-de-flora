import { request } from './client'

export interface Planta {
  id: number
  codigo: string
  nombre: string
}

export interface Customer {
  id: number
  codigo: string
  nombre: string
}

export interface Producto {
  id: number
  sku: string
  nombre: string
  unidad: string
}

export const catalogApi = {
  plantas: () => request<Planta[]>('/catalog/plantas'),
  customers: () => request<Customer[]>('/catalog/customers'),
  productos: () => request<Producto[]>('/catalog/productos'),
}
