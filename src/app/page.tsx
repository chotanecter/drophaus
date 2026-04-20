import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Hero from '@/components/Hero'
import CategoryCard from '@/components/CategoryCard'
import WhyDropHaus from '@/components/WhyDropHaus'

const categories = [
  {
    name: 'T-Shirts',
    slug: 'tees',
    images: ['/categories/tees-1.jpg', '/categories/tees-2.jpg', '/categories/tees-3.jpg'],
  },
  {
    name: 'Hoodies',
    slug: 'hoodies',
    images: ['/categories/hoodies-1.jpg', '/categories/hoodies-2.jpg'],
  },
  {
    name: 'Sweats',
    slug: 'sweats',
    images: ['/categories/sweats-1.jpg', '/categories/sweats-2.jpg', '/categories/sweats-3.jpg'],
  },
  {
    name: 'Jackets',
    slug: 'jackets',
    images: ['/categories/jackets-1.jpg', '/categories/jackets-2.jpg'],
  },
]


export const dynamic = 'force-dynamic'

export default async function Home() {
  const featuredProducts = await prisma.product.findMany({
    where: { featured: true, active: true },
    include: { category: true },
    take: 4,
    orderBy: { createdAt: 'desc' },
  })
  return (
    <>
      {/* Hero */}
      <Hero />

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Shop by Category</h2>
          <p className="text-neutral-500 mt-2">Premium blanks across every essential silhouette</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.slug}
              name={cat.name}
              slug={cat.slug}
              images={cat.images}
              interval={3500}
            />
          ))}
        </div>
      </section>

      {/* Why DropHaus */}
      <WhyDropHaus />

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Featured</h2>
          <Link href="/products" className="text-sm font-medium text-accent hover:text-accent-dark transition-colors">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="group">
              <div className="aspect-square rounded-lg mb-3 overflow-hidden group-hover:shadow-md transition-all bg-neutral-100 border border-neutral-200">
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center"
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
              </div>
              <p className="font-medium text-sm group-hover:text-accent transition-colors">{product.name}</p>
              <p className="text-neutral-500 text-sm">${product.price.toFixed(2)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready to Stock Up?</h2>
          <p className="text-neutral-400 mb-8 max-w-lg mx-auto">
            Apply for a wholesale account and unlock bulk pricing on our full catalog.
          </p>
          <Link
            href="/wholesale"
            className="inline-flex items-center bg-accent hover:bg-accent-dark text-white px-8 py-3.5 rounded-md font-semibold text-sm transition-colors"
          >
            Apply for Wholesale
          </Link>
        </div>
      </section>
    </>
  )
}
