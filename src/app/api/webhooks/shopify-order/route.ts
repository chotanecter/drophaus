/**
 * Shopify Order Webhook Handler
 *
 * Receives `orders/create` webhooks from Shopify and pushes the order
 * to ApparelMagic so inventory stays in sync.
 *
 * Flow:
 * 1. Verify HMAC signature (ensures request is from Shopify)
 * 2. Parse line items from the Shopify order
 * 3. Map Shopify variant IDs â local products â ApparelMagic style IDs
 * 4. Push order to ApparelMagic via createOrder()
 * 5. ApparelMagic decrements inventory automatically
 *
 * Required env vars:
 *   SHOPIFY_WEBHOOK_SECRET â from Shopify webhook settings
 *   APPARELMAGIC_API_URL   â APM base URL
 *   APPARELMAGIC_API_TOKEN â APM auth token
 */

import { NextResponse } from 'next/server'
import { createOrder } from '@/lib/services/apparelmagic'
import { PrismaClient } from '@prisma/client'
import { createHmac } from 'crypto'

const prisma = new PrismaClient()

// ---------- HMAC Verification ----------

function verifyShopifyHmac(body: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret || !hmacHeader) return false

  const computed = createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64')

  return computed === hmacHeader
}

// ---------- Webhook Handler ----------

export async function POST(request: Request) {
  const rawBody = await request.text()
  const hmac = request.headers.get('x-shopify-hmac-sha256')
  const topic = request.headers.get('x-shopify-topic')

  // 1. Verify HMAC signature
  if (!verifyShopifyHmac(rawBody, hmac)) {
    console.error('[Shopify Webhook] HMAC verification failed')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log(`[Shopify Webhook] Received topic: ${topic}`)

  // 2. Parse the order payload
  let order: ShopifyOrder
  try {
    order = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // 3. Extract Shopify variant IDs from line items
  const variantIds = order.line_items
    .map((item) => String(item.variant_id))
    .filter(Boolean)

  if (variantIds.length === 0) {
    console.log('[Shopify Webhook] No variant IDs in order, skipping APM sync')
    return NextResponse.json({ ok: true, synced: false, reason: 'no_variants' })
  }

  // 4. Map variant IDs â local products â APM style IDs
  const products = await prisma.product.findMany({
    where: { shopifyVariantId: { in: variantIds } },
    select: {
      id: true,
      shopifyVariantId: true,
      apparelMagicId: true,
      name: true,
    },
  })

  const productMap = new Map(
    products.map((p) => [p.shopifyVariantId, p])
  )

  // Build APM order items
  const amItems = order.line_items
    .map((item) => {
      const product = productMap.get(String(item.variant_id))
      if (!product?.apparelMagicId) {
        console.warn(
          `[Shopify Webhook] No APM mapping for variant ${item.variant_id} (${item.title})`
        )
        return null
      }

      return {
        sku: item.sku || '',
        quantity: item.quantity,
        price: parseFloat(item.price),
        styleId: product.apparelMagicId,
        // Extract size/color from Shopify variant title (e.g. "M / Black")
        colorId: undefined as string | undefined,
        sizeId: undefined as string | undefined,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  if (amItems.length === 0) {
    console.log('[Shopify Webhook] No items with APM mappings, skipping')
    return NextResponse.json({ ok: true, synced: false, reason: 'no_apm_mappings' })
  }

  // 5. Push order to ApparelMagic
  try {
    const shippingAddr = order.shipping_address
    const result = await createOrder({
      customerId: '', // DTC orders â no APM customer, use default
      poNumber: `SHOPIFY-${order.order_number}`,
      items: amItems,
      shippingAddress: shippingAddr
        ? {
            name: `${shippingAddr.first_name} ${shippingAddr.last_name}`,
            address1: shippingAddr.address1,
            city: shippingAddr.city,
            state: shippingAddr.province_code || shippingAddr.province,
            zip: shippingAddr.zip,
            country: shippingAddr.country_code || 'US',
          }
        : undefined,
      notes: `Shopify Order #${order.order_number} | ${order.email}`,
    })

    console.log(
      `[Shopify Webhook] APM order created: ${result.orderId} (${result.orderNumber}) for Shopify #${order.order_number}`
    )

    return NextResponse.json({
      ok: true,
      synced: true,
      shopifyOrder: order.order_number,
      amOrderId: result.orderId,
      amOrderNumber: result.orderNumber,
      itemsSynced: amItems.length,
    })
  } catch (err) {
    console.error('[Shopify Webhook] Failed to create APM order:', err)
    return NextResponse.json(
      { error: 'Failed to sync order to ApparelMagic' },
      { status: 500 }
    )
  }
}

// ---------- Type Definitions ----------

interface ShopifyOrder {
  id: number
  order_number: number
  email: string
  total_price: string
  financial_status: string
  fulfillment_status: string | null
  line_items: {
    id: number
    variant_id: number
    title: string
    quantity: number
    price: string
    sku: string
    variant_title: string
  }[]
  shipping_address?: {
    first_name: string
    last_name: string
    address1: string
    address2?: string
    city: string
    province: string
    province_code: string
    zip: string
    country: string
    country_code: string
  }
  created_at: string
}
