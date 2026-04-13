/**
 * Collab Brand Mapping Configuration
 *
 * Maps ApparelMagic product fields to collaboration brands.
 * When importing products from AM, each product is checked against these rules
 * to auto-assign it to the correct collab.
 *
 * To add a new brand:
 * 1. Add an entry to COLLAB_BRANDS below
 * 2. Create the collab record in the DB (via admin or import_products action)
 * 3. Products matching the rules will auto-assign on next import
 */

export interface CollabBrandRule {
  /** Collab slug (must match Collab.slug in DB) */
  slug: string
  /** Display name for the brand */
  brandName: string
  /** Style number prefixes that identify this brand's products */
  stylePrefixes: string[]
  /** Keywords in the product description that identify this brand */
  descriptionKeywords: string[]
  /** ApparelMagic vendor_id values (if the brand has a dedicated vendor) */
  vendorIds?: string[]
  /** ApparelMagic division values */
  divisions?: string[]
  /** ApparelMagic group values */
  groups?: string[]
  /** Brand logo URL */
  logo?: string
  /** Cover image URL */
  coverImage?: string
  /** Brand description */
  description?: string
  /** Brand website */
  website?: string
}

export const COLLAB_BRANDS: CollabBrandRule[] = [
  {
    slug: 'psycho-realm',
    brandName: 'Psycho Realm',
    stylePrefixes: ['PR', 'PRFW', 'PRSM', 'PRSP'],
    descriptionKeywords: ['PSYCHO', 'LOS PSYCHOS'],
    website: 'https://thepsychorealm.com/',
    description: 'Psycho Realm — streetwear rooted in LA culture, art, and music.',
  },
]

/**
 * Check if an ApparelMagic product matches any collab brand.
 * Returns the matching collab slug, or null if it's a regular DropHaus product.
 */
export function matchProductToCollab(product: {
  style_number?: string
  description?: string
  vendor_id?: string
  division?: string
  group?: string
}): string | null {
  const style = (product.style_number || '').toUpperCase().trim()
  const desc = (product.description || '').toUpperCase().trim()

  for (const brand of COLLAB_BRANDS) {
    // Check style number prefixes
    if (brand.stylePrefixes.some(prefix => style.startsWith(prefix.toUpperCase()))) {
      return brand.slug
    }

    // Check description keywords
    if (brand.descriptionKeywords.some(kw => desc.includes(kw.toUpperCase()))) {
      return brand.slug
    }

    // Check vendor ID
    if (brand.vendorIds?.includes(product.vendor_id || '')) {
      return brand.slug
    }

    // Check division
    if (brand.divisions?.includes(product.division || '')) {
      return brand.slug
    }

    // Check group
    if (brand.groups?.includes(product.group || '')) {
      return brand.slug
    }
  }

  return null
}
