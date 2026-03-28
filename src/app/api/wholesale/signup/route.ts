export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  const application = await prisma.wholesaleApplication.findUnique({
    where: { signupToken: token },
    include: { account: true },
  })

  if (!application || application.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
  }

  if (application.account) {
    return NextResponse.json({ error: 'Account already created' }, { status: 409 })
  }

  return NextResponse.json({
    businessName: application.businessName,
    email: application.email,
    contactName: application.contactName,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { token, email, password } = body

  if (!token || !email || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const application = await prisma.wholesaleApplication.findUnique({
    where: { signupToken: token },
    include: { account: true },
  })

  if (!application || application.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
  }

  if (application.account) {
    return NextResponse.json({ error: 'Account already created' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const account = await prisma.wholesaleAccount.create({
    data: {
      email,
      passwordHash,
      businessName: application.businessName,
      applicationId: application.id,
    },
  })

  return NextResponse.json({ success: true, accountId: account.id })
}
