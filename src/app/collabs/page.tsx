'use client'

import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  colors: string[]
  colorHexCodes: string[]
  fabricWeight: string | null
  category: { name: string; slug: string } | null
  images: string[]
}

interface Collab {
  id: string
  brandName: string
  slug: string
  description: string | null
  logo: string | null
  coverImage: string | null
  products: Product[]
}

export default function CollabsPage() {
  const [collabs, setCollabs] = useState<Collab[]>([])
  const [loading, setLoading] = useState(true)
  const [activeBrand, setActiveBrand] = useState<string>('') // '' = all brands

  useEffect(() => {
    const fetchCollabs = async () => {
      try {
        const res = await fetch('/api/collabs')
        const data = await res.json()
        setCollabs(data)
      } catch (err) {
        console.error('Failed to fetch collabs:', err)
      }
      setLoading(false)
    }
    fetchCollabs()
  }, [])

  // Flatten all collab products, filtered by active brand
  const filteredProducts = useMemo(() => {
    if (activeBrand === '') {
      return collabs.flatMap(c => c.products.map(p => ({ ...p, collab: c })))
    }
    const collab = collabs.find(c => c.slug === activeBrand)
    if (!collab) return []
    return collab.products.map(p => ({ ...p, collab }))
  }, [collabs, activeBrand])

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Collaborations</h1>
          <p className="text-neutral-500 mt-2">
            When quality meets creativity. Explore our brand partnerships.
          </p>
        </div>

        {/* Brand Logo Filters */}
        {collabs.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-10">
            <button
              onClick={() => setActiveBrand('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeBrand === ''
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Brands
            </button>
            {collabs.map((collab) => (
              <button
                key={collab.slug}
                onClick={() => setActiveBrand(collab.slug)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeBrand === collab.slug
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {collab.logo ? (
                  <img
                    src={collab.logo}
                    alt={collab.brandName}
                    className={`w-5 h-5 rounded-full object-cover ${
                      activeBrand === collab.slug ? 'brightness-200' : ''
                    }`}
                  />
                ) : null}
                {collab.brandName}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-neutral-200 rounded-lg mb-3" />
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-neutral-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">No collaboration products yet</p>
            <p className="text-neutral-400 text-sm mt-2">Check back soon for exciting brand partnerships.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="group">
                <div className="aspect-square rounded-lg mb-3 overflow-hidden relative group-hover:shadow-md transition-all bg-neutral-100 border border-neutral-200">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center"
                      style={{
                        background: product.colorHexCodes[0]
                          ? `linear-gradient(135deg, ${product.colorHexCodes[0]}ee, ${product.colorHexCodes[0]}88)`
                          : 'linear-gradient(135deg, #e5e5e5, #d4d4d4)',
                      }}
                    >
                      <span className="text-white/80 text-xs font-semibold uppercase tracking-widest drop-shadow-sm">
                        {product.category?.name || 'Apparel'}
                      </span>
                    </div>
                  )}
                  {/* Brand badge */}
                  {activeBrand === '' && product.collab && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {product.collab.brandName}
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-sm group-hover:text-accent transition-colors">{product.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-neutral-500 text-sm">${product.price.toFixed(2)}</p>
                  {product.fabricWeight && (
                    <p className="text-neutral-400 text-xs">{product.fabricWeight}</p>
                  )}
                </div>
                {/* Color swatches */}
                {product.colorHexCodes.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {product.colorHexCodes.slice(0, 6).map((hex, i) => (
                      <div
                        key={i}
                        className="w-3.5 h-3.5 rounded-full border border-neutral-300"
                        style={{ backgroundColor: hex }}
                        title={product.colors[i]}
                      />
                    ))}
                    {product.colorHexCodes.length > 6 && (
                      <span className="text-xs text-neutral-400 ml-1">+{product.colorHexCodes.length - 6}</span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Partner CTA */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Partner With Us</h2>
            <p className="text-neutral-400 mb-8">
              Looking to create a custom collection? We work with brands of all sizes
              to develop exclusive collaborative pieces on premium blank foundations.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center bg-accent hover:bg-accent-dark text-white px-8 py-3.5 rounded-md font-semibold text-sm transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
