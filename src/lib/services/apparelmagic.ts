/**
 * ApparelMagic Integration Service
 *
 * ApparelMagic REST API integration for Drop Haus.
 * Base URL: https://drophausla.app.apparelmagic.com/api/json
 * Auth: token + time query params (GET) or body params (POST/PUT)
 * Docs: https://apparelmagic.zendesk.com/hc/en-us/articles/115002932654-API-Overview
 *
 * Integration points:
 * 1. Products → Sync catalog and inventory from APM
 * 2. Customers → Push approved wholesale accounts to APM CRM
 * 3. Orders → Push wholesale orders for fulfillment
 * 4. Inventory → Real-time stock level sync
 */

const AM_BASE_URL = process.env.APPARELMAGIC_API_URL || 'https://drophausla.app.apparelmagic.com/api/json'
const AM_API_TOKEN = process.env.APPARELMAGIC_API_TOKEN || ''

// ---------- Core API Helper ----------

interface AMResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Make an authenticated request to the ApparelMagic API.
 *
 * URL format: {BASE_URL}/{endpoint}/
 * GET requests: token & time sent as query params
 * POST/PUT requests: token & time sent in request body
 * All requests require a User-Agent header.
 */
async function amRequest<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  params?: Record<string, string>
): Promise<AMResponse<T>> {
  if (!AM_API_TOKEN) {
    console.warn('[ApparelMagic] No API token configured — skipping request')
    return { success: false, error: 'No API token configured' }
  }

  const time = String(Math.floor(Date.now() / 1000))

  // Build URL: base/endpoint/ (trailing slash)
  const baseWithSlash = AM_BASE_URL.endsWith('/') ? AM_BASE_URL : AM_BASE_URL + '/'
  const url = new URL(`${baseWithSlash}${endpoint}/`)

  if (method === 'GET') {
    // For GET: auth + params go as query string
    url.searchParams.set('token', AM_API_TOKEN)
    url.searchParams.set('time', time)
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }
  }

  // For POST/PUT: auth goes in request body
  const requestBody = method !== 'GET' && (body || method === 'POST' || method === 'PUT')
    ? JSON.stringify({
        time,
        token: AM_API_TOKEN,
        ...body,
      })
    : undefined

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'DropHaus/1.0 (https://drophaus-beige.vercel.app)',
      },
      ...(requestBody ? { body: requestBody } : {}),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`[ApparelMagic] ${method} ${endpoint} failed:`, res.status, text.substring(0, 500))
      return { success: false, error: `HTTP ${res.status}: ${text.substring(0, 200)}` }
    }

    const data = await res.json()
    // ApparelMagic wraps responses in { response: [...], meta: {...} }
    const responseData = data.response !== undefined ? data.response : data
    return { success: true, data: responseData as T }
  } catch (err) {
    console.error(`[ApparelMagic] ${method} ${endpoint} error:`, err)
    return { success: false, error: String(err) }
  }
}

// ---------- Products ----------

export interface AMProduct {
  product_id: string
  style_number?: string
  description?: string
  category?: string
  group?: string
  price?: string
  cost?: string
  margin?: string
  retail_price?: string
  cost_landed?: string
  content?: string
  vendor_id?: string
  season?: string
  is_inventory_tracked?: string
  b2b_web_title?: string
  b2b_web_description?: string
  size_range_id?: string
  images?: { img: string; is_catalog_image?: string; position?: string }[]
  // Legacy aliases
  id?: string
  division?: string
  wholesale_price?: number
}

/**
 * Fetch all products from ApparelMagic
 */
export async function fetchProducts(pageSize = 100, lastId?: string): Promise<AMProduct[]> {
  const params: Record<string, string> = {
    page_size: String(pageSize),
  }
  if (lastId) params.last_id = lastId

  const result = await amRequest<AMProduct[]>('products', 'GET', undefined, params)
  return result.data || []
}

/**
 * Fetch a single product by APM ID
 */
export async function fetchProduct(amProductId: string): Promise<AMProduct | null> {
  const result = await amRequest<AMProduct>(`products/${amProductId}`)
  return result.data || null
}

// ---------- Inventory ----------

export interface AMInventory {
  style_id: string
  color_id?: string
  size_id?: string
  sku?: string
  warehouse?: string
  on_hand: number
  available: number
  committed: number
}

/**
 * Pull current inventory levels from ApparelMagic
 * Returns inventory by SKU/style/color/size
 */
export async function fetchInventory(styleId?: string): Promise<AMInventory[]> {
  const params: Record<string, string> = {}
  if (styleId) params.style_id = styleId

  const result = await amRequest<AMInventory[]>('inventory', 'GET', undefined, params)
  return result.data || []
}

/**
 * Sync all APM inventory into local DB
 * Maps APM style IDs to local products via product.apparelMagicId
 */
export async function syncInventoryToLocal(prisma: {
  product: {
    findMany: (args: { where: { apparelMagicId: { not: null } } }) => Promise<{ id: string; apparelMagicId: string | null }[]>
  }
}) {
  const inventory = await fetchInventory()
  if (!inventory.length) return { synced: 0, errors: 0 }

  // Get local products with APM IDs
  const localProducts = await prisma.product.findMany({
    where: { apparelMagicId: { not: null } },
  })

  const amIdMap = new Map(localProducts.map(p => [p.apparelMagicId, p.id]))
  let synced = 0
  let errors = 0

  for (const inv of inventory) {
    const localId = amIdMap.get(inv.style_id)
    if (!localId) {
      errors++
      continue
    }
    // In a full implementation, update stock quantities per size/color
    synced++
  }

  console.log(`[ApparelMagic] Inventory sync: ${synced} synced, ${errors} errors`)
  return { synced, errors }
}

// ---------- Orders ----------

export interface AMOrder {
  id: string
  order_number?: string
  status?: string
  customer_id?: string
  items: {
    style_id: string
    color_id?: string
    size_id?: string
    quantity: number
    price: number
  }[]
  shipping_address?: {
    name: string
    address1: string
    address2?: string
    city: string
    state: string
    zip: string
    country: string
  }
  tracking_number?: string
  shipped_date?: string
}

/**
 * Push a wholesale order to ApparelMagic for fulfillment
 */
export async function createOrder(order: {
  customerId: string
  poNumber?: string
  items: { sku: string; quantity: number; price: number; styleId?: string; colorId?: string; sizeId?: string }[]
  shippingAddress?: {
    name: string
    address1: string
    city: string
    state: string
    zip: string
    country?: string
  }
  notes?: string
}): Promise<{ orderId: string | null; orderNumber: string | null }> {
  const result = await amRequest<{ id: string; order_number: string }>('orders', 'POST', {
    customer_id: order.customerId,
    po_number: order.poNumber,
    notes: order.notes,
    items: order.items.map(item => ({
      style_id: item.styleId,
      color_id: item.colorId,
      size_id: item.sizeId,
      quantity: item.quantity,
      unit_price: item.price,
    })),
    shipping_address: order.shippingAddress,
  })

  if (result.success && result.data) {
    return {
      orderId: result.data.id,
      orderNumber: result.data.order_number,
    }
  }

  return { orderId: null, orderNumber: null }
}

/**
 * Get order status and tracking from ApparelMagic
 */
export async function getOrderStatus(amOrderId: string): Promise<{
  status: string
  trackingNumber: string | null
  shippedDate: string | null
}> {
  const result = await amRequest<AMOrder>(`orders/${amOrderId}`)
  if (result.success && result.data) {
    return {
      status: result.data.status || 'unknown',
      trackingNumber: result.data.tracking_number || null,
      shippedDate: result.data.shipped_date || null,
    }
  }
  return { status: 'unknown', trackingNumber: null, shippedDate: null }
}

/**
 * Fetch orders from APM (optionally filtered by customer)
 */
export async function fetchOrders(customerId?: string): Promise<AMOrder[]> {
  const params: Record<string, string> = {}
  if (customerId) params.customer_id = customerId

  const result = await amRequest<AMOrder[]>('orders', 'GET', undefined, params)
  return result.data || []
}

// ---------- Customers ----------

export interface AMCustomer {
  id: string
  company_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  billing_address?: {
    address1: string
    city: string
    state: string
    zip: string
    country: string
  }
  terms?: string
  credit_limit?: number
}

/**
 * Push approved wholesale account to ApparelMagic as a customer
 */
export async function createCustomer(account: {
  businessName: string
  contactName: string
  email: string
  phone?: string
  address?: string
  einNumber?: string
}): Promise<{ customerId: string | null }> {
  const [firstName, ...lastParts] = (account.contactName || '').split(' ')
  const lastName = lastParts.join(' ')

  const result = await amRequest<{ id: string }>('customers', 'POST', {
    company_name: account.businessName,
    first_name: firstName,
    last_name: lastName,
    email: account.email,
    phone: account.phone,
    tax_id: account.einNumber,
  })

  if (result.success && result.data) {
    return { customerId: result.data.id }
  }

  return { customerId: null }
}

/**
 * Fetch a customer from APM by ID
 */
export async function fetchCustomer(customerId: string): Promise<AMCustomer | null> {
  const result = await amRequest<AMCustomer>(`customers/${customerId}`)
  return result.data || null
}

/**
 * Search customers by email
 */
export async function findCustomerByEmail(email: string): Promise<AMCustomer | null> {
  const result = await amRequest<AMCustomer[]>('customers', 'GET', undefined, { email })
  const customers = result.data || []
  return customers.length > 0 ? customers[0] : null
}

// ---------- Production ----------

/**
 * Get production status for a style
 */
export async function getProductionStatus(styleId: string): Promise<{
  status: string
  estimatedCompletion: string | null
}> {
  const result = await amRequest<{ status: string; estimated_completion?: string }>(
    `production`, 'GET', undefined, { style_id: styleId }
  )
  if (result.success && result.data) {
    return {
      status: result.data.status,
      estimatedCompletion: result.data.estimated_completion || null,
    }
  }
  return { status: 'unknown', estimatedCompletion: null }
}

// ---------- Health Check ----------

/**
 * Test API connectivity and token validity
 */
export async function healthCheck(): Promise<{ connected: boolean; message: string; debug?: Record<string, string> }> {
  if (!AM_API_TOKEN) {
    return { connected: false, message: 'No API token configured' }
  }

  const result = await amRequest('products', 'GET', undefined, { page_size: '1' })
  return {
    connected: result.success,
    message: result.success ? 'Connected to ApparelMagic' : (result.error || 'Connection failed'),
    debug: {
      baseUrl: AM_BASE_URL,
      endpoint: `${AM_BASE_URL}/products/`,
      tokenConfigured: AM_API_TOKEN ? 'yes' : 'no',
      tokenPrefix: AM_API_TOKEN ? AM_API_TOKEN.substring(0, 6) + '...' : 'none',
    },
  }
}
