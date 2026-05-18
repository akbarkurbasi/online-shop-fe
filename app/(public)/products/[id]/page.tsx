import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CartDrawer } from '@/components/cart-drawer'
import { ProductActions } from '@/components/product-actions'
import { ProductCard } from '@/components/product-card'
import { ProductGallery } from '@/components/product-gallery'
import { ProductDetailsTabs } from '@/components/product-details-tabs'
import { MobileBuyBar } from '@/components/mobile-buy-bar'
import type { Product } from '@/lib/types'

import { productService } from '@/services/productService'

async function getProduct(id: string): Promise<Product | null> {
  try {
    const data = await productService.getProductById(id)
    return data.data
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: product.name,
    description: product.description,
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  // Get related products (same category)
  let relatedProducts: Product[] = []
  try {
    const data = await productService.getProducts({ category: product.category })
    relatedProducts = data.data.items
  } catch (error) {
    console.error('Failed to fetch related products:', error)
  }
  const filtered = relatedProducts.filter((p) => p.id !== id).slice(0, 4)
  const skuTag = product.id.slice(0, 4).toUpperCase()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 pt-10 pb-32 lg:pb-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-10 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            <Link href="/shop" className="hover:text-foreground transition">/ Shop</Link>
            <span>·</span>
            <Link href={`/shop?category=${product.category}`} className="hover:text-foreground transition capitalize">{product.category}</Link>
            <span>·</span>
            <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
          </div>

          {/* Product Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-24">
            {/* Image Column — editorial multi-frame gallery (interactive).
                On lg+ the column matches the right info column's fixed height so
                the image doesn't scroll the page; thumbnails become a vertical rail. */}
            <div className="order-2 lg:order-1 lg:col-span-7 lg:sticky lg:top-28 lg:self-start lg:h-[calc(100vh-7.5rem)]">
              <ProductGallery
                image={product.image}
                name={product.name}
                skuTag={skuTag}
                rating={product.rating}
                inStock={product.inStock}
              />
            </div>

            {/* Product Details & Actions */}
            <div id="buy" className="order-1 lg:order-2 scroll-mt-28 lg:col-span-5 flex flex-col gap-8 lg:sticky lg:top-28 lg:self-start lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto custom-scrollbar">
              {/* Category eyebrow & Title */}
              <div className="space-y-4 border-b border-border pb-8">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  / {product.category}
                </p>
                <h1 className="text-3xl md:text-5xl italic font-black uppercase tracking-tighter leading-[0.95]">
                  {product.name}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Mandatory Variant Selection (Client Component) */}
              <ProductActions product={product} />

              {/* Spec strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-y border-border divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="flex flex-col gap-1 py-4 sm:px-4">
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ 01</span>
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em]">Free Shipping</span>
                </div>
                <div className="flex flex-col gap-1 py-4 sm:px-4">
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ 02</span>
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em]">30-Day Returns</span>
                </div>
                <div className="flex flex-col gap-1 py-4 sm:px-4">
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ 03</span>
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em]">Secure Checkout</span>
                </div>
              </div>

              {/* Meta strip */}
              <div className="flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                <span>/ SKU · {skuTag}</span>
              </div>
            </div>
          </div>

          {/* Lookbook strip */}
          <section className="mb-24">
            <div className="flex items-end justify-between mb-6 pb-4 border-b border-border">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Lookbook · {product.category}</p>
                <h2 className="text-3xl md:text-5xl italic font-black uppercase tracking-tighter">In Motion</h2>
              </div>
              <span className="hidden md:inline-flex text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                / FW 26 — Drop 02
              </span>
            </div>

            <div className="relative aspect-[21/9] bg-secondary overflow-hidden rounded-xl">
              <Image
                src={product.image}
                alt={`${product.name} — lookbook`}
                fill
                className="object-cover"
                style={{ objectPosition: 'center 30%' }}
                sizes="100vw"
              />
              <span className="absolute top-4 left-4 text-[10px] font-mono uppercase tracking-[0.3em] text-background bg-foreground/80 backdrop-blur px-2.5 py-1.5">
                / Look 01 · {product.category}
              </span>
              <span className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-[0.3em] text-background bg-foreground/80 backdrop-blur px-2.5 py-1.5">
                / FW 26
              </span>
              <span className="absolute bottom-4 left-4 text-[10px] font-mono uppercase tracking-[0.3em] text-background bg-foreground/80 backdrop-blur px-2.5 py-1.5">
                {product.name}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              <span>01 / 01</span>
              <span>Photographed in the studio</span>
            </div>
          </section>

          {/* Tabbed product details */}
          <ProductDetailsTabs description={product.description} />

          {/* Related Products Section */}
          {filtered.length > 0 && (
            <section className="pt-16 border-t border-border">
              <div className="flex justify-between items-end mb-10 pb-6 border-b border-border">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Related</p>
                  <h2 className="text-3xl md:text-4xl italic font-black uppercase tracking-tighter">More From The Drop</h2>
                </div>
                <Link href="/shop" className="hidden md:inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] hover:text-accent transition">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 md:gap-x-4 gap-y-10">
                {filtered.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <MobileBuyBar
        name={product.name}
        price={product.price}
        inStock={product.inStock}
      />
    </div>
  )
}
