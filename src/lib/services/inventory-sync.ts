/**
 * Inventory & Product Sync Service
 *
 * Orchestrates full product + inventory pipeline from ApparelMagic to Shopify.
 *
 * Flow:
 * 1. Pull all products from ApparelMagic and upsert into local DB
 * 2. For products missing shopifyProductId, create them on Shopify
 * 3. Pull all inventory from ApparelMagic (style_id to available qty)
 * 4. Aggregate by style_id (sum across colors/sizes/warehouses)
 * 5. Map style_id to local Product via apparelMagicId
 * 6. Filter to products that also have shopifyVariantId
 * 7. Push available quantities to Shopify via Admin API
 *
 * Trigger options:
 * - On-demand via API endpoint (POST /api/integrations/shopify?action=sync_inventory)
 * - Automated via Vercel cron (/api/cron/inventory-sync)
 */

import { fetchInventory, fetchProducts, type AMInventory, type AMProduct } from './apparelmagic'
import { syncInventoryToShopify, syncProductToShopify } from './shopify'
import prisma from '@/lib/prisma'

export interface InventorySyncResult {
  success: boolean
  timestamp: string
  productSync: {
    amProductsFetched: number
    imported: number
    updated: number
    createdOnShopify: number
    shopifyErrors: number
  }
  source: {
    amInventoryRecords: number
    uniqueStyles: number
  }
  mapping: {
    localProductsWithAM: number
    localProductsWithBothIds: number
  }
  sync: {
    synced: number
    failed: number
    skipped: number
    details: {
      name: string
      shopifyVariantId: string
      available: number
      status: string
      error?: string
    }[]
  }
  errors: string[]
}

async function syncProductsFromAM(): Promise<{
  amProductsFetched: number
  imported: number
  updated: number
  createdOnShopify: number
  shopifyErrors: number
  errors: string[]
}> {
  const errors: string[] = []
  let imported = 0
  let updated = 0
  let createdOnShopify = 0
  let shopifyErrors = 0

  let amProducts: AMProduct[]
  try {
    amProducts = await fetchProducts()
  } catch (err) {
    return { amProductsFetched: 0, imported: 0, updated: 0, createdOnShopify: 0, shopifyErrors: 0, errors: ['Failed to fetch AM products: ' + err] }
  }

  console.log('[ProductSync] Fetched ' + amProducts.length + ' products from ApparelMagic')

  for (const amProduct of amProducts) {
    const amId = amProduct.product_id || amProduct.id || ''
    try {
      const existing = await prisma.product.findFirst({ where: { apparelMagicId: amId } })

      const catSlug = (amProduct.category || 'uncategorized').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const cat = await prisma.category.upsert({
        where: { slug: catSlug },
        create: { name: amProduct.category || 'Uncategorized', slug: catSlug },
        update: {},
      })

      const productData = {
        name: amProduct.b2b_web_title || amProduct.description || amProduct.style_number || 'APM-' + amId,
        slug: (amProduct.style_number || amId).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: amProduct.b2b_web_description || amProduct.description || '',
        price: parseFloat(amProduct.retail_price || amProduct.price || '0'),
        wholesalePrice: parseFloat(amProduct.cost || '0'),
        categoryId: cat.id,
        sizes: [] as string[],
        colors: [] as string[],
        colorHexCodes: [] as string[],
        images: (amProduct.images || []).map((i: { img: string }) => i.img),
        apparelMagicId: amId,
      }

      let localProduct
      if (existing) {
        localProduct = await prisma.product.update({ where: { id: existing.id }, data: productData })
        updated++
      } else {
        localProduct = await prisma.product.create({ data: productData })
        imported++
      }

      if (!localProduct.shopifyProductId) {
        try {
          const shopifyResult = await syncProductToShopify({
            name: localProduct.name,
            slug: localProduct.slug,
            description: localProduct.description || '',
            price: localProduct.price,
            sizes: localProduct.sizes || [],
            colors: localProduct.colors || [],
            fabricWeight: localProduct.fabricWeight || undefined,
            fabricMaterial: localProduct.fabricMaterial || undefined,
          })

          if (shopifyResult.shopifyProductId) {
            await prisma.product.update({
              where: { id: localProduct.id },
              data: { shopifyProductId: shopifyResult.shopifyProductId, shopifyVariantId: shopifyResult.shopifyVariantId },
            })
            createdOnShopify++
            console.log('[ProductSync] Created on Shopify: ' + localProduct.name)
          } else {
            shopifyErrors++
            errors.push('Failed to create ' + localProduct.name + ' on Shopify')
          }
          await new Promise(resolve => setTimeout(resolve, 550))
        } catch (err) {
          shopifyErrors++
          errors.push('Shopify error for ' + localProduct.name + ': ' + err)
        }
      }
    } catch (err) {
      errors.push('Failed to import AM product ' + amId + ': ' + err)
    }
  }

  console.log('[ProductSync] Done: ' + imported + ' new, ' + updated + ' updated, ' + createdOnShopify + ' on Shopify')
  return { amProductsFetched: amProducts.length, imported, updated, createdOnShopify, shopifyErrors, errors }
}

export async function runInventorySync(): Promise<InventorySyncResult> {
  const errors: string[] = []
  const timestamp = new Date().toISOString()

  const productSyncResult = await syncProductsFromAM()
  errors.push(...productSyncResult.errors)

  let amInventory: AMInventory[]
  try {
    amInventory = await fetchInventory()
  } catch (err) {
    return {
      success: false, timestamp, productSync: productSyncResult,
      source: { amInventoryRecords: 0, uniqueStyles: 0 },
      mapping: { localProductsWithAM: 0, localProductsWithBothIds: 0 },
      sync: { synced: 0, failed: 0, skipped: 0, details: [] },
      errors: [...errors, 'Failed to fetch AM inventory: ' + err],
    }
  }

  if (amInventory.length === 0) {
    return {
      success: false, timestamp, productSync: productSyncResult,
      source: { amInventoryRecords: 0, uniqueStyles: 0 },
      mapping: { localProductsWithAM: 0, localProductsWithBothIds: 0 },
      sync: { synced: 0, failed: 0, skipped: 0, details: [] },
      errors: [...errors, 'No inventory records from ApparelMagic'],
    }
  }

  const styleAvailability = new Map<string, number>()
  for (const inv of amInventory) {
    const current = styleAvailability.get(inv.style_id) || 0
    styleAvailability.set(inv.style_id, current + (inv.available || 0))
  }

  const localProducts = await prisma.product.findMany({
    where: { apparelMagicId: { not: null }, shopifyVariantId: { not: null } },
    select: { id: true, name: true, apparelMagicId: true, shopifyVariantId: true },
  })

  const allAmProducts = await prisma.product.findMany({
    where: { apparelMagicId: { not: null } },
    select: { id: true },
  })

  const syncPayload = localProducts
    .filter(p => p.apparelMagicId && p.shopifyVariantId)
    .map(p => ({
      localId: p.id, name: p.name,
      shopifyVariantId: p.shopifyVariantId!,
      amAvailable: styleAvailability.get(p.apparelMagicId!) ?? 0,
    }))

  if (syncPayload.length === 0) {
    return {
      success: productSyncResult.shopifyErrors === 0, timestamp, productSync: productSyncResult,
      source: { amInventoryRecords: amInventory.length, uniqueStyles: styleAvailability.size },
      mapping: { localProductsWithAM: allAmProducts.length, localProductsWithBothIds: 0 },
      sync: { synced: 0, failed: 0, skipped: 0, details: [] },
      errors: [...errors, 'No products with both apparelMagicId and shopifyVariantId'],
    }
  }

  const syncResult = await syncInventoryToShopify(syncPayload)

  return {
    success: syncResult.success && productSyncResult.shopifyErrors === 0 && errors.length === 0,
    timestamp, productSync: productSyncResult,
    source: { amInventoryRecords: amInventory.length, uniqueStyles: styleAvailability.size },
    mapping: { localProductsWithAM: allAmProducts.length, localProductsWithBothIds: localProducts.length },
    sync: { synced: syncResult.synced, failed: syncResult.failed, skipped: syncResult.skipped, details: syncResult.details },
    errors,
  }
}
