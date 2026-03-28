import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Collaborations',
  description: 'Explore DropHaus brand collaborations. Limited-edition capsule collections and custom apparel partnerships.',
  openGraph: {
    title: 'Collaborations | DropHaus',
    description: 'Limited-edition capsule collections and custom apparel partnerships.',
  },
}

export default function CollabsLayout({ children }: { children: React.ReactNode }) {
  return children
}
