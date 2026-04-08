export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  healthCheck,
  fetchProducts,
  fetchInventory,
  createCustomer,
  syncInventoryToLocal,
  type AMProduct,
} from '@/lib/services/apparelmagic'

/**
 * GET /api/integrations/apparelmagic?key=X&action=health|products|inventory|sync-inventory
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
    case 'sync-inventory': {
      const result = await syncInventoryToLocal(prisma)
      return NextResponse.json(result)
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}

/**
 * POST /api/integrations/apparelmagic?key=X
 * Push data to ApparelMagic (create customers, sync products, import catalog)
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

    case 'import_products': {
      // Pull products from APM and upsert into local DB
      const amProducts: AMProduct[] = await fetchProducts()
      let imported = 0
      let updated = 0
      let errors = 0

      for (const amProduct of amProducts) {
        try {
          const existing = await prisma.product.findFirst({
            where: { apparelMagicId: amProduct.id },
          })

          // Get or create a default category
          let categoryId: string
          const catSlug = (amProduct.category || 'uncategorized').toLowerCase().replace(/[^a-z0-9]+/g, '-')
          const cat = await prisma.category.upsert({
            where: { slug: catSlug },
            create: { name: amProduct.category || 'Uncategorized', slug: catSlug },
            update: {},
          })
          categoryId = cat.id

          const productData = {
            name: amProduct.description || amProduct.style_number || `APM-${amProduct.id}`,
            slug: (amProduct.style_number || amProduct.id).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: amProduct.description || '',
            price: amProduct.retail_price || 0,
            wholesalePrice: amProduct.wholesale_price || 0,
            categoryId,
            sizes: (amProduct.sizes || []).map(s => s.name),
            colors: (amProduct.colors || []).map(c => c.name),
            colorHexCodes: (amProduct.colors || []).map(c => c.code || '#000000'),
            images: (amProduct.images || []).sort((a, b) => a.sort_order - b.sort_order).map(i => i.url),
            apparelMagicId: amProduct.id,
          }

          if (existing) {
            await prisma.product.update({
              where: { id: existing.id },
              data: productData,
            })
            updated++
          } else {
            await prisma.product.create({ data: productData })
            imported++
          }
        } catch (err) {
          console.error(`[ApparelMagic] Failed to import product ${amProduct.id}:`, err)
          errors++
        }
      }

      return NextResponse.json({
        success: true,
        total: amProducts.length,
        imported,
        updated,
        errors,
      })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
