export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { createCustomer } from '@/lib/services/apparelmagic'

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = new URL(req.url).searchParams.get('status')
  const search = new URL(req.url).searchParams.get('search')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { businessName: { contains: search, mode: 'insensitive' } },
      { contactName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  const applications = await prisma.wholesaleApplication.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { account: true },
  })

  return NextResponse.json(applications)
}

export async function PUT(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, action, reviewNotes } = body

  if (!id || !action) {
    return NextResponse.json({ error: 'id and action required' }, { status: 400 })
  }

  if (action === 'approve') {
    const signupToken = uuidv4()
    const application = await prisma.wholesaleApplication.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewNotes,
        signupToken,
        reviewedAt: new Date(),
      },
    })

    // Push approved customer to ApparelMagic CRM (non-blocking)
    try {
      const amResult = await createCustomer({
        businessName: application.businessName,
        contactName: application.contactName,
        email: application.email,
        phone: application.phone || undefined,
        einNumber: application.einNumber || undefined,
      })

      if (amResult.customerId) {
        // Store the APM customer ID on the application for later linking
        await prisma.wholesaleApplication.update({
          where: { id },
          data: { reviewNotes: `${reviewNotes || ''}\n[APM Customer ID: ${amResult.customerId}]`.trim() },
        })
        console.log(`[ApparelMagic] Created customer ${amResult.customerId} for ${application.businessName}`)
      } else {
        console.warn(`[ApparelMagic] Failed to create customer for ${application.businessName}`)
      }
    } catch (err) {
      console.error('[ApparelMagic] Customer sync error (non-blocking):', err)
    }

    return NextResponse.json({
      ...application,
      signupLink: `/wholesale/signup?token=${signupToken}`,
    })
  }

  if (action === 'reject') {
    const application = await prisma.wholesaleApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewNotes,
        reviewedAt: new Date(),
      },
    })
    return NextResponse.json(application)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
