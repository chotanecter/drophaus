/**
 * Shopify Integration Service
 * 
 * Drop Haus uses Shopify for payment processing and storefront management.
 * This service will handle product sync, checkout creation, and order management.
 * 
 * Setup:
 * 1. Install Shopify Buy SDK: npm install shopify-buy
 * 2. Create a Shopify custom app with Storefront API access
 * 3. Add credentials to .env
 * 
 * Future: Connect Shopify Buy SDK for cart/checkout
 * The "Add to Cart" buttons on the frontend are pre-wired to call these functions.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || ''
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SHOPIFY_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || ''

// ---------- Product Sync ----------

/**
 * Sync products from local DB to Shopify
 * Called when admin creates/updates products
 */
export async function syncProductToShopify(product: {
  name: string
  description: string
  price: number
  variants: { size: string; color: string }[]
}) {
  // TODO: Use Shopify Admin API to create/update product
  // POST https://{store}.myshopify.com/admin/api/2024-01/products.json
  console.log('[Shopify] syncProduct placeholder:', product.name)
  return { shopifyProductId: null, shopifyVariantId: null }
}

/**
 * Fetch products from Shopify to sync locally
 */
export async function fetchShopifyProducts() {
  // TODO: Use Storefront API to fetch products
  console.log('[Shopify] fetchProducts placeholder')
  return []
}

// ---------- Checkout ----------

/**
 * Create a Shopify checkout session
 * Called when customer clicks "Buy Now" or proceeds to checkout
 */
export async function createCheckout(items: {
  variantId: string
  quantity: number
}[]) {
  // TODO: Use Shopify Buy SDK
  // const client = ShopifyBuy.buildClient({ domain, storefrontAccessToken })
  // const checkout = await client.checkout.create()
  // await client.checkout.addLineItems(checkout.id, items)
  console.log('[Shopify] createCheckout placeholder:', items.length, 'items')
  return { checkoutUrl: null }
}

// ---------- Orders ----------

/**
 * Fetch orders from Shopify
 * Used in admin dashboard and wholesale portal order history
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getOrders(customerId?: string) {
  // TODO: Use Shopify Admin API to fetch orders
  console.log('[Shopify] getOrders placeholder')
  return []
}

/**
 * Get a single order by ID
 */
export async function getOrder(orderId: string) {
  // TODO: Fetch single order from Shopify
  console.log('[Shopify] getOrder placeholder:', orderId)
  return null
}

// ---------- Inventory ----------

/**
 * Check inventory levels for a product variant
 */
export async function checkInventory(variantId: string) {
  // TODO: Query Shopify inventory levels
  console.log('[Shopify] checkInventory placeholder:', variantId)
  return { available: true, quantity: 0 }
}
