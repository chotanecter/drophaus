export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { createWholesaleDraftOrder } from '@/lib/services/shopify'

/**
 * POST /api/wholesale/checkout
 *
 * Creates a Shopify Draft Order with wholesale pricing.
 * Requires an active wholesale session (dh_session cookie).
 *
 * Body: {
 *   items: [{ productId, variantId, size, color, quantity }]
 *   note?: string
 * }
 *
 * Returns: { invoiceUrl, draftOrderId, orderId }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify wholesale session
    const cookieStore = await cookies()
    const session = cookieStore.get('dh_session')
    if (!session?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let accountData: { accountId: string; businessName: string }
    try {
      accountData = JSON.parse(Buffer.from(session.value, 'base64').toString())
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Verify account is still active
    const account = await prisma.wholesaleAccount.findUnique({
      where: { id: accountData.accountId },
    })

    if (!account || !account.active) {
      return NextResponse.json({ error: 'Account inactive or not found' }, { status: 403 })
    }

    // Parse request body
    const body = await req.json()
    const { items, note } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Fetch products from DB to verify wholesale prices
    const productIds = [...new Set(items.map((i: { productId: string }) => i.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: { category: true },
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    // Build draft order line items with verified wholesale prices
    const draftItems: {
      variantId: string
      quantity: number
      wholesalePrice: number
      title: string
    }[] = []

    const orderItems: {
      productId: string
      size: string
      color: string
      quantity: number
      price: number
    }[] = []

    let orderTotal = 0

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        )
      }

      if (!product.wholesalePrice) {
        return NextResponse.json(
          { error: `No wholesale price set for: ${product.name}` },
          { status: 400 }
        )
      }

      if (!product.shopifyVariantId) {
        return NextResponse.json(
          { error: `Product not synced to Shopify: ${product.name}. Please contact support.` },
          { status: 400 }
        )
      }

      const quantity = Math.max(1, Math.floor(Number(item.quantity)))
      const wholesalePrice = product.wholesalePrice

      // Calculate bulk tier pricing
      let finalPrice = wholesalePrice
      if (quantity >= 144) {
        finalPrice = wholesalePrice * 0.85
      } else if (quantity >= 48) {
        finalPrice = wholesalePrice * 0.90
      } else if (quantity >= 12) {
        finalPrice = wholesalePrice * 0.95
      }
      finalPrice = Math.round(finalPrice * 100) / 100

      const lineTitle = `${product.name} — ${item.size || 'OS'} / ${item.color || 'Default'}`

      draftItems.push({
        variantId: product.shopifyVariantId,
        quantity,
        wholesalePrice: finalPrice,
        title: lineTitle,
      })

      orderItems.push({
        productId: product.id,
        size: item.size || '',
        color: item.color || '',
        quantity,
        price: finalPrice,
      })

      orderTotal += finalPrice * quantity
    }

    // Create Shopify Draft Order with wholesale prices
    const shopifyResult = await createWholesaleDraftOrder({
      items: draftItems,
      customerEmail: account.email,
      businessName: account.businessName,
      note,
    })

    if (!shopifyResult.success || !shopifyResult.invoiceUrl) {
      return NextResponse.json(
        { error: shopifyResult.error || 'Failed to create Shopify draft order' },
        { status: 500 }
      )
    }

    // Create local order record
    const order = await prisma.order.create({
      data: {
        accountId: account.id,
        total: Math.round(orderTotal * 100) / 100,
        status: 'PENDING',
        notes: `Shopify Draft Order: ${shopifyResult.draftOrderId}${note ? `\n${note}` : ''}`,
        items: {
          create: orderItems,
        },
      },
      include: { items: true },
    })

    console.log(`[Wholesale Checkout] Order ${order.id} created for ${account.businessName} — Draft Order ${shopifyResult.draftOrderId}`)

    return NextResponse.json({
      invoiceUrl: shopifyResult.invoiceUrl,
      draftOrderId: shopifyResult.draftOrderId,
      orderId: order.id,
      total: order.total,
    })
  } catch (err) {
    console.error('[Wholesale Checkout] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
