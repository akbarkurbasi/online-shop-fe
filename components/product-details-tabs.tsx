'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ProductDetailsTabsProps {
  description: string
}

type TabKey = 'description' | 'materials' | 'care' | 'size'

const TABS: { key: TabKey; index: string; label: string }[] = [
  { key: 'description', index: '01', label: 'Description' },
  { key: 'materials', index: '02', label: 'Materials' },
  { key: 'care', index: '03', label: 'Care' },
  { key: 'size', index: '04', label: 'Size Guide' },
]

export function ProductDetailsTabs({ description }: ProductDetailsTabsProps) {
  const [active, setActive] = useState<TabKey>('description')

  return (
    <section className="mb-24">
      <div className="mb-6 pb-4 border-b border-border">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Details</p>
        <h2 className="text-3xl md:text-4xl italic font-black uppercase tracking-tighter">The Specs</h2>
      </div>

      {/* Tab strip */}
      <div className="flex flex-wrap gap-0 border-b border-border mb-8" role="tablist">
        {TABS.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.key)}
              className={cn(
                'group relative inline-flex items-center gap-2 px-4 md:px-6 py-4 -mb-px border-b-2 transition-colors text-[11px] font-mono uppercase tracking-[0.2em]',
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <span className={cn(
                'transition-colors',
                isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-accent'
              )}>
                {tab.index}
              </span>
              <span>/</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab panel */}
      <div role="tabpanel" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {active === 'description' && (
          <>
            <div className="lg:col-span-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ Overview</p>
            </div>
            <div className="lg:col-span-8 space-y-4">
              <p className="text-base md:text-lg leading-relaxed text-foreground">
                {description || 'No description available.'}
              </p>
            </div>
          </>
        )}

        {active === 'materials' && (
          <>
            <div className="lg:col-span-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ Composition</p>
            </div>
            <div className="lg:col-span-8 space-y-6">
              <p className="text-base text-muted-foreground leading-relaxed">
                Premium fabrics sourced from technical mills. Engineered for movement, finished for everyday wear.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border">
                <div className="bg-background p-5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Main Fabric</p>
                  <p className="text-sm font-bold uppercase tracking-tight">95% Cotton · 5% Elastane</p>
                </div>
                <div className="bg-background p-5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Weight</p>
                  <p className="text-sm font-bold uppercase tracking-tight">240 GSM Mid-Weight</p>
                </div>
                <div className="bg-background p-5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Finish</p>
                  <p className="text-sm font-bold uppercase tracking-tight">Brushed Inner</p>
                </div>
                <div className="bg-background p-5">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Origin</p>
                  <p className="text-sm font-bold uppercase tracking-tight">Made in Portugal</p>
                </div>
              </div>
            </div>
          </>
        )}

        {active === 'care' && (
          <>
            <div className="lg:col-span-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ Instructions</p>
            </div>
            <div className="lg:col-span-8">
              <ul className="divide-y divide-border border-y border-border">
                {[
                  ['01', 'Machine wash cold with similar colors'],
                  ['02', 'Tumble dry low or hang to dry'],
                  ['03', 'Do not bleach'],
                  ['04', 'Iron on low heat if needed'],
                  ['05', 'Do not dry clean'],
                ].map(([n, text]) => (
                  <li key={n} className="flex items-center gap-6 py-4">
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground shrink-0">/ {n}</span>
                    <span className="text-sm text-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {active === 'size' && (
          <>
            <div className="lg:col-span-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ Body Measurements (cm)</p>
            </div>
            <div className="lg:col-span-8 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-y border-border bg-secondary">
                    <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Size</th>
                    <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Chest</th>
                    <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Waist</th>
                    <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Hip</th>
                    <th className="py-3 px-4 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Length</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {[
                    ['XS', '86', '70', '88', '66'],
                    ['S', '92', '76', '94', '68'],
                    ['M', '98', '82', '100', '70'],
                    ['L', '104', '88', '106', '72'],
                    ['XL', '110', '94', '112', '74'],
                  ].map(([size, chest, waist, hip, length]) => (
                    <tr key={size} className="border-b border-border">
                      <td className="py-3 px-4 font-bold uppercase tracking-tight">{size}</td>
                      <td className="py-3 px-4">{chest}</td>
                      <td className="py-3 px-4">{waist}</td>
                      <td className="py-3 px-4">{hip}</td>
                      <td className="py-3 px-4">{length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-4">
                / Note · Measurements are body, not garment. Allow 2–4cm for fit.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
