'use client'

import { useState, useEffect, useCallback } from 'react'

const features = [
  {
    title: 'Premium Fabrics',
    desc: 'Heavyweight cotton, brushed fleece, and performance blends — sourced and tested for durability.',
    image: null, // placeholder — replace with real image path
  },
  {
    title: 'Built to Brand',
    desc: 'Clean blanks ready for your labels, prints, and embroidery. No branding, no compromise.',
    image: null,
  },
  {
    title: 'Wholesale Ready',
    desc: 'Competitive bulk pricing with dedicated account management for verified businesses.',
    image: null,
  },
  {
    title: 'Fast Fulfillment',
    desc: 'Warehouse-stocked essentials ship within 48 hours. Custom orders on your timeline.',
    image: null,
  },
]

const PLACEHOLDER_COLORS = ['#3a3a3a', '#2c2c2c', '#1e1e1e', '#141414']
const SLIDE_DURATION = 5000
const FADE_DURATION = 800

export default function WhyDropHaus() {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const advance = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % features.length)
      setIsTransitioning(false)
    }, FADE_DURATION)
  }, [])

  useEffect(() => {
    const timer = setInterval(advance, SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [advance])

  return (
    <section className="relative overflow-hidden bg-black" style={{ minHeight: 520 }}>
      {/* Background slides */}
      {features.map((feat, i) => {
        const isActive = i === current && !isTransitioning
        const isNext = i === (current + 1) % features.length && isTransitioning
        const visible = isActive || isNext

        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              opacity: visible ? 1 : 0,
              transition: `opacity ${FADE_DURATION}ms ease-in-out`,
              zIndex: isActive ? 2 : isNext ? 3 : 0,
            }}
          >
            {feat.image ? (
              <div
                className="absolute"
                style={{
                  inset: '-5%',
                  width: '110%',
                  height: '110%',
                  backgroundImage: `url(${feat.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  animation: visible
                    ? `kenburns-${i % 3} ${SLIDE_DURATION + FADE_DURATION}ms ease-out forwards`
                    : 'none',
                }}
              />
            ) : (
              /* Placeholder gradient — remove when real images are added */
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at ${30 + i * 15}% ${40 + i * 10}%, ${PLACEHOLDER_COLORS[i]}dd 0%, #0a0a0a 70%)`,
                }}
              />
            )}
          </div>
        )
      })}

      {/* Dark overlay */}
      <div
        className="absolute inset-0 z-[5]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Film grain */}
      <div
        className="absolute z-[6] pointer-events-none"
        style={{
          inset: '-100%',
          width: '300%',
          height: '300%',
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`,
          opacity: 0.06,
          animation: 'grain 8s steps(10) infinite',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20" style={{ minHeight: 520 }}>
        {/* Section header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Why DropHaus</h2>
          <p className="text-white/40 mt-2">Built different from blank to brand</p>
        </div>

        {/* Active feature */}
        <div className="text-center max-w-xl mx-auto">
          <div
            className="transition-all duration-500"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
            }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {features[current].title}
            </h3>
            <p className="text-white/55 text-lg leading-relaxed">
              {features[current].desc}
            </p>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="flex items-center gap-6 mt-14">
          {features.map((feat, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === current) return
                setIsTransitioning(true)
                setTimeout(() => {
                  setCurrent(i)
                  setIsTransitioning(false)
                }, FADE_DURATION)
              }}
              className="group flex flex-col items-center gap-3 cursor-pointer bg-transparent border-none"
            >
              <span
                className="text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-300"
                style={{
                  color: i === current ? '#B87333' : 'rgba(255,255,255,0.3)',
                }}
              >
                {feat.title}
              </span>
              <div
                className="h-[2px] rounded-full transition-all duration-500"
                style={{
                  width: i === current ? 48 : 24,
                  background: i === current ? '#B87333' : 'rgba(255,255,255,0.15)',
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
