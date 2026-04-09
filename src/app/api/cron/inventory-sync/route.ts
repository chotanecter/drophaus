/**
 * Vercel Cron: Inventory Sync
 *
 * Runs on a schedule to sync inventory from ApparelMagic → Shopify.
 * Configured in vercel.json with cron schedule.
 *
 * Security: Vercel cron jobs include an Authorization header with CRON_SECRET.
 * We also accept ADMIN_KEY for manual triggers.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60s for full inventory sync

import { NextRequest, NextResponse } from 'next/server'
import { runInventorySync } from '@/lib/services/inventory-sync'

export async function GET(req: NextRequest) {
  // Verify authorization: Vercel cron secret OR admin key
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const adminKey = new URL(req.url).searchParams.get('key')

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isAdminCall = adminKey === process.env.ADMIN_KEY

  if (!isVercelCron && !isAdminCall) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log(`[Cron] Inventory sync triggered (source: ${isVercelCron ? 'vercel-cron' : 'admin-key'})`)

  try {
    const result = await runInventorySync()

    console.log(`[Cron] Inventory sync complete: ${result.sync.synced} synced, ${result.sync.failed} failed`)

    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (err) {
    console.error('[Cron] Inventory sync error:', err)
    return NextResponse.json(
      { error: 'Inventory sync failed', message: String(err) },
      { status: 500 }
    )
  }
}
