import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'DropHaus is a premium blank apparel manufacturer. Learn about our mission to deliver heavyweight, production-ready blanks for brands worldwide.',
  openGraph: {
    title: 'About DropHaus',
    description: 'Premium blank apparel, manufactured with precision. Built for brands that demand quality.',
  },
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <p className="text-accent font-medium text-sm uppercase tracking-widest mb-4">Our Story</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95] mb-6">
              Built from the<br />Blank Up
            </h1>
            <p className="text-xl text-neutral-400 leading-relaxed">
              DropHaus was born from a simple belief: every great brand deserves a great foundation. 
              We manufacture premium blank apparel that sets the standard for quality, comfort, and durability.
            </p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold tracking-tight mb-12">Our Process</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center text-xl mb-4">🧵</div>
            <h3 className="text-xl font-bold mb-2">Sourcing</h3>
            <p className="text-neutral-500 leading-relaxed">
              We source the finest raw materials — premium ring-spun cotton, 
              durable fleece blends, and performance fabrics. Every material 
              is tested before it enters our production line.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center text-xl mb-4">⚙️</div>
            <h3 className="text-xl font-bold mb-2">Manufacturing</h3>
            <p className="text-neutral-500 leading-relaxed">
              Our state-of-the-art facility combines modern machinery with 
              skilled craftsmanship. Every cut, stitch, and finish is executed 
              with precision and care.
            </p>
          </div>
          <div>
            <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center text-xl mb-4">✓</div>
            <h3 className="text-xl font-bold mb-2">Quality Control</h3>
            <p className="text-neutral-500 leading-relaxed">
              Before any garment leaves our facility, it passes through 
              multiple quality checkpoints. We inspect fabric weight, 
              stitching integrity, color consistency, and sizing accuracy.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl font-bold tracking-tight mb-12">What We Stand For</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl border border-neutral-200">
              <h3 className="text-xl font-bold mb-3">Quality Over Everything</h3>
              <p className="text-neutral-500 leading-relaxed">
                We don&apos;t cut corners. Our heavyweight constructions, reinforced seams, 
                and premium dyes mean your garments look and feel premium — wash after wash.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-neutral-200">
              <h3 className="text-xl font-bold mb-3">Brand-First Design</h3>
              <p className="text-neutral-500 leading-relaxed">
                Clean blanks, no branding. Our garments are designed to be the perfect 
                canvas for your vision — whether it&apos;s screen printing, embroidery, or private label.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-neutral-200">
              <h3 className="text-xl font-bold mb-3">Wholesale Partners</h3>
              <p className="text-neutral-500 leading-relaxed">
                We believe in building long-term relationships. Our wholesale program 
                offers competitive pricing, dedicated support, and priority fulfillment.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-neutral-200">
              <h3 className="text-xl font-bold mb-3">Always Innovating</h3>
              <p className="text-neutral-500 leading-relaxed">
                From new fabric blends to updated silhouettes, we&apos;re constantly evolving 
                our product line to meet the demands of modern streetwear and fashion brands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Facility placeholder */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold tracking-tight mb-8">Our Facility</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] bg-neutral-100 rounded-lg flex items-center justify-center">
              <span className="text-neutral-300 text-sm">Facility Photo {i}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Let&apos;s Build Something Together</h2>
          <p className="text-neutral-400 mb-8 max-w-lg mx-auto">
            Whether you&apos;re stocking a shop or launching a brand, we&apos;re here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/wholesale"
              className="bg-accent hover:bg-accent-dark text-white px-8 py-3.5 rounded-md font-semibold text-sm transition-colors"
            >
              Apply for Wholesale
            </Link>
            <Link
              href="/contact"
              className="border border-neutral-600 text-white px-8 py-3.5 rounded-md font-semibold text-sm hover:border-white transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
