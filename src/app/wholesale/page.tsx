'use client'

import { useState } from 'react'

const businessTypes = [
  { value: 'RETAILER', label: 'Retailer' },
  { value: 'ONLINE_STORE', label: 'Online Store' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'OTHER', label: 'Other' },
]

export default function WholesalePage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form.entries())

    try {
      const res = await fetch('/api/wholesale/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Something went wrong')
      }

      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-6">✓</div>
        <h1 className="text-3xl font-bold mb-4">Application Submitted</h1>
        <p className="text-neutral-500 leading-relaxed">
          Thank you for your interest in becoming a DropHaus wholesale partner. 
          Our team will review your application and reach out within 2-3 business days.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Wholesale</h1>
            <p className="text-neutral-500 text-lg">
              Access bulk pricing on our full product line. Fill out the application below 
              to get started with a DropHaus wholesale account.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-bold mb-1">Bulk Pricing</h3>
            <p className="text-neutral-500 text-sm">Significant discounts on volume orders across our full catalog.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-3xl mb-3">🤝</div>
            <h3 className="font-bold mb-1">Dedicated Support</h3>
            <p className="text-neutral-500 text-sm">Personal account manager and priority customer service.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-bold mb-1">Priority Shipping</h3>
            <p className="text-neutral-500 text-sm">Expedited fulfillment and shipping on all wholesale orders.</p>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <div className="bg-white border border-neutral-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-2">Wholesale Application</h2>
          <p className="text-neutral-500 text-sm mb-8">All fields marked with * are required.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-widest text-neutral-400 pb-2 border-b">
                Business Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Business Name *</label>
                <input
                  name="businessName"
                  required
                  className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="Your Business LLC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Business Type *</label>
                <select
                  name="businessType"
                  required
                  className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors bg-white"
                >
                  <option value="">Select type...</option>
                  {businessTypes.map((bt) => (
                    <option key={bt.value} value={bt.value}>{bt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">EIN Number *</label>
                  <input
                    name="einNumber"
                    required
                    className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="XX-XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Resale Number *</label>
                  <input
                    name="resaleNumber"
                    required
                    className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="Your resale certificate number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Business Address</label>
                <input
                  name="address"
                  className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="Street, City, State, ZIP"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-widest text-neutral-400 pb-2 border-b">
                Contact Information
              </h3>

              <div>
                <label className="block text-sm font-medium mb-1">Contact Name *</label>
                <input
                  name="contactName"
                  required
                  className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="Full name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="you@business.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="(555) 000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Additional */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-widest text-neutral-400 pb-2 border-b">
                Additional Details
              </h3>

              <div>
                <label className="block text-sm font-medium mb-1">How did you hear about us?</label>
                <input
                  name="heardAbout"
                  className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="e.g., referral, social media, trade show"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Additional Notes</label>
                <textarea
                  name="notes"
                  rows={4}
                  className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                  placeholder="Tell us about your business and what you're looking for..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-black text-white py-3.5 rounded-md font-semibold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
