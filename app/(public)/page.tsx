import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Shield, Star, Shirt } from 'lucide-react'
import { Header } from '@/components/header'
import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { RecommendedSection } from '@/components/recommended-section'
import type { Product, Category } from '@/lib/types'
import { Stagger, Item } from '@/components/motion/Stagger'
import { productService } from '@/services/productService'

async function getAllProducts(): Promise<{ items: Product[] }> {
  try {
    return (await productService.getProducts()).data
  } catch (error) {
    console.error('Error fetching products:', error)
    return { items: [] }
  }
}
export default async function Home() {
  const allProducts = await getAllProducts()

  const featuredProducts = allProducts.items.filter((p) => p.featured).slice(0, 4)

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section — full-bleed sport-fashion */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden bg-foreground">
        <Image
          src="https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&q=80&w=1600"
          alt="Volt FW26 Drop"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
        <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-16 md:pb-24">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-background/80">/ FW 26 — DROP 02</span>
            <div className="h-px flex-1 max-w-24 bg-background/30" />
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl italic font-black uppercase tracking-tighter text-background leading-[0.9] mb-6 max-w-3xl">
            Move /<br />Differently.
          </h1>
          <p className="text-base md:text-lg text-background/80 max-w-md mb-10 leading-relaxed">
            Sportswear and lifestyle essentials, engineered to move with you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="rounded-md bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors h-14 px-8 text-[11px] font-mono uppercase tracking-[0.3em]">
              <Link href="/shop">
                Shop the Drop
                <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-md bg-transparent border-background/40 text-background hover:bg-background hover:text-foreground h-14 px-8 text-[11px] font-mono uppercase tracking-[0.3em]">
              <Link href="/blog">Read the Journal</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Spec Strip — mono technical row */}
      <section className="bg-foreground text-background border-t border-background/10">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 md:divide-x md:divide-background/10">
            <div className="flex items-center gap-4 md:px-8">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40">01</span>
              <span className="text-xs font-mono uppercase tracking-[0.2em]">Free Shipping Over $150</span>
            </div>
            <div className="flex items-center gap-4 md:px-8">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40">02</span>
              <span className="text-xs font-mono uppercase tracking-[0.2em]">30-Day Returns</span>
            </div>
            <div className="flex items-center gap-4 md:px-8">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40">03</span>
              <span className="text-xs font-mono uppercase tracking-[0.2em]">Secure Checkout</span>
            </div>
          </div>
        </div>
      </section>

      {/* THE EDIT — Categories */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12 border-b border-border pb-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ The Edit</p>
              <h2 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">Shop By Category</h2>
            </div>
            <Link href="/shop" className="hidden md:inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] hover:text-accent transition">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <Stagger className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {Array.from(new Set(allProducts.items.map((p) => p.category))).slice(0, 3).map((category, i) => {
              const categoryProduct = allProducts.items.find((p) => p.category === category && p.image);
              if (!categoryProduct) return null;

              const title = category.charAt(0).toUpperCase() + category.slice(1);

              return (
                <Item key={i}>
                  <Link href={`/shop?category=${encodeURIComponent(category)}`}>
                    <div className="group relative aspect-[4/5] overflow-hidden bg-secondary cursor-pointer rounded-xl">
                      <Image
                        src={categoryProduct.image}
                        fill
                        className="object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                        alt={title}
                      />
                      <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/40 transition-colors" />
                      <div className="absolute top-4 left-4">
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/80">/ 0{i + 1}</span>
                      </div>
                      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                        <h3 className="text-background text-2xl md:text-3xl italic font-black uppercase tracking-tighter">{title}</h3>
                        <ArrowRight className="h-5 w-5 text-background group-hover:text-accent transition-colors" />
                      </div>
                    </div>
                  </Link>
                </Item>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* LATEST DROPS */}
      <section className="py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12 border-b border-border pb-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ FW 26</p>
              <h2 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">Latest Drops</h2>
            </div>
            <Link href="/shop" className="hidden sm:inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] hover:text-accent transition">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {featuredProducts.map((product) => (
              <Item key={product.id}>
                <ProductCard product={product} />
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* VOLT AI — Personalized Recommendations */}
      <RecommendedSection />

      {/* PERFORMANCE PILLARS */}
      <section className="py-24 bg-background border-y border-border">
        <div className="container mx-auto px-4">
          <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x md:divide-border">
            <Item className="flex flex-col items-start md:px-12 py-6">
              <Shield className="w-7 h-7 mb-6 text-accent" strokeWidth={1.5} />
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 01 — Trust</p>
              <h3 className="text-xl italic font-black uppercase tracking-tighter mb-3">Secure Payments</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Industry-grade encryption protecting every order from cart to closet.</p>
            </Item>
            <Item className="flex flex-col items-start md:px-12 py-6">
              <Zap className="w-7 h-7 mb-6 text-accent" strokeWidth={1.5} />
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 02 — Speed</p>
              <h3 className="text-xl italic font-black uppercase tracking-tighter mb-3">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Express shipping with garments carefully folded and packaged to arrive in perfect condition.</p>
            </Item>
            <Item className="flex flex-col items-start md:px-12 py-6">
              <Star className="w-7 h-7 mb-6 text-accent" strokeWidth={1.5} />
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 03 — Quality</p>
              <h3 className="text-xl italic font-black uppercase tracking-tighter mb-3">Guaranteed Quality</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Every piece is sourced from trusted makers and backed by our 30-day return guarantee.</p>
            </Item>
          </Stagger>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40 mb-6">/ FW 26 — Now Available</p>
            <h2 className="text-5xl md:text-7xl italic font-black uppercase tracking-tighter mb-8 leading-[0.95]">
              Ready to <br />Suit Up?
            </h2>
            <p className="text-base md:text-lg text-background/70 mb-10 max-w-xl leading-relaxed">
              Discover this season's defining pieces — engineered for the way you actually move.
            </p>
            <Button asChild size="lg" className="rounded-md bg-accent hover:bg-background hover:text-foreground transition-colors h-14 px-10 text-[11px] font-mono uppercase tracking-[0.3em]">
              <Link href="/shop">
                Explore the Drop
                <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <CartDrawer />
    </div>
  )
}
