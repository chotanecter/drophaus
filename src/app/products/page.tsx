'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  colors: string[]
  colorHexCodes: string[]
  fabricWeight: string | null
  category: { name: string; slug: string }
  images: string[]
}

const categoryFilters = [
  { label: 'All', value: '' },
  { label: 'T-Shirts', value: 'tees' },
  { label: 'Hoodies', value: 'hoodies' },
  { label: 'Sweats', value: 'sweats' },
  { label: 'Jackets', value: 'jackets' },
]

function ProductsContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || ''
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = activeCategory ? `?category=${activeCategory}` : ''
        const res = await fetch(`/api/products${params}`)
        const data = await res.json()
        setProducts(data)
      } catch (err) {
        console.error('Failed to fetch products:', err)
      }
      setLoading(false)
    }
    fetchProducts()
  }, [activeCategory])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Products</h1>
        <p className="text-neutral-500 mt-2">Premium blank apparel for every need</p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categoryFilters.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.value
                ? 'bg-black text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

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
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-500 text-lg">No products found</p>
          <p className="text-neutral-400 text-sm mt-2">Products will appear here once added via the admin dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="group">
              <div className="aspect-square bg-neutral-100 rounded-lg mb-3 overflow-hidden group-hover:bg-neutral-200 transition-colors flex items-center justify-center">
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-neutral-300 text-5xl">👕</span>
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
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-10 bg-neutral-200 rounded w-48 mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i}>
                <div className="aspect-square bg-neutral-200 rounded-lg mb-3" />
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
