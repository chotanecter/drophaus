'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  wholesalePrice: number | null
  sizes: string[]
  colors: string[]
  colorHexCodes: string[]
  fabricWeight: string | null
  fabricMaterial: string | null
  images: string[]
  category: { name: string; slug: string }
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.slug}`)
        if (res.ok) {
          const data = await res.json()
          setProduct(data)
          if (data.sizes.length > 0) setSelectedSize(data.sizes[0])
        }
      } catch (err) {
        console.error('Failed to fetch product:', err)
      }
      setLoading(false)
    }
    fetchProduct()
  }, [params.slug])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square bg-neutral-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-3/4" />
            <div className="h-6 bg-neutral-200 rounded w-1/4" />
            <div className="h-20 bg-neutral-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <Link href="/products" className="text-accent hover:text-accent-dark">← Back to Products</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-neutral-500 mb-8">
        <Link href="/products" className="hover:text-black">Products</Link>
        <span className="mx-2">/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-black">{product.category.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-black">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="aspect-square bg-neutral-100 rounded-lg flex items-center justify-center">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span className="text-neutral-300 text-8xl">👕</span>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{product.name}</h1>
          <p className="text-2xl font-semibold mb-6">${product.price.toFixed(2)}</p>

          {product.description && (
            <p className="text-neutral-600 leading-relaxed mb-8">{product.description}</p>
          )}

          {/* Colors */}
          {product.colorHexCodes.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                Color — {product.colors[selectedColor]}
              </label>
              <div className="flex gap-2">
                {product.colorHexCodes.map((hex, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(i)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === i ? 'border-black scale-110' : 'border-neutral-300'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={product.colors[i]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="mb-8">
              <label className="text-sm font-medium mb-2 block">Size</label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? 'bg-black text-white border-black'
                        : 'border-neutral-300 text-neutral-600 hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart — wired for future Shopify integration */}
          <button
            className="w-full bg-black text-white py-3.5 rounded-md font-semibold text-sm hover:bg-neutral-800 transition-colors mb-4"
            onClick={() => {
              // TODO: Connect to Shopify Buy SDK
              // import { createCheckout } from '@/lib/services/shopify'
              // createCheckout([{ variantId: product.shopifyVariantId, quantity: 1 }])
              alert('Coming soon — checkout powered by Shopify')
            }}
          >
            Add to Cart
          </button>

          <Link
            href="/wholesale"
            className="block w-full text-center border border-neutral-300 py-3.5 rounded-md font-semibold text-sm text-neutral-600 hover:border-black hover:text-black transition-colors"
          >
            Wholesale Pricing Available →
          </Link>

          {/* Specs */}
          <div className="mt-10 border-t pt-8">
            <h3 className="font-semibold text-sm uppercase tracking-widest text-neutral-400 mb-4">Specifications</h3>
            <dl className="space-y-3">
              {product.fabricMaterial && (
                <div className="flex justify-between text-sm">
                  <dt className="text-neutral-500">Material</dt>
                  <dd className="font-medium">{product.fabricMaterial}</dd>
                </div>
              )}
              {product.fabricWeight && (
                <div className="flex justify-between text-sm">
                  <dt className="text-neutral-500">Weight</dt>
                  <dd className="font-medium">{product.fabricWeight}</dd>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <dt className="text-neutral-500">Sizes Available</dt>
                <dd className="font-medium">{product.sizes.join(', ')}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-neutral-500">Colors Available</dt>
                <dd className="font-medium">{product.colors.length} colors</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
