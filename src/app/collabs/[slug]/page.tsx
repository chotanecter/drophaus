'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Collab {
  id: string
  brandName: string
  slug: string
  description: string | null
  logo: string | null
  coverImage: string | null
  products: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
    colorHexCodes: string[]
    colors: string[]
  }[]
}

export default function CollabDetailPage() {
  const params = useParams()
  const [collab, setCollab] = useState<Collab | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCollab = async () => {
      try {
        const res = await fetch(`/api/collabs/${params.slug}`)
        if (res.ok) setCollab(await res.json())
      } catch (err) {
        console.error('Failed to fetch collab:', err)
      }
      setLoading(false)
    }
    fetchCollab()
  }, [params.slug])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
        <div className="aspect-[21/9] bg-neutral-200 rounded-lg mb-8" />
        <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-neutral-200 rounded w-2/3" />
      </div>
    )
  }

  if (!collab) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Collaboration Not Found</h1>
        <Link href="/collabs" className="text-accent hover:text-accent-dark">← Back to Collabs</Link>
      </div>
    )
  }

  return (
    <>
      {/* Cover */}
      <div className="relative aspect-[21/9] bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 flex items-center justify-center overflow-hidden">
        {collab.coverImage ? (
          <img src={collab.coverImage} alt={collab.brandName} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent rounded-full blur-3xl" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight text-center px-4">
            DropHaus &times; {collab.brandName}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <nav className="text-sm text-neutral-500 mb-8">
          <Link href="/collabs" className="hover:text-black">Collabs</Link>
          <span className="mx-2">/</span>
          <span className="text-black">{collab.brandName}</span>
        </nav>

        {collab.description && (
          <p className="text-lg text-neutral-600 max-w-2xl mb-12">{collab.description}</p>
        )}

        {/* Products */}
        <h2 className="text-2xl font-bold mb-8">Collection</h2>
        {collab.products.length === 0 ? (
          <p className="text-neutral-500">No products in this collection yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collab.products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="group">
                <div className="aspect-square rounded-lg mb-3 overflow-hidden group-hover:shadow-md transition-all">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: product.colorHexCodes?.[0]
                          ? `linear-gradient(135deg, ${product.colorHexCodes[0]}ee, ${product.colorHexCodes[0]}88)`
                          : 'linear-gradient(135deg, #e5e5e5, #d4d4d4)',
                      }}
                    >
                      <span className="text-white/80 text-xs font-semibold uppercase tracking-widest drop-shadow-sm">
                        {product.name}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-sm group-hover:text-accent transition-colors">{product.name}</h3>
                <p className="text-neutral-500 text-sm">${product.price.toFixed(2)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
