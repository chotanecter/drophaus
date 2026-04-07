export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = req.cookies.get('dh_session')

  if (!session?.value) {
    return NextResponse.json({ loggedIn: false }, { status: 401 })
  }

  try {
    const data = JSON.parse(Buffer.from(session.value, 'base64').toString())
    return NextResponse.json({
      loggedIn: true,
      accountId: data.accountId,
      businessName: data.businessName,
    })
  } catch {
    return NextResponse.json({ loggedIn: false }, { status: 401 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('dh_session')
  return response
}
