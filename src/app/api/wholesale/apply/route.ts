export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    const required = ['businessName', 'contactName', 'email', 'phone', 'einNumber', 'resaleNumber']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Check for duplicate email
    const existing = await prisma.wholesaleApplication.findFirst({
      where: { email: body.email, status: { in: ['PENDING', 'APPROVED'] } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'An application with this email already exists' },
        { status: 409 }
      )
    }

    const application = await prisma.wholesaleApplication.create({
      data: {
        businessName: body.businessName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        einNumber: body.einNumber,
        resaleNumber: body.resaleNumber,
        address: body.address || null,
        businessType: body.businessType || 'OTHER',
        heardAbout: body.heardAbout || null,
        notes: body.notes || null,
      },
    })

    return NextResponse.json({ success: true, id: application.id })
  } catch (error) {
    console.error('Wholesale application error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
