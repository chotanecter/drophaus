export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { healthCheck, fetchShopifyProducts, syncProductToShopify, getOrders } from '@/lib/services/shopify'

/**
 * GET /api/integrations/shopify?key=X&action=health|products|orders
 */
export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const action = new URL(req.url).searchParams.get('action') || 'health'

  switch (action) {
    case 'health': {
      const result = await healthCheck()
      return NextResponse.json(result)
    }
    case 'products': {
      const products = await fetchShopifyProducts()
      return NextResponse.json({ count: products.length, products })
    }
    case 'orders': {
      const orders = await getOrders()
      return NextResponse.json({ count: orders.length, orders })
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}

/**
 * POST /api/integrations/shopify?key=X
 * Sync product to Shopify
 */
export async function POST(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  switch (body.action) {
    case 'sync_product': {
      const result = await syncProductToShopify(body.product)
      return NextResponse.json(result)
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
