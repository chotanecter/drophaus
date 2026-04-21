export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  healthCheck,
  fetchProducts,
  fetchInventory,
  createCustomer,
  syncInventoryToLocal,
  parseAMTags,
  type AMProduct,
} from '@/lib/services/apparelmagic'
import { matchProductToCollab, COLLAB_BRANDS } from '@/lib/collab-mapping'

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
      let collabAssigned = 0

      // Auto-create collab records for any configured brands that don't exist yet
      for (const brand of COLLAB_BRANDS) {
        const existing = await prisma.collab.findUnique({ where: { slug: brand.slug } })
        if (!existing) {
          await prisma.collab.create({
            data: {
              brandName: brand.brandName,
              slug: brand.slug,
              description: brand.description || null,
              logo: brand.logo || null,
              coverImage: brand.coverImage || null,
              featured: true,
              active: true,
            },
          })
          console.log(`[ApparelMagic] Auto-created collab: ${brand.brandName}`)
        }
      }

      // Build a slug → collabId lookup
      const allCollabs = await prisma.collab.findMany()
      const collabSlugMap = new Map(allCollabs.map(c => [c.slug, c.id]))

      for (const amProduct of amProducts) {
        const amId = amProduct.product_id || amProduct.id || ''
        try {
          const existing = await prisma.product.findFirst({
            where: { apparelMagicId: amId },
          })

          // Get or create a default category
          const catSlug = (amProduct.category || 'uncategorized').toLowerCase().replace(/[^a-z0-9]+/g, '-')
          const cat = await prisma.category.upsert({
            where: { slug: catSlug },
            create: { name: amProduct.category || 'Uncategorized', slug: catSlug },
            update: {},
          })
          const categoryId = cat.id

          // Check if this product belongs to a collab brand
          const collabSlug = matchProductToCollab(amProduct)
          const collabId = collabSlug ? collabSlugMap.get(collabSlug) || null : null
          if (collabId) collabAssigned++

          const productData = {
            name: amProduct.b2b_web_title || amProduct.description || amProduct.style_number || `APM-${amId}`,
            slug: (amProduct.style_number || amId).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: amProduct.b2b_web_description || amProduct.description || '',
            price: parseFloat(amProduct.retail_price || amProduct.price || '0'),
            wholesalePrice: parseFloat(amProduct.cost || '0'),
            categoryId,
            sizes: [],
            colors: [],
            colorHexCodes: [],
            images: (amProduct.images || []).map(i => i.img),
            tags: parseAMTags(amProduct.tags),
            apparelMagicId: amId,
            collabId,
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
          console.error(`[ApparelMagic] Failed to import product ${amId}:`, err)
          errors++
        }
      }

      return NextResponse.json({
        success: true,
        total: amProducts.length,
        imported,
        updated,
        errors,
        collabAssigned,
      })
    }

    case 'set_featured': {
      // Set featured flag on products by ID
      // body.ids: string[], body.featured: boolean
      const ids: string[] = body.ids || []
      const featured: boolean = body.featured ?? true
      const result = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { featured },
      })
      return NextResponse.json({ success: true, updated: result.count })
    }

    case 'cleanup_mock_data': {
      // Remove seed/mock products that don't have an ApparelMagic ID
      const deletedProducts = await prisma.product.deleteMany({
        where: { apparelMagicId: null },
      })

      // Remove seed/mock collabs (Midnight Studio, Raw Athletics)
      const deletedCollabs = await prisma.collab.deleteMany({
        where: {
          slug: { in: ['midnight-studio', 'raw-athletics'] },
        },
      })

      // Clean up orphaned categories (categories with no products)
      const orphanedCategories = await prisma.category.findMany({
        where: {
          products: { none: {} },
        },
      })
      const deletedCategories = await prisma.category.deleteMany({
        where: {
          id: { in: orphanedCategories.map(c => c.id) },
        },
      })

      return NextResponse.json({
        success: true,
        deletedProducts: deletedProducts.count,
        deletedCollabs: deletedCollabs.count,
        deletedCategories: deletedCategories.count,
      })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
