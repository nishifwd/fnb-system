export type BusinessProfile = {
  id: number
  name: string
  phone: string | null
  address: string | null
  currency: string
  service_mode: 'dine_in' | 'takeaway' | 'both'
  service_charge_rate: string
  tax_rate: string
  has_payment_qr: boolean
}

export type StaffRole = 'owner' | 'manager' | 'waiter' | 'kitchen'
export type StaffUser = { id: number, name: string, email: string, role: StaffRole }
export type StaffInput = { name: string, email: string, role: Exclude<StaffRole, 'owner'>, password: string }
export type ServiceTable = DiningTable & { area: string }
export type DrinkSize = 'small' | 'standard' | 'large'
export type DrinkOptions = { temperature: boolean, sugar: boolean, ice: boolean, sizes: DrinkSize[] }
export const defaultDrinkOptions = (): DrinkOptions => ({ temperature: false, sugar: false, ice: false, sizes: ['standard'] })
export type ServiceMenuItem = { id: number, name: string, price: string, category: string, is_drink: boolean, drink_options: DrinkOptions | null }
export type ServiceCatalog = { tables: ServiceTable[], areas: FloorArea[], layout: FloorLayout, menu: ServiceMenuItem[], currency: string, service_mode: BusinessProfile['service_mode'] }
export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'served'
type SugarLevel = 'standard' | 'less' | 'more'
type IceLevel = 'normal' | 'less' | 'none'
export type DrinkPreparation =
  { temperature: 'hot' | 'iced' | null, sugar: SugarLevel | null, ice: IceLevel | null, size: DrinkSize }
export function preparationLabel(preparation: DrinkPreparation | null): string {
  if (!preparation) return ''
  return [
    `${preparation.size[0].toUpperCase()}${preparation.size.slice(1)} size`,
    preparation.temperature && (preparation.temperature === 'iced' ? 'Iced' : 'Hot'),
    preparation.sugar && `${preparation.sugar} sugar`,
    preparation.ice && `${preparation.ice} ice`,
  ].filter(Boolean).join(' · ')
}
export type OrderLine = { id: number, menu_item_id: number | null, name: string, unit_price: string, quantity: number, line_total: string, preparation: DrinkPreparation | null, remark: string | null }
export type OrderItemInput = { menu_item_id: number, quantity: number, remark?: string | null, temperature?: 'hot' | 'iced', sugar?: SugarLevel, ice?: IceLevel, size?: DrinkSize }
export type ServiceOrder = { id: number, dining_table_id: number | null, table_label: string | null, order_type: 'dine_in' | 'takeaway', pickup_name: string | null, status: OrderStatus, total: string, currency: string, grand_total: string | null, paid_at: string | null, note: string | null, created_at: string, items: OrderLine[] }
export type PaymentMethod = 'cash' | 'card' | 'qr' | 'e_wallet'
export type Bill = {
  number: string
  business: { name: string, phone: string | null, address: string | null }
  currency: string
  destination: string
  subtotal: string
  discount_amount: string
  service_charge_rate: string
  service_charge_amount: string
  tax_rate: string
  tax_amount: string
  grand_total: string
  payment_method: PaymentMethod | null
  payment_reference: string | null
  payment_qr_available: boolean
  paid_at: string | null
}
export type BillingDetail = { order: ServiceOrder, bill: Bill }
export type BillingHistory = { orders: ServiceOrder[], page: number, pages: number, total: number }

export function orderDestination(order: ServiceOrder): string {
  return order.order_type === 'takeaway'
    ? `Takeaway${order.pickup_name ? ` · ${order.pickup_name}` : ''}`
    : `Table ${order.table_label ?? '?'}`
}

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
  is_drink: boolean
  drink_options: DrinkOptions | null
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
  entrance_x: string
  entrance_y: string
}

export type BusinessInput = Omit<BusinessProfile, 'id' | 'has_payment_qr'>
export type CategoryInput = Omit<MenuCategory, 'id' | 'sort_order'>
export type AreaInput = Omit<FloorArea, 'id' | 'position_x' | 'position_y' | 'width' | 'height'> & {
  position_x: number
  position_y: number
  width: number
  height: number
}
export type ItemInput = Omit<MenuItem, 'id' | 'price' | 'sort_order'> & { price: number }
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
        ...(payload === undefined || payload instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(method === 'GET' ? {} : { 'X-CSRF-TOKEN': csrfToken }),
      },
      body: payload === undefined ? undefined : payload instanceof FormData ? payload : JSON.stringify(payload),
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
  serviceCatalog: () => request<ServiceCatalog>('/service/catalog'),
  orders: () => request<ServiceOrder[]>('/orders'),
  placeOrder: (data: { order_type: 'dine_in' | 'takeaway', dining_table_id?: number, pickup_name?: string | null, note: string | null, items: OrderItemInput[] }) =>
    request<ServiceOrder>('/orders', 'POST', data),
  updateOrderStatus: (id: number, status: OrderStatus) => request<ServiceOrder>(`/orders/${id}/status`, 'PATCH', { status }),
  billingOrders: (filter: 'all' | 'unpaid' | 'paid', page: number) =>
    request<BillingHistory>(`/billing/orders?filter=${filter}&page=${page}`),
  billingOrder: (id: number, discountAmount = '0') =>
    request<BillingDetail>(`/billing/orders/${id}?discount_amount=${encodeURIComponent(discountAmount)}`),
  payOrder: (id: number, paymentMethod: Exclude<PaymentMethod, 'e_wallet'>, discountAmount: string, expectedGrandTotal: string, paymentReference: string | null) =>
    request<BillingDetail>(`/billing/orders/${id}/payment`, 'POST', {
      payment_method: paymentMethod,
      discount_amount: discountAmount,
      expected_grand_total: expectedGrandTotal,
      payment_reference: paymentReference,
      ...(paymentMethod === 'cash' ? {} : { confirmed_payment: true }),
    }),
  uploadPaymentQr: (file: File) => {
    const form = new FormData()
    form.append('qr', file)
    return request<BusinessProfile>('/business/payment-qr', 'POST', form)
  },
  removePaymentQr: () => request<void>('/business/payment-qr', 'DELETE'),
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
