import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wholesale',
  description: 'Apply for a DropHaus wholesale account. Competitive bulk pricing, dedicated account management, and fast fulfillment for verified businesses.',
  openGraph: {
    title: 'Wholesale | DropHaus',
    description: 'Bulk pricing on premium blank apparel for verified businesses.',
  },
}

export default function WholesaleLayout({ children }: { children: React.ReactNode }) {
  return children
}
