export type BusinessProfile = {
  id: number
  name: string
  phone: string | null
  address: string | null
  currency: string
}

export type StaffRole = 'owner' | 'manager' | 'waiter' | 'kitchen'
export type StaffUser = { id: number, name: string, email: string, role: StaffRole }
export type StaffInput = { name: string, email: string, role: Exclude<StaffRole, 'owner'>, password: string }

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}

let csrfToken = ''

export type MenuCategory = {
  id: number
  name: string
  sort_order: number
  is_active: boolean
}

export type MenuItem = {
  id: number
  menu_category_id: number
  name: string
  description: string | null
  price: string
  is_available: boolean
  sort_order: number
}

export type DiningTable = {
  id: number
  floor_area_id: number
  label: string
  capacity: number
  shape: 'round' | 'square' | 'rectangle'
  rotation: 0 | 90 | 180 | 270
  position_x: string
  position_y: string
}

export type FloorArea = {
  id: number
  name: string
  sort_order: number
  position_x: string
  position_y: string
  width: string
  height: string
}

export type FloorLayout = {
  entrance_side: 'top' | 'right' | 'bottom' | 'left'
  entrance_offset: string
}

export type BusinessInput = Omit<BusinessProfile, 'id'>
export type CategoryInput = Omit<MenuCategory, 'id'>
export type AreaInput = Omit<FloorArea, 'id' | 'position_x' | 'position_y' | 'width' | 'height'> & {
  position_x: number
  position_y: number
  width: number
  height: number
}
export type ItemInput = Omit<MenuItem, 'id' | 'price'> & { price: number }
export type TableInput = Omit<DiningTable, 'id' | 'position_x' | 'position_y'> & {
  position_x: number
  position_y: number
}

async function request<T>(path: string, method = 'GET', payload?: unknown): Promise<T> {
  if (method !== 'GET' && !csrfToken) await api.csrf()
  let response: Response
  try {
    response = await fetch(`/api/v1${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(method === 'GET' ? {} : { 'X-CSRF-TOKEN': csrfToken }),
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    })
  } catch {
    throw new Error('Cannot reach Laravel. Start the backend on port 8001.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') {
      throw new ApiError(body.message, response.status)
    }
    throw new ApiError(`Request failed (${response.status}).`, response.status)
  }
  if (typeof body !== 'object' || body === null || !('data' in body)) {
    throw new Error('Laravel returned an unexpected response.')
  }
  return body.data as T
}

export const api = {
  csrf: async () => {
    const result = await request<{ token: string }>('/auth/csrf')
    csrfToken = result.token
  },
  me: () => request<StaffUser>('/auth/me'),
  login: async (email: string, password: string) => {
    const result = await request<{ user: StaffUser, csrf_token: string }>('/auth/login', 'POST', { email, password })
    csrfToken = result.csrf_token
    return result.user
  },
  logout: async () => {
    const result = await request<{ csrf_token: string }>('/auth/logout', 'POST')
    csrfToken = result.csrf_token
  },
  staff: () => request<StaffUser[]>('/staff'),
  createStaff: (data: StaffInput) => request<StaffUser>('/staff', 'POST', data),
  deleteStaff: (id: number) => request<void>(`/staff/${id}`, 'DELETE'),
  health: async () => {
    const response = await fetch('/api/v1/health')
    const body: unknown = await response.json()
    if (!response.ok || typeof body !== 'object' || body === null || !('status' in body) || body.status !== 'ok') {
      throw new Error('Laravel health check failed.')
    }
  },
  business: () => request<BusinessProfile | null>('/business'),
  saveBusiness: (data: BusinessInput) => request<BusinessProfile>('/business', 'PUT', data),
  categories: () => request<MenuCategory[]>('/categories'),
  saveCategory: (data: CategoryInput, id?: number) =>
    request<MenuCategory>(id ? `/categories/${id}` : '/categories', id ? 'PUT' : 'POST', data),
  deleteCategory: (id: number) => request<void>(`/categories/${id}`, 'DELETE'),
  items: () => request<MenuItem[]>('/items'),
  saveItem: (data: ItemInput, id?: number) =>
    request<MenuItem>(id ? `/items/${id}` : '/items', id ? 'PUT' : 'POST', data),
  deleteItem: (id: number) => request<void>(`/items/${id}`, 'DELETE'),
  areas: () => request<FloorArea[]>('/areas'),
  saveArea: (data: AreaInput, id?: number) =>
    request<FloorArea>(id ? `/areas/${id}` : '/areas', id ? 'PUT' : 'POST', data),
  deleteArea: (id: number) => request<void>(`/areas/${id}`, 'DELETE'),
  layout: () => request<FloorLayout>('/layout'),
  saveLayout: (data: FloorLayout) => request<FloorLayout>('/layout', 'PUT', data),
  tables: () => request<DiningTable[]>('/tables'),
  saveTable: (data: TableInput, id?: number) =>
    request<DiningTable>(id ? `/tables/${id}` : '/tables', id ? 'PUT' : 'POST', data),
  deleteTable: (id: number) => request<void>(`/tables/${id}`, 'DELETE'),
}
