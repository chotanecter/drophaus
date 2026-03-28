'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  wholesalePrice: number | null
  sizes: string[]
  colors: string[]
  colorHexCodes: string[]
  fabricWeight: string | null
  category: { name: string }
  images: string[]
}

export default function WholesalePortalPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [accountInfo, setAccountInfo] = useState<{ businessName: string; accountId: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/wholesale/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const data = await res.json()
        setAccountInfo(data)
        setLoggedIn(true)

        // Fetch products with wholesale pricing
        const prodRes = await fetch('/api/products')
        if (prodRes.ok) setProducts(await prodRes.json())
      } else {
        const data = await res.json()
        setError(data.error || 'Login failed')
      }
    } catch {
      setError('Connection error')
    }
    setLoading(false)
  }

  if (!loggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Wholesale Portal</h1>
        <p className="text-neutral-500 mb-8">Log in to access wholesale pricing and place bulk orders.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black"
              placeholder="your@business.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3.5 rounded-md font-semibold text-sm hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Don&apos;t have an account? <Link href="/wholesale" className="text-accent hover:text-accent-dark font-medium">Apply for wholesale</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold">Wholesale Portal</h1>
          <p className="text-neutral-500 mt-1">Welcome back, {accountInfo?.businessName}</p>
        </div>
        <button
          onClick={() => { setLoggedIn(false); setAccountInfo(null) }}
          className="text-sm text-neutral-500 hover:text-black"
        >
          Log Out
        </button>
      </div>

      {/* Wholesale Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.filter(p => p.wholesalePrice).map((product) => (
          <div key={product.id} className="group">
            <div className="aspect-square bg-neutral-100 rounded-lg mb-3 flex items-center justify-center">
              {product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <span className="text-neutral-300 text-5xl">👕</span>
              )}
            </div>
            <h3 className="font-medium text-sm">{product.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-semibold text-green-700">${product.wholesalePrice?.toFixed(2)}</p>
              <p className="text-sm text-neutral-400 line-through">${product.price.toFixed(2)}</p>
            </div>
            {product.fabricWeight && (
              <p className="text-xs text-neutral-400 mt-0.5">{product.fabricWeight} · {product.category.name}</p>
            )}

            {/* Bulk pricing tiers */}
            <div className="mt-2 text-xs text-neutral-500 space-y-0.5">
              <p>12+ units: ${((product.wholesalePrice || 0) * 0.95).toFixed(2)}/ea</p>
              <p>48+ units: ${((product.wholesalePrice || 0) * 0.90).toFixed(2)}/ea</p>
              <p>144+ units: ${((product.wholesalePrice || 0) * 0.85).toFixed(2)}/ea</p>
            </div>
          </div>
        ))}
      </div>

      {products.filter(p => p.wholesalePrice).length === 0 && (
        <div className="text-center py-20 text-neutral-500">
          <p className="text-lg">No wholesale products available yet.</p>
        </div>
      )}
    </div>
  )
}
