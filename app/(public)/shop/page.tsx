import { Suspense } from 'react'
import { ShopContent } from '@/components/shop-content'
import { productService } from '@/services/productService'
import type { Product } from '@/lib/types'
import { promises as fs } from 'fs'
import path from 'path'

async function getProducts(): Promise<Product[]> {
  try {
    const data = await productService.getProducts()
    return data.data.items
  } catch (error) {
    console.error('Failed to fetch products from API, falling back to static data:', error)
    try {
      const filePath = path.join(process.cwd(), 'data', 'products.json')
      const jsonData = await fs.readFile(filePath, 'utf8')
      return JSON.parse(jsonData)
    } catch (fallbackError) {
      console.error('Failed to load static products data:', fallbackError)
      return []
    }
  }
}

export default async function ShopPage() {

  const products = await getProducts()
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.4em] animate-pulse">Initializing Luxury...</p>
        </div>
      </div>
    }>
      <ShopContent initialProducts={products} />
    </Suspense>
  )
}
