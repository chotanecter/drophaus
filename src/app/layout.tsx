import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const siteUrl = "https://drophaus-beige.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DropHaus — Premium Blank Apparel",
    template: "%s | DropHaus",
  },
  description: "Premium blank apparel manufacturer. Heavyweight tees, hoodies, sweats, and jackets built for brands that demand the best.",
  keywords: ["blank apparel", "wholesale clothing", "heavyweight tees", "premium blanks", "streetwear blanks", "private label apparel", "screen printing blanks"],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "DropHaus",
    title: "DropHaus — Premium Blank Apparel",
    description: "Heavyweight blanks built for screen printing, embroidery, and private label. Quality you can feel.",
    images: [{ url: "/og-image.png", width: 1536, height: 1024, alt: "DropHaus — Premium Blank Apparel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DropHaus — Premium Blank Apparel",
    description: "Heavyweight blanks built for screen printing, embroidery, and private label.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
