'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const IMAGES = ['/hero/dh1.jpg', '/hero/dh2.jpg', '/hero/dh3.jpg']
const SLIDE_DURATION = 4000
const FADE_DURATION = 1200

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState(1)
  const [phase, setPhase] = useState<'visible' | 'fading'>('visible')
  const [scrollY, setScrollY] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)

  // Parallax scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setPhase('fading')
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % IMAGES.length)
        setNextIndex((prev) => (prev + 1) % IMAGES.length)
        setPhase('visible')
      }, FADE_DURATION)
    }, SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [])

  const parallaxOffset = scrollY * 0.4
  const contentOpacity = Math.max(0, 1 - scrollY / 700)

  return (
    <section
      ref={sectionRef}
      className="relative h-screen overflow-hidden bg-black"
      style={{ minHeight: 600 }}
    >
      {/* Ken Burns background slides */}
      {IMAGES.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            transform: `translateY(${parallaxOffset}px)`,
            opacity:
              i === currentIndex
                ? phase === 'fading' ? 0 : 1
                : i === nextIndex && phase === 'fading'
                ? 1
                : 0,
            transition: `opacity ${FADE_DURATION}ms ease-in-out`,
            zIndex: i === currentIndex ? 2 : i === nextIndex ? 1 : 0,
          }}
        >
          <div
            className="absolute"
            style={{
              inset: '-10%',
              width: '120%',
              height: '120%',
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: `kenburns-${i % 3} ${SLIDE_DURATION + FADE_DURATION}ms ease-out forwards`,
            }}
          />
        </div>
      ))}

      {/* Dark overlay */}
      <div
        className="absolute inset-0 z-[5]"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.7) 100%)',
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
          opacity: 0.08,
          animation: 'grain 8s steps(10) infinite',
        }}
      />

      {/* Hero content */}
      <div
        className="relative z-10 h-full flex items-center"
        style={{
          opacity: contentOpacity,
          transform: `translateY(${-parallaxOffset * 0.3}px)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="maw-w-[700px]">
            {/* Label */}
            <div className="flex items-center gap-3 mb-5 animate-hero-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="h-px w-[60px] bg-accent animate-hero-line-expand" />
              <span className="text-accent font-semibold text-[11px] tracking-[0.2em] uppercase">
                Premium Blank Apparel
              </span>
            </div>

            {/* Heading */}
            <h1
              className="text-[clamp(40px,8vw,80px)] font-black text-white leading-[0.9] tracking-tight mb-6 animate-hero-fade-in"
              style={{ animationDelay: '0.4s', letterSpacing: '-0.03em' }}
            >
              The Foundation<br />
              <span className="text-white/50">of Your Brand</span>
            </h1>

            {/* Subtext */}
            <p
              className="text-lg text-white/55 max-w-[500px] mb-10 leading-relaxed animate-hero-fade-in"
              style={{ animationDelay: '0.6s' }}
            >
              Heavyweight blanks built for screen printing, embroidery, and private label.
              Quality you can feel before you even put your name on it.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 animate-hero-fade-in" style={{ animationDelay: '0.8s' }}>
              <Link
                href="/products"
                className="bg-white text-black px-8 py-3.5 rounded-md font-semibold text-sm hover:bg-neutral-100 hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                Shop Collection
              </Link>
              <Link
                href="/wholesale"
                className="border border-white/30 text-white px-8 py-3.5 rounded-md font-semibold text-sm hover:border-white hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                Apply for Wholesale
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setPhase('fading')
              setTimeout(() => {
                setCurrentIndex(i)
                setNextIndex((i + 1) % IMAGES.length)
                setPhase('visible')
              }, FADE_DURATION)
            }}
            className="h-2 rounded-full border-none transition-all duration-400 cursor-pointer"
            style={{
              width: i === currentIndex ? 32 : 8,
              background: i === currentIndex ? '#B87333' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 z-10 flex flex-col items-center gap-2 opacity-50 animate-hero-fade-in" style={{ animationDelay: '1.2s' }}>
        <span className="text-[10px] tracking-[0.15em] uppercase text-white" style={{ writingMode: 'vertical-rl' }}>
          Scroll
        </span>
        <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)' }} />
      </div>
    </section>
  )
}
