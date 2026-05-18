import { ProductsClient } from '@/components/admin/products-client'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export default function AdminProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ProductsClient />
    </Suspense>
  )
}
