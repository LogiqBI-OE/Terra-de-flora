import { request } from './client'

export interface Planta {
  id: number
  codigo: string
  nombre: string
  ubicacion?: string | null
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
  familia?: string | null
  categoria?: string | null
}

const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) })
const patch = (body: unknown) => ({ method: 'PATCH', body: JSON.stringify(body) })
const del = { method: 'DELETE' }

export const catalogApi = {
  // Plantas
  plantas: () => request<Planta[]>('/catalog/plantas'),
  createPlanta: (p: Omit<Planta, 'id'>) => request<Planta>('/catalog/plantas', json(p)),
  updatePlanta: (id: number, p: Partial<Omit<Planta, 'id' | 'codigo'>>) => request<Planta>(`/catalog/plantas/${id}`, patch(p)),
  deletePlanta: (id: number) => request<void>(`/catalog/plantas/${id}`, del),

  // Customers
  customers: () => request<Customer[]>('/catalog/customers'),
  createCustomer: (c: Omit<Customer, 'id'>) => request<Customer>('/catalog/customers', json(c)),
  updateCustomer: (id: number, c: Partial<Omit<Customer, 'id' | 'codigo'>>) => request<Customer>(`/catalog/customers/${id}`, patch(c)),
  deleteCustomer: (id: number) => request<void>(`/catalog/customers/${id}`, del),

  // Productos
  productos: () => request<Producto[]>('/catalog/productos'),
  createProducto: (p: Omit<Producto, 'id'>) => request<Producto>('/catalog/productos', json(p)),
  updateProducto: (id: number, p: Partial<Omit<Producto, 'id' | 'sku'>>) => request<Producto>(`/catalog/productos/${id}`, patch(p)),
  deleteProducto: (id: number) => request<void>(`/catalog/productos/${id}`, del),
}
