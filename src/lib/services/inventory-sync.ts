/**
 * Inventory Sync Service
 *
 * Orchestrates real-time inventory sync from ApparelMagic → Shopify.
 *
 * Flow:
 * 1. Pull all inventory from ApparelMagic (style_id → available qty)
 * 2. Aggregate by style_id (sum across colors/sizes/warehouses)
 * 3. Map style_id → local Product via apparelMagicId
 * 4. Filter to products that also have shopifyVariantId
 * 5. Push available quantities to Shopify via Admin API
 *
 * Trigger options:
 * - On-demand via API endpoint (POST /api/integrations/shopify?action=sync_inventory)
 * - Automated via Vercel cron (/api/cron/inventory-sync)
 */

import { fetchInventory, type AMInventory } from './apparelmagic'
import { syncInventoryToShopify } from './shopify'
import prisma from '@/lib/prisma'

export interface InventorySyncResult {
  success: boolean
  timestamp: string
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

/**
 * Run a full inventory sync from ApparelMagic to Shopify.
 *
 * This is the main entry point for the sync pipeline.
 */
export async function runInventorySync(): Promise<InventorySyncResult> {
  const errors: string[] = []
  const timestamp = new Date().toISOString()

  // ---- Step 1: Pull inventory from ApparelMagic ----
  let amInventory: AMInventory[]
  try {
    amInventory = await fetchInventory()
  } catch (err) {
    return {
      success: false,
      timestamp,
      source: { amInventoryRecords: 0, uniqueStyles: 0 },
      mapping: { localProductsWithAM: 0, localProductsWithBothIds: 0 },
      sync: { synced: 0, failed: 0, skipped: 0, details: [] },
      errors: [`Failed to fetch ApparelMagic inventory: ${err}`],
    }
  }

  if (amInventory.length === 0) {
    return {
      success: false,
      timestamp,
      source: { amInventoryRecords: 0, uniqueStyles: 0 },
      mapping: { localProductsWithAM: 0, localProductsWithBothIds: 0 },
      sync: { synced: 0, failed: 0, skipped: 0, details: [] },
      errors: ['No inventory records returned from ApparelMagic'],
    }
  }

  // ---- Step 2: Aggregate inventory by style_id ----
  // Sum "available" across all colors/sizes/warehouses per style
  const styleAvailability = new Map<string, number>()
  for (const inv of amInventory) {
    const current = styleAvailability.get(inv.style_id) || 0
    styleAvailability.set(inv.style_id, current + (inv.available || 0))
  }

  // ---- Step 3: Map to local products ----
  const localProducts = await prisma.product.findMany({
    where: {
      apparelMagicId: { not: null },
      shopifyVariantId: { not: null },
    },
    select: {
      id: true,
      name: true,
      apparelMagicId: true,
      shopifyVariantId: true,
    },
  })

  const allAmProducts = await prisma.product.findMany({
    where: { apparelMagicId: { not: null } },
    select: { id: true },
  })

  // ---- Step 4: Build sync payload ----
  const syncPayload = localProducts
    .filter(p => p.apparelMagicId && p.shopifyVariantId)
    .map(p => {
      const amAvailable = styleAvailability.get(p.apparelMagicId!) ?? 0
      return {
        localId: p.id,
        name: p.name,
        shopifyVariantId: p.shopifyVariantId!,
        amAvailable,
      }
    })

  if (syncPayload.length === 0) {
    return {
      success: false,
      timestamp,
      source: {
        amInventoryRecords: amInventory.length,
        uniqueStyles: styleAvailability.size,
      },
      mapping: {
        localProductsWithAM: allAmProducts.length,
        localProductsWithBothIds: 0,
      },
      sync: { synced: 0, failed: 0, skipped: 0, details: [] },
      errors: ['No products found with both apparelMagicId and shopifyVariantId'],
    }
  }

  // ---- Step 5: Push to Shopify ----
  const syncResult = await syncInventoryToShopify(syncPayload)

  // Check for products that had no AM inventory data
  const missingInventory = syncPayload.filter(p => !styleAvailability.has(p.shopifyVariantId))
  if (missingInventory.length > 0) {
    errors.push(`${missingInventory.length} products had no inventory data in ApparelMagic`)
  }

  return {
    success: syncResult.success && errors.length === 0,
    timestamp,
    source: {
      amInventoryRecords: amInventory.length,
      uniqueStyles: styleAvailability.size,
    },
    mapping: {
      localProductsWithAM: allAmProducts.length,
      localProductsWithBothIds: localProducts.length,
    },
    sync: {
      synced: syncResult.synced,
      failed: syncResult.failed,
      skipped: syncResult.skipped,
      details: syncResult.details,
    },
    errors,
  }
}
