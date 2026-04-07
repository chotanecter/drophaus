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

  // Create a simple session token (base64 encoded account info)
  const sessionData = Buffer.from(JSON.stringify({
    accountId: account.id,
    businessName: account.businessName,
    email: account.email,
  })).toString('base64')

  const response = NextResponse.json({
    success: true,
    accountId: account.id,
    businessName: account.businessName,
  })

  // Set HTTP-only session cookie (7 day expiry)
  response.cookies.set('dh_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return response
}
