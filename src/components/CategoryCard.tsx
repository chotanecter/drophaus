'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CategoryCardProps {
  name: string
  slug: string
  images: string[]
  interval?: number
}

export default function CategoryCard({ name, slug, images, interval = 3000 }: CategoryCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval)
    return () => clearInterval(timer)
  }, [images.length, interval])

  return (
    <Link
      href={`/products?category=${slug}`}
      className="group relative aspect-[3/4] rounded-lg overflow-hidden block"
    >
      {/* Image layers with crossfade */}
      {images.map((img, i) => (
        <div
          key={img}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === currentIndex ? 1 : 0 }}
        >
          <img
            src={img}
            alt={`${name} ${i + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ))}

      {/* Dark gradient overlay at bottom for text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Text overlay */}
      <div className="absolute inset-0 flex items-end p-6">
        <div>
          <h3 className="text-white text-xl font-bold">{name}</h3>
          <p className="text-neutral-300 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            View Collection &rarr;
          </p>
        </div>
      </div>

      {/* Slide indicators (only if multiple images) */}
      {images.length > 1 && (
        <div className="absolute bottom-2 right-4 flex gap-1 z-10">
          {images.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                background: i === currentIndex ? '#B87333' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}
    </Link>
  )
}
