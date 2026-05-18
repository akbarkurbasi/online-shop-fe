import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductForm } from '@/components/admin/product-form'
import { productService } from '@/services/productService'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let product = null
  try {
    product = await productService.getProductById(id)
  } catch (error) {
    console.error('Error fetching product for edit:', error)
  }

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="w-fit -ml-2 text-muted-foreground">
          <Link href="/admin/products">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Products
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground mt-1">Update details for "{product.data.name}"</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-card border border-border/60 rounded-xl p-8 shadow-sm">
        <ProductForm initialData={product.data} isEditing={true} />
      </div>
    </div>
  )
}
