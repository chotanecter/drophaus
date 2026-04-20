/**
 * Shopify Integration Service
 *
 * Drop Haus uses Shopify for retail checkout.
 * - Storefront API: Product display and checkout creation (public)
 * - Admin API: Product/order management (server-side only)
 * - Draft Orders: Wholesale checkout with custom pricing (B2B)
 *
 * Setup:
 * 1. Create Shopify custom app in your store's admin
 * 2. Enable Storefront API access (products, checkout, cart)
 * 3. Enable Admin API access (products, orders, inventory, draft_orders)
 * 4. Add credentials to .env:
 *    SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
 *    SHOPIFY_STOREFRONT_TOKEN=your-storefront-token
 *    SHOPIFY_ADMIN_TOKEN=your-admin-api-token
 */

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || ''
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || ''
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || ''
const API_VERSION = '2024-10'

// ---------- Core API Helpers ----------

async function storefrontQuery<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
  if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) {
    console.warn('[Shopify] No Storefront credentials configured')
    return null
  }

  try {
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query, variables }),
      }
    )

    if (!res.ok) {
      console.error('[Shopify Storefront]', res.status, await res.text())
      return null
    }

    const json = await res.json()
    if (json.errors) {
      console.error('[Shopify Storefront] GraphQL errors:', json.errors)
      return null
    }
    return json.data as T
  } catch (err) {
    console.error('[Shopify Storefront] Error:', err)
    return null
  }
}

async function adminRequest<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T | null> {
  if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN) {
    console.warn('[Shopify] No Admin credentials configured')
    return null
  }

  try {
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/${endpoint}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ADMIN_TOKEN,
        },
        ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
      }
    )

    if (!res.ok) {
      console.error(`[Shopify Admin] ${method} ${endpoint}:`, res.status, await res.text())
      return null
    }

    return await res.json() as T
  } catch (err) {
    console.error(`[Shopify Admin] Error:`, err)
    return null
  }
}

// ---------- Product Sync ----------

export interface ShopifyProduct {
  id: string
  title: string
  handle: string
  description: string
  variants: {
    id: string
    title: string
    price: string
    sku?: string
    inventory_quantity?: number
  }[]
  images: { src: string }[]
}

/**
 * Sync a local product to Shopify (create or update)
 */
export async function syncProductToShopify(product: {
  name: string
  slug: string
  description: string
  price: number
  sizes: string[]
  colors: string[]
  fabricWeight?: string
  fabricMaterial?: string
  shopifyProductId?: string | null
}): Promise<{ shopifyProductId: string | null; shopifyVariantId: string | null }> {
  // Build variants from size/color combinations
  const variants = product.sizes.flatMap(size =>
    product.colors.map(color => ({
      option1: size,
      option2: color,
      price: String(product.price),
    }))
  )

  const shopifyData = {
    product: {
      title: product.name,
      body_html: product.description,
      vendor: 'DropHaus',
      product_type: product.fabricMaterial || 'Apparel',
      tags: [product.fabricWeight, product.fabricMaterial].filter(Boolean).join(', '),
      options: [
        { name: 'Size', values: product.sizes },
        { name: 'Color', values: product.colors },
      ],
      variants: variants.length > 0 ? variants : [{ price: String(product.price) }],
    },
  }

  if (product.shopifyProductId) {
    // Update existing
    const result = await adminRequest<{ product: { id: number; variants: { id: number }[] } }>(
      `products/${product.shopifyProductId}.json`,
      'PUT',
      shopifyData
    )
    return {
      shopifyProductId: result?.product?.id ? String(result.product.id) : product.shopifyProductId,
      shopifyVariantId: result?.product?.variants?.[0]?.id ? String(result.product.variants[0].id) : null,
    }
  } else {
    // Create new
    const result = await adminRequest<{ product: { id: number; variants: { id: number }[] } }>(
      'products.json',
      'POST',
      shopifyData
    )
    return {
      shopifyProductId: result?.product?.id ? String(result.product.id) : null,
      shopifyVariantId: result?.product?.variants?.[0]?.id ? String(result.product.variants[0].id) : null,
    }
  }
}

/**
 * Fetch all products from Shopify
 */
export async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const result = await adminRequest<{ products: ShopifyProduct[] }>('products.json?limit=250')
  return result?.products || []
}

// ---------- Checkout (Storefront API) ----------

/**
 * Create a Shopify cart and return checkout URL
 * This uses the Storefront API Cart which redirects to Shopify's hosted checkout
 */
export async function createCheckout(items: {
  variantId: string
  quantity: number
}[]): Promise<{ checkoutUrl: string | null; error?: string; userErrors?: { field: string; message: string }[] }> {
  const lines = items.map(item => ({
    merchandiseId: `gid://shopify/ProductVariant/${item.variantId}`,
    quantity: item.quantity,
  }))

  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const data = await storefrontQuery<{
    cartCreate: {
      cart: { id: string; checkoutUrl: string } | null
      userErrors: { field: string; message: string }[]
    }
  }>(query, { input: { lines } })

  if (!data) {
    console.error('[Shopify] createCheckout returned null — likely missing Storefront token or scope issue')
    return {
      checkoutUrl: null,
      error: `Storefront API returned null. Domain configured: ${!!SHOPIFY_DOMAIN}, Token configured: ${!!STOREFRONT_TOKEN}`,
    }
  }

  if (data.cartCreate?.userErrors?.length) {
    console.error('[Shopify] Cart userErrors:', data.cartCreate.userErrors)
    return {
      checkoutUrl: null,
      error: 'Cart creation had user errors',
      userErrors: data.cartCreate.userErrors,
    }
  }

  return {
    checkoutUrl: data?.cartCreate?.cart?.checkoutUrl || null,
  }
}

// ---------- Wholesale Draft Orders (Admin API) ----------

/**
 * Create a Shopify Draft Order with custom wholesale line-item prices.
 *
 * Draft Orders let us set any price per line item — perfect for B2B wholesale.
 * After creation, we get an invoice_url where the wholesaler pays via credit card
 * on Shopify's hosted checkout.
 *
 * Flow:
 * 1. Build line items with custom wholesale prices
 * 2. Create draft order via Admin API
 * 3. Return the invoice URL for payment
 */
export async function createWholesaleDraftOrder(params: {
  items: {
    variantId: string
    quantity: number
    wholesalePrice: number
    title: string
  }[]
  customerEmail: string
  businessName: string
  note?: string
}): Promise<{
  success: boolean
  invoiceUrl?: string
  draftOrderId?: string
  error?: string
}> {
  if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN) {
    return { success: false, error: 'No Shopify Admin credentials configured' }
  }

  // Build line items with custom prices
  const line_items = params.items.map(item => ({
    variant_id: Number(item.variantId),
    quantity: item.quantity,
    price: item.wholesalePrice.toFixed(2),
    title: item.title,
    requires_shipping: true,
    taxable: true,
  }))

  const draftOrderData = {
    draft_order: {
      line_items,
      email: params.customerEmail,
      note: `Wholesale Order — ${params.businessName}${params.note ? `\n${params.note}` : ''}`,
      tags: 'wholesale, b2b',
      tax_exempt: false,
      use_customer_default_address: true,
    },
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await adminRequest<{ draft_order: any }>(
      'draft_orders.json',
      'POST',
      draftOrderData
    )

    if (!result?.draft_order) {
      return { success: false, error: 'Failed to create draft order' }
    }

    const draftOrder = result.draft_order
    console.log(`[Shopify] Draft order created: ${draftOrder.id} for ${params.businessName}`)

    return {
      success: true,
      invoiceUrl: draftOrder.invoice_url || null,
      draftOrderId: String(draftOrder.id),
    }
  } catch (err) {
    console.error('[Shopify] Draft order error:', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Send the draft order invoice email to the customer.
 * The email contains a link to Shopify's hosted checkout with the wholesale prices.
 */
export async function sendDraftOrderInvoice(draftOrderId: string, params?: {
  to?: string
  subject?: string
  customMessage?: string
}): Promise<{ success: boolean; invoiceUrl?: string; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await adminRequest<{ draft_order: any }>(
      `draft_orders/${draftOrderId}/send_invoice.json`,
      'POST',
      {
        draft_order_invoice: {
          to: params?.to,
          subject: params?.subject || 'DropHaus Wholesale Order — Invoice',
          custom_message: params?.customMessage || 'Your wholesale order is ready for payment. Click the link below to complete your purchase.',
        },
      }
    )

    if (result?.draft_order) {
      return {
        success: true,
        invoiceUrl: result.draft_order.invoice_url,
      }
    }

    return { success: false, error: 'Failed to send invoice' }
  } catch (err) {
    console.error('[Shopify] Send invoice error:', err)
    return { success: false, error: String(err) }
  }
}

// ---------- Orders (Admin API) ----------

/**
 * Fetch orders from Shopify
 */
export async function getOrders(limit = 50): Promise<{
  id: number
  order_number: number
  email: string
  total_price: string
  financial_status: string
  fulfillment_status: string | null
  created_at: string
}[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await adminRequest<{ orders: any[] }>(`orders.json?limit=${limit}&status=any`)
  return result?.orders || []
}

/**
 * Get a single order
 */
export async function getOrder(orderId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await adminRequest<{ order: any }>(`orders/${orderId}.json`)
  return result?.order || null
}

// ---------- Inventory (Admin API) ----------

/**
 * Check inventory for a product variant
 */
export async function checkInventory(inventoryItemId: string): Promise<{
  available: number
  locationId: string | null
}> {
  const result = await adminRequest<{
    inventory_levels: { available: number; location_id: number }[]
  }>(`inventory_levels.json?inventory_item_ids=${inventoryItemId}`)

  const level = result?.inventory_levels?.[0]
  return {
    available: level?.available || 0,
    locationId: level?.location_id ? String(level.location_id) : null,
  }
}

/**
 * Get the inventory_item_id for a product variant
 * Shopify requires inventory_item_id (not variant_id) for inventory operations
 */
export async function getVariantInventoryItemId(variantId: string): Promise<string | null> {
  const result = await adminRequest<{
    variant: { id: number; inventory_item_id: number }
  }>(`variants/${variantId}.json`)
  return result?.variant?.inventory_item_id ? String(result.variant.inventory_item_id) : null
}

/**
 * Get the primary location ID for the Shopify store
 * Most stores have a single location; we cache after first call
 */
let cachedLocationId: string | null = null

export async function getPrimaryLocationId(): Promise<string | null> {
  if (cachedLocationId) return cachedLocationId

  const result = await adminRequest<{
    locations: { id: number; name: string; active: boolean }[]
  }>('locations.json')

  const primary = result?.locations?.find(l => l.active)
  if (primary) {
    cachedLocationId = String(primary.id)
    return cachedLocationId
  }
  return null
}

/**
 * Set the available inventory level for a specific inventory item at a location.
 * Uses Shopify's inventory_levels/set endpoint which sets an absolute quantity.
 */
export async function setInventoryLevel(
  inventoryItemId: string,
  locationId: string,
  available: number
): Promise<{ success: boolean; error?: string }> {
  const result = await adminRequest<{
    inventory_level: { inventory_item_id: number; location_id: number; available: number }
  }>('inventory_levels/set.json', 'POST', {
    location_id: Number(locationId),
    inventory_item_id: Number(inventoryItemId),
    available: Math.max(0, Math.floor(available)),
  })

  if (result?.inventory_level) {
    return { success: true }
  }
  return { success: false, error: 'Failed to set inventory level' }
}

/**
 * Batch sync inventory from ApparelMagic data to Shopify.
 * Takes mapped product data and pushes available quantities to Shopify.
 *
 * Flow:
 * 1. Get primary Shopify location
 * 2. For each product with both apparelMagicId and shopifyVariantId:
 *    a. Look up inventory_item_id from Shopify variant
 *    b. Set inventory level using ApparelMagic's "available" quantity
 *
 * Returns summary of sync results.
 */
export async function syncInventoryToShopify(
  products: {
    localId: string
    name: string
    shopifyVariantId: string
    amAvailable: number
  }[]
): Promise<{
  success: boolean
  synced: number
  failed: number
  skipped: number
  details: { name: string; shopifyVariantId: string; available: number; status: string; error?: string }[]
}> {
  if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN) {
    return {
      success: false,
      synced: 0,
      failed: products.length,
      skipped: 0,
      details: [{ name: 'ALL', shopifyVariantId: '', available: 0, status: 'error', error: 'No Shopify Admin credentials' }],
    }
  }

  const locationId = await getPrimaryLocationId()
  if (!locationId) {
    return {
      success: false,
      synced: 0,
      failed: products.length,
      skipped: 0,
      details: [{ name: 'ALL', shopifyVariantId: '', available: 0, status: 'error', error: 'Could not determine Shopify location' }],
    }
  }

  const details: { name: string; shopifyVariantId: string; available: number; status: string; error?: string }[] = []
  let synced = 0
  let failed = 0
  let skipped = 0

  for (const product of products) {
    try {
      // Get inventory_item_id from Shopify variant
      const inventoryItemId = await getVariantInventoryItemId(product.shopifyVariantId)
      if (!inventoryItemId) {
        details.push({
          name: product.name,
          shopifyVariantId: product.shopifyVariantId,
          available: product.amAvailable,
          status: 'skipped',
          error: 'Could not get inventory_item_id from variant',
        })
        skipped++
        continue
      }

      // Set the inventory level on Shopify
      const result = await setInventoryLevel(inventoryItemId, locationId, product.amAvailable)

      if (result.success) {
        details.push({
          name: product.name,
          shopifyVariantId: product.shopifyVariantId,
          available: product.amAvailable,
          status: 'synced',
        })
        synced++
      } else {
        details.push({
          name: product.name,
          shopifyVariantId: product.shopifyVariantId,
          available: product.amAvailable,
          status: 'failed',
          error: result.error,
        })
        failed++
      }

      // Small delay to avoid Shopify rate limits (2 req/sec for REST)
      await new Promise(resolve => setTimeout(resolve, 550))
    } catch (err) {
      details.push({
        name: product.name,
        shopifyVariantId: product.shopifyVariantId,
        available: product.amAvailable,
        status: 'failed',
        error: String(err),
      })
      failed++
    }
  }

  console.log(`[Shopify] Inventory sync complete: ${synced} synced, ${failed} failed, ${skipped} skipped`)
  return { success: failed === 0, synced, failed, skipped, details }
}

// ---------- Health Check ----------

export async function healthCheck(): Promise<{ connected: boolean; message: string; shopName?: string }> {
  if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN) {
    return { connected: false, message: 'No Shopify credentials configured' }
  }

  const result = await adminRequest<{ shop: { name: string; domain: string } }>('shop.json')
  if (result?.shop) {
    return {
      connected: true,
      message: `Connected to ${result.shop.name}`,
      shopName: result.shop.name,
    }
  }

  return { connected: false, message: 'Failed to connect to Shopify' }
}
