import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Products',
  description: 'Shop DropHaus premium blank apparel. Heavyweight tees, fleece hoodies, joggers, and jackets — built for screen printing, embroidery, and private label.',
  openGraph: {
    title: 'Products | DropHaus',
    description: 'Premium heavyweight blanks. T-shirts, hoodies, sweats, and jackets ready for your brand.',
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
