export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { healthCheck, fetchShopifyProducts, syncProductToShopify, getOrders } from '@/lib/services/shopify'
import prisma from '@/lib/prisma'
// ---------- Storefront API Helper ----------

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || ''
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || ''

interface StorefrontProduct {
  id: string       // gid://shopify/Product/123
  title: string
  handle: string
  variants: {
    edges: {
      node: {
        id: string   // gid://shopify/ProductVariant/456
        title: string
        sku: string | null
      }
    }[]
  }
}

async function fetchAllStorefrontProducts(): Promise<StorefrontProduct[]> {
  if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) return []

  const allProducts: StorefrontProduct[] = []
  let hasNextPage = true
  let cursor: string | null = null

  while (hasNextPage) {
    const afterClause: string = cursor ? `, after: "${cursor}"` : ''
    const query = `{
      products(first: 50${afterClause}) {
        pageInfo { hasNextPage }
        edges {
          cursor
          node {
            id
            title
            handle
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  sku
                }
              }
            }
          }
        }
      }
    }`

    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/2024-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query }),
      }
    )

    if (!res.ok) break
    const json = await res.json()
    const edges = json.data?.products?.edges || []
    for (const edge of edges) {
      allProducts.push(edge.node)
      cursor = edge.cursor
    }
    hasNextPage = json.data?.products?.pageInfo?.hasNextPage || false
  }

  return allProducts
}
function extractNumericId(gid: string): string {
  // "gid://shopify/Product/123" -> "123"
  return gid.split('/').pop() || ''
}

/**
 * GET /api/integrations/shopify?key=X&action=health|products|orders|storefront-products
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
    case 'storefront-products': {
      const products = await fetchAllStorefrontProducts()
      return NextResponse.json({
        count: products.length,
        products: products.map(p => ({
          id: extractNumericId(p.id),
          gid: p.id,
          title: p.title,
          handle: p.handle,
          variants: p.variants.edges.map(e => ({
            id: extractNumericId(e.node.id),
            gid: e.node.id,
            title: e.node.title,
            sku: e.node.sku,
          })),
        })),
      })
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
 * Sync product to Shopify or sync Shopify IDs to local DB
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

    case 'sync_from_shopify': {
      /**
       * Pull all products from Shopify via Storefront API,
       * match to local products by name (case-insensitive),
       * and save shopifyProductId + shopifyVariantId (first variant).
       *
       * Matching strategy:
       * 1. Exact name match (case-insensitive)
       * 2. Handle match to slug
       * 3. Partial name match (Shopify title contains local name or vice versa)
       */
      const shopifyProducts = await fetchAllStorefrontProducts()
      if (shopifyProducts.length === 0) {
        return NextResponse.json({ error: 'No Shopify products found. Check SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN.' }, { status: 500 })
      }

      const localProducts = await prisma.product.findMany({
        select: { id: true, name: true, slug: true, shopifyProductId: true, shopifyVariantId: true },
      })

      let matched = 0
      let skipped = 0
      let alreadySet = 0
      const matchDetails: { local: string; shopify: string; productId: string; variantId: string }[] = []
      const unmatched: { shopifyTitle: string; shopifyId: string }[] = []

      for (const sp of shopifyProducts) {
        const shopifyProductId = extractNumericId(sp.id)
        const firstVariantId = sp.variants.edges[0]
          ? extractNumericId(sp.variants.edges[0].node.id)
          : null

        if (!firstVariantId) continue

        // Try to find a matching local product
        const normalizedShopifyTitle = sp.title.toLowerCase().trim()
        const normalizedHandle = sp.handle.toLowerCase().trim()

        let localMatch = localProducts.find(lp =>
          lp.name.toLowerCase().trim() === normalizedShopifyTitle
        )

        if (!localMatch) {
          localMatch = localProducts.find(lp =>
            lp.slug.toLowerCase().trim() === normalizedHandle
          )
        }

        if (!localMatch) {
          // Partial match: check if local name is contained in Shopify title or vice versa
          localMatch = localProducts.find(lp => {
            const localName = lp.name.toLowerCase().trim()
            return (
              normalizedShopifyTitle.includes(localName) ||
              localName.includes(normalizedShopifyTitle)
            )
          })
        }

        if (localMatch) {
          if (localMatch.shopifyVariantId) {
            alreadySet++
            continue
          }

          await prisma.product.update({
            where: { id: localMatch.id },
            data: {
              shopifyProductId: shopifyProductId,
              shopifyVariantId: firstVariantId,
            },
          })

          matchDetails.push({
            local: localMatch.name,
            shopify: sp.title,
            productId: shopifyProductId,
            variantId: firstVariantId,
          })
          matched++
        } else {
          unmatched.push({ shopifyTitle: sp.title, shopifyId: shopifyProductId })
          skipped++
        }
      }

      return NextResponse.json({
        success: true,
        shopifyTotal: shopifyProducts.length,
        localTotal: localProducts.length,
        matched,
        alreadySet,
        skipped,
        matchDetails,
        unmatched,
      })
    }

    case 'set_shopify_ids': {
      /**
       * Manually set shopifyProductId and shopifyVariantId on a local product.
       * body.productId: local product ID
       * body.shopifyProductId: Shopify product numeric ID
       * body.shopifyVariantId: Shopify variant numeric ID
       */
      if (!body.productId || !body.shopifyVariantId) {
        return NextResponse.json({ error: 'productId and shopifyVariantId required' }, { status: 400 })
      }
      const updated = await prisma.product.update({
        where: { id: body.productId },
        data: {
          shopifyProductId: body.shopifyProductId || null,
          shopifyVariantId: body.shopifyVariantId,
        },
      })
      return NextResponse.json({ success: true, product: { id: updated.id, name: updated.name, shopifyProductId: updated.shopifyProductId, shopifyVariantId: updated.shopifyVariantId } })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
