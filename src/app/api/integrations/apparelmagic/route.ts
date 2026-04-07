export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { healthCheck, fetchProducts, fetchInventory, createCustomer } from '@/lib/services/apparelmagic'

/**
 * GET /api/integrations/apparelmagic?key=X&action=health|products|inventory
 * Admin-only endpoint for APM integration status and data sync
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
      const products = await fetchProducts()
      return NextResponse.json({ count: products.length, products })
    }
    case 'inventory': {
      const styleId = new URL(req.url).searchParams.get('style_id') || undefined
      const inventory = await fetchInventory(styleId)
      return NextResponse.json({ count: inventory.length, inventory })
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}

/**
 * POST /api/integrations/apparelmagic?key=X
 * Push data to ApparelMagic (create customers, sync products, etc.)
 */
export async function POST(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const action = body.action

  switch (action) {
    case 'create_customer': {
      const result = await createCustomer(body.customer)
      return NextResponse.json(result)
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
