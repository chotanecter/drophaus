import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-black tracking-tight mb-4">DropHaus</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Premium blank apparel, manufactured with precision. Built for brands that demand quality.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">Shop</h4>
            <ul className="space-y-2">
              <li><Link href="/products?category=tees" className="text-sm text-neutral-300 hover:text-white transition-colors">T-Shirts</Link></li>
              <li><Link href="/products?category=hoodies" className="text-sm text-neutral-300 hover:text-white transition-colors">Hoodies</Link></li>
              <li><Link href="/products?category=sweats" className="text-sm text-neutral-300 hover:text-white transition-colors">Sweats</Link></li>
              <li><Link href="/products?category=jackets" className="text-sm text-neutral-300 hover:text-white transition-colors">Jackets</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-neutral-300 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/collabs" className="text-sm text-neutral-300 hover:text-white transition-colors">Collaborations</Link></li>
              <li><Link href="/wholesale" className="text-sm text-neutral-300 hover:text-white transition-colors">Wholesale</Link></li>
              <li><Link href="/contact" className="text-sm text-neutral-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4">Stay Updated</h4>
            <p className="text-sm text-neutral-400 mb-3">Subscribe for new drops and collabs.</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-12 pt-8 text-center">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} DropHaus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
