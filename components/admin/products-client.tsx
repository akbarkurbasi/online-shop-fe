'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductList } from '@/components/admin/product-list'
import { CategoryList } from '@/components/admin/category-list'
import { VariantList } from '@/components/admin/variant-list'
import { cn } from '@/lib/utils'

const TABS = [
  { value: 'products', index: '01', label: 'Products' },
  { value: 'categories', index: '02', label: 'Categories' },
  { value: 'variants', index: '03', label: 'Variants' },
]

export function ProductsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentTab = searchParams.get('tab') || 'products'

  const onTabChange = (value: string) => {
    router.push(`/admin/products?tab=${value}`, { scroll: false })
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 02 — Inventory</p>
          <h1 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">Products</h1>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-3">
            Manage products, categories, and variants
          </p>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={onTabChange} className="space-y-8">
        <TabsList className="bg-transparent h-auto p-0 gap-0 border-b border-border w-full justify-start rounded-none">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'group relative inline-flex items-center gap-2 px-4 md:px-6 py-4 -mb-px rounded-none bg-transparent border-b-2 border-transparent text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground',
                'data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent'
              )}
            >
              <span className="text-muted-foreground group-data-[state=active]:text-accent transition-colors">{tab.index}</span>
              <span className="text-muted-foreground">/</span>
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="products" className="mt-0 border-none p-0 outline-none">
          <ProductList />
        </TabsContent>

        <TabsContent value="categories" className="mt-0 border-none p-0 outline-none">
          <CategoryList />
        </TabsContent>

        <TabsContent value="variants" className="mt-0 border-none p-0 outline-none">
          <VariantList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
