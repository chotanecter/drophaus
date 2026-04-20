'use client'

import { useState, useEffect, useCallback } from 'react'
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
  fabricMaterial: string | null
  category: { name: string }
  images: string[]
  shopifyVariantId: string | null
}

interface CartItem {
  productId: string
  productName: string
  size: string
  color: string
  quantity: number
  wholesalePrice: number
  image: string | null
}

function getBulkPrice(basePrice: number, quantity: number): number {
  if (quantity >= 144) return Math.round(basePrice * 0.85 * 100) / 100
  if (quantity >= 48) return Math.round(basePrice * 0.90 * 100) / 100
  if (quantity >= 12) return Math.round(basePrice * 0.95 * 100) / 100
  return basePrice
}

function getBulkTier(quantity: number): string {
  if (quantity >= 144) return '15% off'
  if (quantity >= 48) return '10% off'
  if (quantity >= 12) return '5% off'
  return ''
}

export default function WholesalePortalPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [accountInfo, setAccountInfo] = useState<{ businessName: string; accountId: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  // Product selection state
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/wholesale/session')
        if (res.ok) {
          const data = await res.json()
          if (data.loggedIn) {
            setAccountInfo({ businessName: data.businessName, accountId: data.accountId })
            setLoggedIn(true)
            const prodRes = await fetch('/api/products')
            if (prodRes.ok) setProducts(await prodRes.json())
          }
        }
      } catch {
        // No session
      }
      setLoading(false)
    }
    checkSession()
  }, [])

  // Load cart from localStorage
  useEffect(() => {
    if (loggedIn && accountInfo) {
      const saved = localStorage.getItem(`dh_cart_${accountInfo.accountId}`)
      if (saved) {
        try { setCart(JSON.parse(saved)) } catch { /* ignore */ }
      }
    }
  }, [loggedIn, accountInfo])

  // Save cart to localStorage
  const saveCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart)
    if (accountInfo) {
      localStorage.setItem(`dh_cart_${accountInfo.accountId}`, JSON.stringify(newCart))
    }
  }, [accountInfo])

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

  const handleLogout = async () => {
    await fetch('/api/wholesale/session', { method: 'DELETE' })
    setLoggedIn(false)
    setAccountInfo(null)
    setProducts([])
    setCart([])
  }

  const addToCart = (product: Product) => {
    const size = selectedSizes[product.id] || product.sizes[0] || ''
    const color = selectedColors[product.id] || product.colors[0] || ''
    const qty = quantities[product.id] || 12

    if (!product.wholesalePrice) return

    // Check if item already in cart with same size/color
    const existingIdx = cart.findIndex(
      item => item.productId === product.id && item.size === size && item.color === color
    )

    let newCart: CartItem[]
    if (existingIdx >= 0) {
      newCart = [...cart]
      newCart[existingIdx].quantity += qty
    } else {
      newCart = [...cart, {
        productId: product.id,
        productName: product.name,
        size,
        color,
        quantity: qty,
        wholesalePrice: product.wholesalePrice,
        image: product.images[0] || null,
      }]
    }

    saveCart(newCart)
    setCartOpen(true)
  }

  const removeFromCart = (idx: number) => {
    const newCart = cart.filter((_, i) => i !== idx)
    saveCart(newCart)
  }

  const updateCartQty = (idx: number, qty: number) => {
    if (qty < 1) return
    const newCart = [...cart]
    newCart[idx].quantity = qty
    saveCart(newCart)
  }

  const cartTotal = cart.reduce((sum, item) => {
    return sum + getBulkPrice(item.wholesalePrice, item.quantity) * item.quantity
  }, 0)

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setCheckingOut(true)
    setCheckoutError('')

    try {
      const res = await fetch('/api/wholesale/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          })),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Clear cart after successful order creation
        saveCart([])
        // Redirect to Shopify payment page
        window.location.href = data.invoiceUrl
      } else {
        const data = await res.json()
        setCheckoutError(data.error || 'Checkout failed')
      }
    } catch {
      setCheckoutError('Connection error. Please try again.')
    }
    setCheckingOut(false)
  }

  if (loading && !loggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-neutral-500">Loading...</div>
      </div>
    )
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
          Don&apos;t have an account? <Link href="/wholesale" className="text-[#B87333] hover:text-[#a0622d] font-medium">Apply for wholesale</Link>
        </p>
      </div>
    )
  }

  const wholesaleProducts = products.filter(p => p.wholesalePrice)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold">Wholesale Portal</h1>
          <p className="text-neutral-500 mt-1">Welcome back, {accountInfo?.businessName}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Cart button */}
          <button
            onClick={() => setCartOpen(!cartOpen)}
            className="relative bg-black text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-neutral-800 transition-colors"
          >
            Cart
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#B87333] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-neutral-500 hover:text-black"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Bulk Pricing Info Banner */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-8">
        <p className="text-sm font-semibold mb-1">Volume Discounts</p>
        <div className="flex gap-6 text-sm text-neutral-600">
          <span>12+ units: <strong className="text-green-700">5% off</strong></span>
          <span>48+ units: <strong className="text-green-700">10% off</strong></span>
          <span>144+ units: <strong className="text-green-700">15% off</strong></span>
        </div>
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Your Cart ({cart.length} items)</h2>
                <button onClick={() => setCartOpen(false)} className="text-neutral-400 hover:text-black text-2xl">&times;</button>
              </div>

              {cart.length === 0 ? (
                <p className="text-neutral-500 text-sm">Your cart is empty. Add products to get started.</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item, idx) => {
                      const unitPrice = getBulkPrice(item.wholesalePrice, item.quantity)
                      const tier = getBulkTier(item.quantity)
                      return (
                        <div key={idx} className="border border-neutral-200 rounded-lg p-4">
                          <div className="flex gap-3">
                            {item.image && (
                              <img src={item.image} alt={item.productName} className="w-14 h-14 object-cover rounded" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.productName}</p>
                              <p className="text-xs text-neutral-500">{item.size} / {item.color}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => updateCartQty(idx, item.quantity - 1)}
                                  className="w-6 h-6 border border-neutral-300 rounded text-xs flex items-center justify-center hover:bg-neutral-100"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateCartQty(idx, parseInt(e.target.value) || 1)}
                                  className="w-16 text-center border border-neutral-300 rounded text-sm py-0.5"
                                />
                                <button
                                  onClick={() => updateCartQty(idx, item.quantity + 1)}
                                  className="w-6 h-6 border border-neutral-300 rounded text-xs flex items-center justify-center hover:bg-neutral-100"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-green-700">${(unitPrice * item.quantity).toFixed(2)}</p>
                              <p className="text-xs text-neutral-500">${unitPrice.toFixed(2)}/ea</p>
                              {tier && <p className="text-xs text-[#B87333] font-medium">{tier}</p>}
                              <button
                                onClick={() => removeFromCart(idx)}
                                className="text-xs text-red-500 hover:text-red-700 mt-1"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Cart Summary */}
                  <div className="border-t border-neutral-200 pt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-neutral-600">Subtotal ({cartItemCount} units)</span>
                      <span className="text-sm font-semibold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-4">Shipping and taxes calculated at checkout</p>

                    {checkoutError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs mb-4">
                        {checkoutError}
                      </div>
                    )}

                    <button
                      onClick={handleCheckout}
                      disabled={checkingOut || cart.length === 0}
                      className="w-full bg-[#B87333] text-white py-3.5 rounded-md font-semibold text-sm hover:bg-[#a0622d] disabled:opacity-50 transition-colors"
                    >
                      {checkingOut ? 'Processing...' : `Checkout — $${cartTotal.toFixed(2)}`}
                    </button>
                    <p className="text-xs text-center text-neutral-500 mt-2">
                      You&apos;ll be redirected to Shopify for secure payment
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wholesaleProducts.map((product) => {
          const selectedSize = selectedSizes[product.id] || product.sizes[0] || ''
          const selectedColor = selectedColors[product.id] || product.colors[0] || ''
          const qty = quantities[product.id] || 12
          const unitPrice = getBulkPrice(product.wholesalePrice!, qty)

          return (
            <div key={product.id} className="border border-neutral-200 rounded-lg overflow-hidden hover:border-neutral-400 transition-colors">
              {/* Product Image */}
              <div className="aspect-square bg-neutral-100 relative">
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
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
                {/* Category badge */}
                <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                  {product.category?.name}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                {product.fabricWeight && (
                  <p className="text-xs text-neutral-500 mb-2">{product.fabricWeight} {product.fabricMaterial ? `· ${product.fabricMaterial}` : ''}</p>
                )}

                {/* Pricing */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-green-700">${unitPrice.toFixed(2)}</span>
                  <span className="text-sm text-neutral-400 line-through">${product.price.toFixed(2)}</span>
                  {getBulkTier(qty) && (
                    <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">
                      {getBulkTier(qty)}
                    </span>
                  )}
                </div>

                {/* Size Selector */}
                {product.sizes.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Size</label>
                    <div className="flex flex-wrap gap-1">
                      {product.sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSizes(s => ({ ...s, [product.id]: size }))}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            selectedSize === size
                              ? 'bg-black text-white border-black'
                              : 'border-neutral-300 hover:border-neutral-500'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selector */}
                {product.colors.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Color</label>
                    <div className="flex flex-wrap gap-1.5">
                      {product.colors.map((color, idx) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColors(c => ({ ...c, [product.id]: color }))}
                          title={color}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            selectedColor === color
                              ? 'border-black scale-110'
                              : 'border-neutral-300 hover:border-neutral-500'
                          }`}
                          style={{
                            backgroundColor: product.colorHexCodes[idx] || '#999',
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{selectedColor}</p>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Quantity</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantities(q => ({ ...q, [product.id]: Math.max(1, (q[product.id] || 12) - 12) }))}
                      className="w-7 h-7 border border-neutral-300 rounded text-sm flex items-center justify-center hover:bg-neutral-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQuantities(q => ({ ...q, [product.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-20 text-center border border-neutral-300 rounded text-sm py-1"
                    />
                    <button
                      onClick={() => setQuantities(q => ({ ...q, [product.id]: (q[product.id] || 12) + 12 }))}
                      className="w-7 h-7 border border-neutral-300 rounded text-sm flex items-center justify-center hover:bg-neutral-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-black text-white py-2.5 rounded-md text-sm font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Add to Cart — ${(unitPrice * qty).toFixed(2)}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {wholesaleProducts.length === 0 && (
        <div className="text-center py-20 text-neutral-500">
          <p className="text-lg">No wholesale products available yet.</p>
          <p className="text-sm mt-2">Products will appear here once wholesale pricing is set.</p>
        </div>
      )}
    </div>
  )
}
