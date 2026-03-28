export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const account = await prisma.wholesaleAccount.findUnique({
    where: { email },
  })

  if (!account || !account.active) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, account.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Simple token-based auth (in production, use JWT or session)
  // For now, return account ID as a simple auth token
  return NextResponse.json({
    success: true,
    accountId: account.id,
    businessName: account.businessName,
  })
}
