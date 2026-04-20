# DropHaus — Current State (April 15, 2026)

## Live Site
- **URL:** https://drophaus-beige.vercel.app/
- **Repo:** github.com/chotanecter/drophaus (branch: main)
- **Hosting:** Vercel (Pro plan)
- **DB:** Neon PostgreSQL via Prisma 7

## What's Working

### Product Pipeline
- ApparelMagic → Local DB → Shopify sync (cron every 15 min)
- 84 total products in local DB (from ApparelMagic)
- 74 DropHaus products on /products page
- 10 Psycho Realm products on /collabs page

### Collaboration System (NEW)
- `src/lib/collab-mapping.ts` — config-based brand mapping
- Auto-assigns products to collabs during AM import based on style_number prefix (PR*) and description keywords (PSYCHO)
- Psycho Realm collab created in DB with 10 products assigned
- Collabs page redesigned: product grid layout with brand logo filter tabs
- Main products page filters OUT collab products (collabId: null)
- **To add future brands:** add entry to COLLAB_BRANDS array in collab-mapping.ts

### CC Payments / Checkout
- Shopify Storefront API connected (store: "Drop Haus LA" / drop-haus-la.myshopify.com)
- Checkout creates Shopify cart → redirects to hosted checkout for CC payment
- Fixed 18 stale variant IDs — matched local products to correct Storefront API variant IDs
- Improved error logging in checkout route (now shows userErrors from Shopify)

### Integrations
- **ApparelMagic:** Connected (drophausla.app.apparelmagic.com), token configured
- **Shopify Admin API:** Connected, token configured
- **Shopify Storefront API:** Connected, token configured
- Admin key: `drophaus-admin-2026` (query param `?key=`)

## Known Issues / TODO

### HIGH PRIORITY
- **57 of 84 products NOT published on Shopify Storefront channel** — "Add to Cart" will fail for these. Need to publish them in Shopify Admin → Products → make available on Online Store sales channel.
- **Psycho Realm products with $0.00 prices:** PSYCHO REALM PATCH, PSYCHO REALM DOG TAG, PSYCHO REALM LANYARD, LOS PSYCHOS WORK SHIRT, LOS PSYCHOS TANK — need prices set in ApparelMagic

### MEDIUM PRIORITY
- No Psycho Realm logo or cover image set yet (brand logo/coverImage are null in DB)
- Collab detail page (/collabs/psycho-realm) still has old hero design — works but doesn't match new grid style
- Admin dashboard has no UI to manually assign products to collabs (only auto-assign during import)

### LOW PRIORITY
- Products without images show gradient placeholder
- Some products have empty sizes/colors arrays

## Key Files Modified (This Session)
1. `src/lib/collab-mapping.ts` — NEW: collab brand mapping config
2. `src/app/api/integrations/apparelmagic/route.ts` — imports collab-mapping, auto-assigns collabId during import
3. `src/app/api/products/route.ts` — filters where collabId: null
4. `src/app/api/collabs/route.ts` — returns more product fields (fabricWeight, category)
5. `src/app/api/collabs/[slug]/route.ts` — same field updates
6. `src/app/collabs/page.tsx` — REWRITTEN: product grid with brand logo filter tabs
7. `src/lib/services/shopify.ts` — improved createCheckout error logging
8. `src/app/api/checkout/route.ts` — passes through detailed Shopify errors

## Env Vars on Vercel
- SHOPIFY_STORE_DOMAIN (set)
- SHOPIFY_STOREFRONT_TOKEN (set)
- SHOPIFY_ADMIN_TOKEN (set)
- ADMIN_KEY = drophaus-admin-2026
- ApparelMagic token (set)
- DATABASE_URL (Neon PostgreSQL)

## GitHub Push Method
- Sandbox can't reach api.github.com directly
- Use browser fetch approach: inject JS on example.com, file input → FileReader → GitHub Contents API PUT
- Token needed: classic PAT with repo scope
