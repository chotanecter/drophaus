'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)

    const form = new FormData(e.currentTarget)
    const data = Object.fromEntries(form.entries())

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) setSubmitted(true)
    } catch (err) {
      console.error('Failed to submit:', err)
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-6">✓</div>
        <h1 className="text-3xl font-bold mb-4">Message Sent</h1>
        <p className="text-neutral-500">We&apos;ll get back to you as soon as possible.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid md:grid-cols-2 gap-16">
        {/* Info */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Get in Touch</h1>
          <p className="text-neutral-500 leading-relaxed mb-10">
            Have a question about our products, wholesale program, or a potential collaboration? 
            We&apos;d love to hear from you.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-widest text-neutral-400 mb-2">Email</h3>
              <p className="text-lg">info@drophaus.com</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-widest text-neutral-400 mb-2">Phone</h3>
              <p className="text-lg">(555) 000-0000</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-widest text-neutral-400 mb-2">Hours</h3>
              <p className="text-neutral-600">Monday – Friday: 9am – 5pm PST</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                name="name"
                required
                className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                name="email"
                type="email"
                required
                className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="you@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                name="subject"
                className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder="What's this about?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message *</label>
              <textarea
                name="message"
                required
                rows={6}
                className="w-full border border-neutral-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                placeholder="Tell us what you need..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-black text-white py-3.5 rounded-md font-semibold text-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
