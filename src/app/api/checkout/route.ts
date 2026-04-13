import { NextResponse } from 'next/server'
import { createCheckout } from '@/lib/services/shopify'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { variantId, quantity = 1 } = body

    if (!variantId) {
      return NextResponse.json(
        { error: 'Missing variantId' },
        { status: 400 }
      )
    }

    const result = await createCheckout([
      { variantId: String(variantId), quantity: Number(quantity) },
    ])

    if (!result.checkoutUrl) {
      return NextResponse.json(
        {
          error: 'Failed to create checkout. Check Shopify credentials.',
          detail: result.error,
          userErrors: result.userErrors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ checkoutUrl: result.checkoutUrl })
  } catch (err) {
    console.error('[Checkout API]', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
