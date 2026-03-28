export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body.name || !body.email || !body.message) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 })
  }

  const submission = await prisma.contactSubmission.create({
    data: {
      name: body.name,
      email: body.email,
      subject: body.subject || null,
      message: body.message,
    },
  })

  return NextResponse.json({ success: true, id: submission.id })
}
