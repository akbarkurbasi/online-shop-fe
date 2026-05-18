'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface MobileBuyBarProps {
  name: string
  price: number
  inStock: boolean
}

export function MobileBuyBar({ name, price, inStock }: MobileBuyBarProps) {
  const [visible, setVisible] = useState(false)

  // Only show once user has scrolled past the first viewport — keeps the
  // hero clean and reveals the bar as soon as the user is exploring the page.
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!visible}
    >
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground truncate">
            / {name}
          </p>
          <p className="text-base font-bold tracking-tight">
            {formatPrice(price)}
          </p>
        </div>
        <a
          href="#buy"
          className="h-12 px-5 flex items-center gap-2 bg-foreground text-background text-[11px] font-mono uppercase tracking-[0.3em] hover:bg-accent transition-colors disabled:opacity-30"
          aria-disabled={!inStock}
          onClick={(e) => {
            if (!inStock) e.preventDefault()
          }}
        >
          {inStock ? 'Configure' : 'Sold Out'}
          {inStock && <ArrowRight className="h-3.5 w-3.5" />}
        </a>
      </div>
    </div>
  )
}
