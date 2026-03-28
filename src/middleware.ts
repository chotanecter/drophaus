import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Block admin access without key
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const key = request.nextUrl.searchParams.get('key')
    if (key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
