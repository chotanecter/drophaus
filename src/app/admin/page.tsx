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
  category: { id: string; name: string }
  active: boolean
  featured: boolean
  createdAt: string
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


function AdminContent() {
  const searchParams = useSearchParams()
  const key = searchParams.get('key')
  const [activeTab, setActiveTab] = useState<'applications' | 'products' | 'collabs' | 'accounts'>('applications')
  const [authorized, setAuthorized] = useState(false)

  // Applications state
  const [applications, setApplications] = useState<Application[]>([])
  const [appFilter, setAppFilter] = useState('')
  const [appSearch, setAppSearch] = useState('')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [, setCategories] = useState<Category[]>([])

  // Collabs state
  const [collabs, setCollabs] = useState<Collab[]>([])

  // Check auth
  useEffect(() => {
    if (key === 'drophaus-admin-2026') {
      setAuthorized(true)
    }
  }, [key])

  // Fetch data
  useEffect(() => {
    if (!authorized) return

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

    fetchApplications()
    fetchProducts()
    fetchCategories()
    fetchCollabs()
  }, [authorized, key, appFilter, appSearch])

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
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
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
            {/* Filters */}
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

            {/* Table */}
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
                    <button onClick={() => setSelectedApp(null)} className="text-neutral-400 hover:text-black">✕</button>
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
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleApplicationAction(selectedApp.id, 'reject')}
                          className="flex-1 bg-red-600 text-white py-2.5 rounded-md font-medium text-sm hover:bg-red-700 transition-colors"
                        >
                          ✕ Reject
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
                      <p className="text-sm text-green-600 font-medium">✓ Account created — {selectedApp.account.email}</p>
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
              <p className="text-sm text-neutral-500">Manage products via API (product management UI coming soon)</p>
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
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-500 text-sm">No products yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== COLLABS TAB ===== */}
        {activeTab === 'collabs' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Collaborations</h2>
              <p className="text-sm text-neutral-500">Manage collabs via API (management UI coming soon)</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collabs.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                  <h3 className="font-bold mb-1">DropHaus × {c.brandName}</h3>
                  {c.description && <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{c.description}</p>}
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{c.products.length} products</span>
                    <span className={c.active ? 'text-green-600' : 'text-neutral-500'}>{c.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              ))}
              {collabs.length === 0 && (
                <div className="col-span-full text-center py-12 text-neutral-500 text-sm">No collaborations yet</div>
              )}
            </div>
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
