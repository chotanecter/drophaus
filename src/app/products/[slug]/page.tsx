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
  tags: string[]
  category: { name: string; slug: string }
  shopifyVariantId: string | null
}

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)

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
        <Link href="/products" className="text-accent hover:text-accent-dark">â Back to Products</Link>
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
        <div className="aspect-square rounded-lg overflow-hidden">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-3"
              style={{
                background: product.colorHexCodes[selectedColor]
                  ? `linear-gradient(145deg, ${product.colorHexCodes[selectedColor]}ee, ${product.colorHexCodes[selectedColor]}99)`
                  : 'linear-gradient(145deg, #e5e5e5, #d4d4d4)',
              }}
            >
              <span className="text-white/60 text-sm font-semibold uppercase tracking-[0.2em] drop-shadow-sm">
                {product.category?.name}
              </span>
              <span className="text-white/90 text-xl font-bold drop-shadow-sm text-center px-8">
                {product.name}
              </span>
              <span className="text-white/40 text-xs uppercase tracking-widest mt-2">
                {product.fabricWeight} Â· {product.fabricMaterial}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{product.name}</h1>
          <p className="text-2xl font-semibold mb-6">${product.price.toFixed(2)}</p>

          {product.description && (
            <p className="text-neutral-600 leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/products?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-medium rounded-full uppercase tracking-wide transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Colors */}
          {product.colorHexCodes.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                Color â {product.colors[selectedColor]}
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

          {/* Add to Cart → Shopify Checkout */}
          <button
            className="w-full bg-black text-white py-3.5 rounded-md font-semibold text-sm hover:bg-neutral-800 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={checkingOut}
            onClick={async () => {
              if (!product.shopifyVariantId) {
                setToastMessage('Checkout coming soon — product sync in progress.')
                setShowToast(true)
                setTimeout(() => setShowToast(false), 3000)
                return
              }

              setCheckingOut(true)
              try {
                const res = await fetch('/api/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    variantId: product.shopifyVariantId,
                    quantity: 1,
                  }),
                })
                const data = await res.json()

                if (data.checkoutUrl) {
                  window.location.href = data.checkoutUrl
                } else {
                  setToastMessage(data.error || 'Checkout failed. Please try again.')
                  setShowToast(true)
                  setTimeout(() => setShowToast(false), 4000)
                }
              } catch {
                setToastMessage('Something went wrong. Please try again.')
                setShowToast(true)
                setTimeout(() => setShowToast(false), 4000)
              }
              setCheckingOut(false)
            }}
          >
            {checkingOut ? 'Redirecting to Checkout...' : 'Add to Cart'}
          </button>

          {/* Toast notification */}
          {showToast && (
            <div className="fixed bottom-6 right-6 bg-black text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-fade-in flex items-center gap-3">
              <span className="text-neutral-300 text-sm">{toastMessage}</span>
            </div>
          )}

          <Link
            href="/wholesale"
            className="block w-full text-center border border-neutral-300 py-3.5 rounded-md font-semibold text-sm text-neutral-600 hover:border-black hover:text-black transition-colors"
          >
            Wholesale Pricing Available â
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
