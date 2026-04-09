import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Intercept Shopify OAuth callbacks at the root URL
  // Shopify sends: {App URL}?code=X&shop=Y&hmac=Z
  if (
    request.nextUrl.pathname === '/' &&
    request.nextUrl.searchParams.has('code') &&
    request.nextUrl.searchParams.has('shop')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/api/auth/shopify'
    return NextResponse.rewrite(url)
  }

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
  matcher: ['/', '/admin/:path*'],
}
