import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Store as a contact submission with newsletter type
    await prisma.contactSubmission.create({
      data: {
        name: 'Newsletter Subscriber',
        email,
        subject: 'Newsletter Signup',
        message: `Newsletter subscription from ${email}`,
      },
    })

    return NextResponse.json({ ok: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // Handle duplicate gracefully
    if (error?.code === 'P2002') {
      return NextResponse.json({ ok: true }) // Already subscribed, don't error
    }
    console.error('Newsletter signup error:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
