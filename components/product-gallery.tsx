'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Frame {
  label: string
  position: string
}

const FRAMES: Frame[] = [
  { label: 'Front', position: 'center center' },
  { label: 'Detail', position: 'center 25%' },
  { label: 'Fabric', position: 'center 75%' },
]

interface ProductGalleryProps {
  image: string
  name: string
  skuTag: string
  rating: number
  inStock: boolean
}

export function ProductGallery({ image, name, skuTag, rating, inStock }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const active = FRAMES[activeIdx]
  const frameNumber = String(activeIdx + 1).padStart(2, '0')

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:gap-4 lg:h-full">
      {/* Thumb rail — horizontal under main on mobile, vertical column on lg+ */}
      <div className="order-2 lg:order-1 grid grid-cols-3 gap-2 lg:flex lg:flex-col lg:w-20 lg:shrink-0">
        {FRAMES.map((frame, idx) => {
          const isActive = idx === activeIdx
          return (
            <button
              key={frame.label}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={cn(
                'relative aspect-square overflow-hidden border transition-colors rounded-md',
                isActive
                  ? 'border-foreground'
                  : 'border-transparent hover:border-foreground/40'
              )}
              aria-label={`Show ${frame.label} view`}
              aria-pressed={isActive}
            >
              <Image
                src={image}
                alt={`${name} thumbnail — ${frame.label.toLowerCase()}`}
                fill
                className="object-cover"
                style={{ objectPosition: frame.position }}
                sizes="80px"
              />
              <span className={cn(
                'absolute top-1 left-1 text-[8px] font-mono uppercase tracking-[0.2em] px-1 py-0.5 rounded-sm transition-colors',
                isActive ? 'bg-foreground text-background' : 'bg-background/90 text-foreground'
              )}>
                {String(idx + 1).padStart(2, '0')}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main frame — fills remaining space; on mobile uses 3:4 aspect */}
      <div data-cart-source className="order-1 lg:order-2 relative flex-1 aspect-[3/4] lg:aspect-auto lg:h-full bg-secondary overflow-hidden rounded-xl">
        <Image
          src={image}
          alt={`${name} — ${active.label.toLowerCase()}`}
          fill
          className="object-cover transition-[object-position] duration-500"
          style={{ objectPosition: active.position }}
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        <span className="absolute top-4 left-4 text-[10px] font-mono uppercase tracking-[0.3em] text-foreground bg-background/90 backdrop-blur px-2.5 py-1.5 rounded-md">
          / Frame {frameNumber} · {active.label}
        </span>

        <span className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-[0.3em] text-foreground bg-background/90 backdrop-blur px-2.5 py-1.5 rounded-md">
          SKU · {skuTag}
        </span>

        {rating > 0 && (
          <span className="absolute bottom-4 left-4 text-[10px] font-mono uppercase tracking-[0.3em] text-foreground bg-background/90 backdrop-blur px-2.5 py-1.5 rounded-md">
            ★ {rating.toFixed(1)}
          </span>
        )}

        <span className="absolute bottom-4 right-4 text-[10px] font-mono uppercase tracking-[0.3em] text-foreground bg-background/90 backdrop-blur px-2.5 py-1.5 rounded-md">
          {frameNumber} / {String(FRAMES.length).padStart(2, '0')}
        </span>

        {!inStock && (
          <div className="absolute inset-0 bg-foreground/70 flex items-center justify-center">
            <span className="text-background text-xs font-mono uppercase tracking-[0.3em]">
              Out of Stock
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
