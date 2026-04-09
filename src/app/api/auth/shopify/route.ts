/**
 * Shopify OAuth Callback Handler
 *
 * Handles the OAuth callback from Shopify after app installation.
 * Exchanges the authorization code for an access token and displays it.
 *
 * Flow:
 * 1. Shopify redirects here with ?code=X&shop=Y&hmac=Z
 * 2. We exchange the code for an offline access token
 * 3. Display the token (for manual copy to env vars)
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const shop = url.searchParams.get('shop')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _hmac = url.searchParams.get('hmac')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _host = url.searchParams.get('host')

  // If no code, this is the initial app load — redirect to OAuth
  if (!code || !shop) {
        // Log all params for debugging
      const allParams: Record<string, string> = {}
            url.searchParams.forEach((v, k) => { allParams[k] = v })

      return NextResponse.json({
              message: 'DropHaus Inventory Sync - OAuth handler',
              note: 'No authorization code received. This endpoint handles the OAuth callback.',
              params: allParams,
      })
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID || 'a308f32920d4c7ad4d4faf496dcd44dd'
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET || ''

  if (!clientSecret) {
        return NextResponse.json({
                error: 'SHOPIFY_CLIENT_SECRET not configured',
                note: 'Add SHOPIFY_CLIENT_SECRET to your environment variables',
                code,
                shop,
        }, { status: 500 })
  }

  try {
        // Exchange the authorization code for an access token
      const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                        client_id: clientId,
                        client_secret: clientSecret,
                        code,
              }),
      })

      if (!tokenRes.ok) {
              const errText = await tokenRes.text()
              return NextResponse.json({
                        error: 'Failed to exchange code for token',
                        status: tokenRes.status,
                        response: errText,
                        code,
                        shop,
              }, { status: 500 })
      }

      const tokenData = await tokenRes.json()

      // Return the access token
      // In production, you'd store this securely, but for initial setup we display it
      return NextResponse.json({
              success: true,
              message: 'Shopify app installed successfully! Copy the access_token below and add it as SHOPIFY_ADMIN_TOKEN in your Vercel environment variables.',
              shop,
              access_token: tokenData.access_token,
              scope: tokenData.scope,
      })
  } catch (err) {
        return NextResponse.json({
                error: 'OAuth token exchange failed',
                message: String(err),
                code,
                shop,
        }, { status: 500 })
  }
}
