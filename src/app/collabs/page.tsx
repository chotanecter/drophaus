'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Collab {
  id: string
  brandName: string
  slug: string
  description: string | null
  logo: string | null
  coverImage: string | null
  products: { id: string; name: string; slug: string; price: number }[]
}

export default function CollabsPage() {
  const [collabs, setCollabs] = useState<Collab[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCollabs = async () => {
      try {
        const res = await fetch('/api/collabs')
        const data = await res.json()
        setCollabs(data)
      } catch (err) {
        console.error('Failed to fetch collabs:', err)
      }
      setLoading(false)
    }
    fetchCollabs()
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">Collaborations</h1>
          <p className="text-neutral-500 text-lg max-w-2xl">
            When quality meets creativity. Explore our partnerships with brands 
            that share our commitment to premium apparel.
          </p>
        </div>
      </section>

      {/* Collabs Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/9] bg-neutral-200 rounded-lg mb-4" />
                <div className="h-6 bg-neutral-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : collabs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">No collaborations yet</p>
            <p className="text-neutral-400 text-sm mt-2">Check back soon for exciting brand partnerships.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {collabs.map((collab) => (
              <Link
                key={collab.id}
                href={`/collabs/${collab.slug}`}
                className="group"
              >
                <div className="aspect-[16/9] bg-neutral-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center group-hover:bg-neutral-200 transition-colors">
                  {collab.coverImage ? (
                    <img src={collab.coverImage} alt={collab.brandName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl font-black text-neutral-300">
                      {collab.brandName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mb-2">
                  {collab.logo && (
                    <img src={collab.logo} alt="" className="w-8 h-8 rounded-full object-cover" />
                  )}
                  <h2 className="text-xl font-bold group-hover:text-accent transition-colors">
                    DropHaus × {collab.brandName}
                  </h2>
                </div>
                {collab.description && (
                  <p className="text-neutral-500 text-sm line-clamp-2">{collab.description}</p>
                )}
                <p className="text-sm text-accent mt-2 font-medium">
                  {collab.products.length} product{collab.products.length !== 1 ? 's' : ''} →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Partner CTA */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Partner With Us</h2>
            <p className="text-neutral-400 mb-8">
              Looking to create a custom collection? We work with brands of all sizes 
              to develop exclusive collaborative pieces on premium blank foundations.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center bg-accent hover:bg-accent-dark text-white px-8 py-3.5 rounded-md font-semibold text-sm transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
