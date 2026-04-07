/**
 * Shopify Integration Service
 *
 * Drop Haus uses Shopify for retail checkout.
 * - Storefront API: Product display and checkout creation (public)
 * - Admin API: Product/order management (server-side only)
 *
 * Setup:
 * 1. Create Shopify custom app in your store's admin
 * 2. Enable Storefront API access (products, checkout, cart)
 * 3. Enable Admin API access (products, orders, inventory)
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
}[]): Promise<{ checkoutUrl: string | null }> {
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

  return {
    checkoutUrl: data?.cartCreate?.cart?.checkoutUrl || null,
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
  const result = await adminRequest<{ orders: any[] }>(`orders.json?limit=${limit}&status=any`)
  return result?.orders || []
}

/**
 * Get a single order
 */
export async function getOrder(orderId: string) {
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
