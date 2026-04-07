'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// Types
interface Application {
  id: string
  businessName: string
  contactName: string
  email: string
  phone: string
  einNumber: string
  resaleNumber: string
  address: string | null
  businessType: string
  heardAbout: string | null
  notes: string | null
  status: string
  reviewNotes: string | null
  signupToken: string | null
  createdAt: string
  reviewedAt: string | null
  account: { id: string; email: string; businessName: string; active: boolean; createdAt: string } | null
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  wholesalePrice: number | null
  category: { id: string; name: string; slug: string }
  active: boolean
  featured: boolean
  createdAt: string
  description?: string
  sizes?: string[]
  colors?: string[]
  colorHexCodes?: string[]
  fabricWeight?: string
  fabricMaterial?: string
}

interface Category {
  id: string
  name: string
  slug: string
  _count: { products: number }
}

interface Collab {
  id: string
  brandName: string
  slug: string
  description: string | null
  featured: boolean
  active: boolean
  products: { id: string; name: string; slug: string }[]
}

// Product form defaults
const emptyProduct = {
  name: '',
  slug: '',
  description: '',
  price: '',
  wholesalePrice: '',
  categorySlug: 'tees',
  sizes: 'S,M,L,XL,2XL',
  colors: '',
  colorHexCodes: '',
  fabricWeight: '',
  fabricMaterial: '',
  featured: false,
}

// Collab form defaults
const emptyCollab = {
  brandName: '',
  slug: '',
  description: '',
  featured: false,
}

function AdminContent() {
  const searchParams = useSearchParams()
  const key = searchParams.get('key')
  const [activeTab, setActiveTab] = useState<'applications' | 'products' | 'collabs' | 'accounts' | 'integrations'>('applications')
  const [authorized, setAuthorized] = useState(false)

  // Applications state
  const [applications, setApplications] = useState<Application[]>([])
  const [appFilter, setAppFilter] = useState('')
  const [appSearch, setAppSearch] = useState('')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [productForm, setProductForm] = useState(emptyProduct)
  const [productSaving, setProductSaving] = useState(false)

  // Collabs state
  const [collabs, setCollabs] = useState<Collab[]>([])
  const [showCollabForm, setShowCollabForm] = useState(false)
  const [editingCollab, setEditingCollab] = useState<string | null>(null)
  const [collabForm, setCollabForm] = useState(emptyCollab)
  const [collabSaving, setCollabSaving] = useState(false)

  // Integrations state
  const [apmStatus, setApmStatus] = useState<{ connected: boolean; message: string } | null>(null)
  const [shopifyStatus, setShopifyStatus] = useState<{ connected: boolean; message: string; shopName?: string } | null>(null)
  const [integrationLoading, setIntegrationLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Check auth
  useEffect(() => {
    if (key === 'drophaus-admin-2026') {
      setAuthorized(true)
    }
  }, [key])

  // Fetch data
  useEffect(() => {
    if (!authorized) return
    fetchApplications()
    fetchProducts()
    fetchCategories()
    fetchCollabs()
  }, [authorized, key, appFilter, appSearch])

  const fetchApplications = async () => {
    const params = new URLSearchParams({ key: key! })
    if (appFilter) params.set('status', appFilter)
    if (appSearch) params.set('search', appSearch)
    const res = await fetch(`/api/wholesale/applications?${params}`)
    if (res.ok) setApplications(await res.json())
  }

  const fetchProducts = async () => {
    const res = await fetch('/api/products')
    if (res.ok) setProducts(await res.json())
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    if (res.ok) setCategories(await res.json())
  }

  const fetchCollabs = async () => {
    const res = await fetch('/api/collabs')
    if (res.ok) setCollabs(await res.json())
  }

  const handleApplicationAction = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch(`/api/wholesale/applications?key=${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, reviewNotes }),
    })

    if (res.ok) {
      const updated = await res.json()
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, ...updated } : app))
      )
      setSelectedApp(null)
      setReviewNotes('')
      showToast(`Application ${action}d`)
    }
  }

  // ── Product CRUD ──

  const openProductForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product.slug)
      setProductForm({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: String(product.price),
        wholesalePrice: product.wholesalePrice ? String(product.wholesalePrice) : '',
        categorySlug: product.category?.slug || 'tees',
        sizes: product.sizes?.join(',') || 'S,M,L,XL,2XL',
        colors: product.colors?.join(',') || '',
        colorHexCodes: product.colorHexCodes?.join(',') || '',
        fabricWeight: product.fabricWeight || '',
        fabricMaterial: product.fabricMaterial || '',
        featured: product.featured,
      })
    } else {
      setEditingProduct(null)
      setProductForm(emptyProduct)
    }
    setShowProductForm(true)
  }

  const saveProduct = async () => {
    setProductSaving(true)
    const body = {
      name: productForm.name,
      slug: productForm.slug || productForm.name.toLowerCase().replace(/\s+/g, '-'),
      description: productForm.description,
      price: parseFloat(productForm.price),
      wholesalePrice: productForm.wholesalePrice ? parseFloat(productForm.wholesalePrice) : null,
      categorySlug: productForm.categorySlug,
      sizes: productForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
      colors: productForm.colors.split(',').map(s => s.trim()).filter(Boolean),
      colorHexCodes: productForm.colorHexCodes.split(',').map(s => s.trim()).filter(Boolean),
      fabricWeight: productForm.fabricWeight,
      fabricMaterial: productForm.fabricMaterial,
      featured: productForm.featured,
      active: true,
    }

    const url = editingProduct
      ? `/api/products/${editingProduct}?key=${key}`
      : `/api/products?key=${key}`
    const method = editingProduct ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      showToast(editingProduct ? 'Product updated' : 'Product created')
      setShowProductForm(false)
      fetchProducts()
    } else {
      const err = await res.json()
      showToast(`Error: ${err.error || 'Failed to save'}`)
    }
    setProductSaving(false)
  }

  const deleteProduct = async (slug: string) => {
    if (!confirm('Delete this product?')) return
    const res = await fetch(`/api/products/${slug}?key=${key}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Product deleted')
      fetchProducts()
    }
  }

  // ── Collab CRUD ──

  const openCollabForm = (collab?: Collab) => {
    if (collab) {
      setEditingCollab(collab.slug)
      setCollabForm({
        brandName: collab.brandName,
        slug: collab.slug,
        description: collab.description || '',
        featured: collab.featured,
      })
    } else {
      setEditingCollab(null)
      setCollabForm(emptyCollab)
    }
    setShowCollabForm(true)
  }

  const saveCollab = async () => {
    setCollabSaving(true)
    const body = {
      brandName: collabForm.brandName,
      slug: collabForm.slug || collabForm.brandName.toLowerCase().replace(/\s+/g, '-'),
      description: collabForm.description,
      featured: collabForm.featured,
      active: true,
    }

    const url = editingCollab
      ? `/api/collabs/${editingCollab}?key=${key}`
      : `/api/collabs?key=${key}`
    const method = editingCollab ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      showToast(editingCollab ? 'Collab updated' : 'Collab created')
      setShowCollabForm(false)
      fetchCollabs()
    } else {
      const err = await res.json()
      showToast(`Error: ${err.error || 'Failed to save'}`)
    }
    setCollabSaving(false)
  }

  const deleteCollab = async (slug: string) => {
    if (!confirm('Delete this collaboration?')) return
    const res = await fetch(`/api/collabs/${slug}?key=${key}`, { method: 'DELETE' })
    if (res.ok) {
      showToast('Collab deleted')
      fetchCollabs()
    }
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-neutral-500">Provide the admin key to continue.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'applications' as const, label: 'Applications', count: applications.filter((a) => a.status === 'PENDING').length },
    { id: 'products' as const, label: 'Products', count: products.length },
    { id: 'collabs' as const, label: 'Collabs', count: collabs.length },
    { id: 'accounts' as const, label: 'Accounts', count: applications.filter((a) => a.account).length },
    { id: 'integrations' as const, label: 'Integrations', count: 0 },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-black text-white px-5 py-3 rounded-lg shadow-2xl z-[60] animate-fade-in text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold">DropHaus Admin</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-500 hover:text-black'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-black text-white' : 'bg-neutral-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ===== APPLICATIONS TAB ===== */}
        {activeTab === 'applications' && (
          <div>
            <div className="flex flex-wrap gap-3 mb-6">
              <input
                type="text"
                placeholder="Search business name..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                className="border border-neutral-300 rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:border-black"
              />
              <select
                value={appFilter}
                onChange={(e) => setAppFilter(e.target.value)}
                className="border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-black"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Business</th>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Contact</th>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">EIN</th>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{app.businessName}</p>
                        <p className="text-xs text-neutral-500">{app.businessType.replace('_', ' ')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{app.contactName}</p>
                        <p className="text-xs text-neutral-500">{app.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{app.einNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelectedApp(app); setReviewNotes('') }}
                          className="text-sm text-accent hover:text-accent-dark font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-neutral-500 text-sm">
                        No applications found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Application Detail Modal */}
            {selectedApp && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Application Details</h2>
                    <button onClick={() => setSelectedApp(null)} className="text-neutral-400 hover:text-black text-xl">&times;</button>
                  </div>

                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between"><dt className="text-neutral-500">Business Name</dt><dd className="font-medium">{selectedApp.businessName}</dd></div>
                    <div className="flex justify-between"><dt className="text-neutral-500">Business Type</dt><dd>{selectedApp.businessType.replace('_', ' ')}</dd></div>
                    <div className="flex justify-between"><dt className="text-neutral-500">Contact</dt><dd>{selectedApp.contactName}</dd></div>
                    <div className="flex justify-between"><dt className="text-neutral-500">Email</dt><dd>{selectedApp.email}</dd></div>
                    <div className="flex justify-between"><dt className="text-neutral-500">Phone</dt><dd>{selectedApp.phone}</dd></div>
                    <div className="flex justify-between"><dt className="text-neutral-500">EIN</dt><dd className="font-mono">{selectedApp.einNumber}</dd></div>
                    <div className="flex justify-between"><dt className="text-neutral-500">Resale #</dt><dd className="font-mono">{selectedApp.resaleNumber}</dd></div>
                    {selectedApp.address && <div className="flex justify-between"><dt className="text-neutral-500">Address</dt><dd>{selectedApp.address}</dd></div>}
                    {selectedApp.heardAbout && <div className="flex justify-between"><dt className="text-neutral-500">Heard About</dt><dd>{selectedApp.heardAbout}</dd></div>}
                    {selectedApp.notes && <div><dt className="text-neutral-500 mb-1">Notes</dt><dd className="bg-neutral-50 p-3 rounded-md">{selectedApp.notes}</dd></div>}
                  </dl>

                  {selectedApp.status === 'PENDING' && (
                    <div className="mt-6 pt-6 border-t">
                      <label className="block text-sm font-medium mb-2">Review Notes (optional)</label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:border-black resize-none"
                        placeholder="Internal notes..."
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApplicationAction(selectedApp.id, 'approve')}
                          className="flex-1 bg-green-600 text-white py-2.5 rounded-md font-medium text-sm hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApplicationAction(selectedApp.id, 'reject')}
                          className="flex-1 bg-red-600 text-white py-2.5 rounded-md font-medium text-sm hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedApp.status === 'APPROVED' && selectedApp.signupToken && !selectedApp.account && (
                    <div className="mt-6 pt-6 border-t">
                      <label className="block text-sm font-medium mb-2">Signup Link</label>
                      <div className="bg-neutral-50 p-3 rounded-md text-sm font-mono break-all">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/wholesale/signup?token={selectedApp.signupToken}
                      </div>
                      <p className="text-xs text-neutral-500 mt-2">Share this link with the applicant to create their wholesale account.</p>
                    </div>
                  )}

                  {selectedApp.account && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm text-green-600 font-medium">Account created &mdash; {selectedApp.account.email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== PRODUCTS TAB ===== */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Products</h2>
              <button
                onClick={() => openProductForm()}
                className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                + Add Product
              </button>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Product</th>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Price</th>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Wholesale</th>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-neutral-500">{p.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{p.category?.name}</td>
                      <td className="px-4 py-3 text-sm">${p.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">{p.wholesalePrice ? `$${p.wholesalePrice.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${p.active ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-600'}`}>
                          {p.active ? 'Active' : 'Inactive'}
                        </span>
                        {p.featured && <span className="ml-1 inline-flex px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">Featured</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openProductForm(p)} className="text-sm text-accent hover:text-accent-dark font-medium">Edit</button>
                          <button onClick={() => deleteProduct(p.slug)} className="text-sm text-red-500 hover:text-red-700 font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-500 text-sm">No products yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Product Form Modal */}
            {showProductForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                    <button onClick={() => setShowProductForm(false)} className="text-neutral-400 hover:text-black text-xl">&times;</button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name *</label>
                      <input
                        value={productForm.name}
                        onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                        placeholder="Heavyweight Crew Tee"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Slug</label>
                      <input
                        value={productForm.slug}
                        onChange={e => setProductForm(f => ({ ...f, slug: e.target.value }))}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                        placeholder="auto-generated from name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={productForm.description}
                        onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                        rows={3}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.price}
                          onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))}
                          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Wholesale Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.wholesalePrice}
                          onChange={e => setProductForm(f => ({ ...f, wholesalePrice: e.target.value }))}
                          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <select
                        value={productForm.categorySlug}
                        onChange={e => setProductForm(f => ({ ...f, categorySlug: e.target.value }))}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:border-black"
                      >
                        {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Sizes (comma-separated)</label>
                      <input
                        value={productForm.sizes}
                        onChange={e => setProductForm(f => ({ ...f, sizes: e.target.value }))}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                        placeholder="S,M,L,XL,2XL"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Colors (comma-separated)</label>
                      <input
                        value={productForm.colors}
                        onChange={e => setProductForm(f => ({ ...f, colors: e.target.value }))}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                        placeholder="Black,White,Navy"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Color Hex Codes (comma-separated)</label>
                      <input
                        value={productForm.colorHexCodes}
                        onChange={e => setProductForm(f => ({ ...f, colorHexCodes: e.target.value }))}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                        placeholder="#000000,#FFFFFF,#1B2A4A"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Fabric Weight</label>
                        <input
                          value={productForm.fabricWeight}
                          onChange={e => setProductForm(f => ({ ...f, fabricWeight: e.target.value }))}
                          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                          placeholder="6.5 oz"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Fabric Material</label>
                        <input
                          value={productForm.fabricMaterial}
                          onChange={e => setProductForm(f => ({ ...f, fabricMaterial: e.target.value }))}
                          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                          placeholder="100% Cotton"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={productForm.featured}
                        onChange={e => setProductForm(f => ({ ...f, featured: e.target.checked }))}
                        className="rounded"
                      />
                      Featured product
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6 pt-6 border-t">
                    <button
                      onClick={() => setShowProductForm(false)}
                      className="flex-1 border border-neutral-300 py-2.5 rounded-md font-medium text-sm hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProduct}
                      disabled={productSaving || !productForm.name || !productForm.price}
                      className="flex-1 bg-black text-white py-2.5 rounded-md font-medium text-sm hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                    >
                      {productSaving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== COLLABS TAB ===== */}
        {activeTab === 'collabs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Collaborations</h2>
              <button
                onClick={() => openCollabForm()}
                className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                + Add Collab
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collabs.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                  <h3 className="font-bold mb-1">DropHaus &times; {c.brandName}</h3>
                  {c.description && <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{c.description}</p>}
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
                    <span>{c.products.length} products</span>
                    <span className={c.active ? 'text-green-600' : 'text-neutral-500'}>{c.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-neutral-100">
                    <button onClick={() => openCollabForm(c)} className="text-sm text-accent hover:text-accent-dark font-medium">Edit</button>
                    <button onClick={() => deleteCollab(c.slug)} className="text-sm text-red-500 hover:text-red-700 font-medium">Delete</button>
                  </div>
                </div>
              ))}
              {collabs.length === 0 && (
                <div className="col-span-full text-center py-12 text-neutral-500 text-sm">No collaborations yet</div>
              )}
            </div>

            {/* Collab Form Modal */}
            {showCollabForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{editingCollab ? 'Edit Collaboration' : 'New Collaboration'}</h2>
                    <button onClick={() => setShowCollabForm(false)} className="text-neutral-400 hover:text-black text-xl">&times;</button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Brand Name *</label>
                      <input
                        value={collabForm.brandName}
                        onChange={e => setCollabForm(f => ({ ...f, brandName: e.target.value }))}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                        placeholder="Brand Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Slug</label>
                      <input
                        value={collabForm.slug}
                        onChange={e => setCollabForm(f => ({ ...f, slug: e.target.value }))}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black"
                        placeholder="auto-generated from name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={collabForm.description}
                        onChange={e => setCollabForm(f => ({ ...f, description: e.target.value }))}
                        rows={4}
                        className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-black resize-none"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={collabForm.featured}
                        onChange={e => setCollabForm(f => ({ ...f, featured: e.target.checked }))}
                        className="rounded"
                      />
                      Featured collaboration
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6 pt-6 border-t">
                    <button
                      onClick={() => setShowCollabForm(false)}
                      className="flex-1 border border-neutral-300 py-2.5 rounded-md font-medium text-sm hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCollab}
                      disabled={collabSaving || !collabForm.brandName}
                      className="flex-1 bg-black text-white py-2.5 rounded-md font-medium text-sm hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                    >
                      {collabSaving ? 'Saving...' : editingCollab ? 'Update Collab' : 'Create Collab'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== ACCOUNTS TAB ===== */}
        {activeTab === 'accounts' && (
          <div>
            <h2 className="text-lg font-bold mb-6">Wholesale Accounts</h2>
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Business</th>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Email</th>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Created</th>
                    <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {applications.filter((a) => a.account).map((app) => (
                    <tr key={app.account!.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-medium text-sm">{app.account!.businessName}</td>
                      <td className="px-4 py-3 text-sm">{app.account!.email}</td>
                      <td className="px-4 py-3 text-sm text-neutral-500">{new Date(app.account!.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${app.account!.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {app.account!.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {applications.filter((a) => a.account).length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500 text-sm">No wholesale accounts yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== INTEGRATIONS TAB ===== */}
        {activeTab === 'integrations' && (
          <div>
            <h2 className="text-lg font-bold mb-6">Integrations</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* ApparelMagic */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">ApparelMagic</h3>
                    <p className="text-sm text-neutral-500">ERP &mdash; Inventory, Orders, Customers</p>
                  </div>
                  {apmStatus && (
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      apmStatus.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {apmStatus.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Endpoint</span>
                    <span className="font-mono text-xs">drophausla.app.apparelmagic.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Status</span>
                    <span>{apmStatus?.message || 'Not checked'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-100 flex gap-2">
                  <button
                    onClick={async () => {
                      setIntegrationLoading(true)
                      const res = await fetch(`/api/integrations/apparelmagic?key=${key}&action=health`)
                      if (res.ok) setApmStatus(await res.json())
                      setIntegrationLoading(false)
                    }}
                    disabled={integrationLoading}
                    className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Test Connection
                  </button>
                  <button
                    onClick={async () => {
                      setIntegrationLoading(true)
                      const res = await fetch(`/api/integrations/apparelmagic?key=${key}&action=products`)
                      if (res.ok) {
                        const data = await res.json()
                        showToast(`Fetched ${data.count} products from APM`)
                      }
                      setIntegrationLoading(false)
                    }}
                    disabled={integrationLoading}
                    className="border border-neutral-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Sync Products
                  </button>
                </div>

                <p className="text-xs text-neutral-400 mt-3">
                  To connect, add your API token to the APPARELMAGIC_API_TOKEN environment variable in Vercel.
                </p>
              </div>

              {/* Shopify */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Shopify</h3>
                    <p className="text-sm text-neutral-500">Retail &mdash; Checkout, Products, Orders</p>
                  </div>
                  {shopifyStatus && (
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      shopifyStatus.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {shopifyStatus.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Store</span>
                    <span className="font-mono text-xs">{shopifyStatus?.shopName || 'Not configured'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Status</span>
                    <span>{shopifyStatus?.message || 'Not checked'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-100 flex gap-2">
                  <button
                    onClick={async () => {
                      setIntegrationLoading(true)
                      const res = await fetch(`/api/integrations/shopify?key=${key}&action=health`)
                      if (res.ok) setShopifyStatus(await res.json())
                      setIntegrationLoading(false)
                    }}
                    disabled={integrationLoading}
                    className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Test Connection
                  </button>
                  <button
                    onClick={async () => {
                      setIntegrationLoading(true)
                      const res = await fetch(`/api/integrations/shopify?key=${key}&action=products`)
                      if (res.ok) {
                        const data = await res.json()
                        showToast(`Fetched ${data.count} products from Shopify`)
                      }
                      setIntegrationLoading(false)
                    }}
                    disabled={integrationLoading}
                    className="border border-neutral-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Sync Products
                  </button>
                </div>

                <p className="text-xs text-neutral-400 mt-3">
                  To connect, add your Shopify credentials (SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN, SHOPIFY_STOREFRONT_TOKEN) to Vercel.
                </p>
              </div>
            </div>

            {/* Integration Guide */}
            <div className="bg-neutral-100 rounded-xl p-6 mt-6">
              <h3 className="font-bold mb-3">Setup Guide</h3>
              <div className="space-y-2 text-sm text-neutral-600">
                <p><strong>ApparelMagic:</strong> Go to APM Settings &rarr; API &rarr; Tokens. Copy your API token and add it to Vercel as APPARELMAGIC_API_TOKEN.</p>
                <p><strong>Shopify:</strong> In your Shopify admin, go to Settings &rarr; Apps &rarr; Develop apps. Create a custom app with Storefront API + Admin API access. Copy the tokens to Vercel.</p>
                <p><strong>Data Flow:</strong> APM manages inventory and wholesale fulfillment. Shopify handles retail checkout. Drop Haus syncs both into a unified catalog.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-neutral-500">Loading admin...</div></div>}>
      <AdminContent />
    </Suspense>
  )
}
