import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with DropHaus. Questions about orders, wholesale accounts, or custom collaborations? We\'re here to help.',
  openGraph: {
    title: 'Contact | DropHaus',
    description: 'Get in touch with the DropHaus team.',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
