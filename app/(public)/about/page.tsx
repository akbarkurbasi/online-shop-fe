import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Heart, Users, Zap, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-foreground text-background overflow-hidden">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-7">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40 mb-6">/ About Us</p>
              <h1 className="text-5xl md:text-7xl lg:text-8xl italic font-black uppercase tracking-tighter mb-8 leading-[0.9]">
                Built<br />
                for<br />
                <span className="text-accent">Motion.</span>
              </h1>
              <p className="text-base md:text-lg text-background/70 max-w-xl leading-relaxed">
                Volt makes sportswear, athleisure, and lifestyle essentials engineered to move with you — wherever the day takes you.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="border border-background/20 divide-y divide-background/20">
                <div className="grid grid-cols-2 divide-x divide-background/20">
                  <div className="p-5">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40 mb-2">/ Est.</p>
                    <p className="text-2xl italic font-black uppercase tracking-tighter">2024</p>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40 mb-2">/ Studio</p>
                    <p className="text-2xl italic font-black uppercase tracking-tighter">LA, USA</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-background/20">
                  <div className="p-5">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40 mb-2">/ Pieces</p>
                    <p className="text-2xl italic font-black uppercase tracking-tighter">200+</p>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40 mb-2">/ Cities</p>
                    <p className="text-2xl italic font-black uppercase tracking-tighter">42</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-24 md:py-32 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 01 — Our Mission</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We exist to bridge the gap between performance gear and everyday wear — pieces that hold up in the studio, on the track, and on the street.
              </p>
            </div>
            <div className="lg:col-span-8">
              <h2 className="text-4xl md:text-6xl italic font-black uppercase tracking-tighter leading-[0.95] mb-10">
                Performance,<br />
                reimagined for<br />
                <span className="text-muted-foreground">every day.</span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                At Volt, great style starts with great fabric. We curate technical mills, partner with independent ateliers, and engineer pieces that move with you — bringing modern silhouettes, premium materials, and timeless cuts directly to your closet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-secondary border-b border-border">
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 02 — Core Values</p>
            <h2 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x md:divide-border">
            <div className="flex flex-col items-start md:px-12 py-6">
              <Heart className="w-7 h-7 mb-6 text-accent" strokeWidth={1.5} />
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 01 — Passion</p>
              <h3 className="text-xl italic font-black uppercase tracking-tighter mb-3">Passion</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Every piece we offer is selected out of a deep love for craftsmanship, cut, and considered design.</p>
            </div>
            <div className="flex flex-col items-start md:px-12 py-6">
              <Zap className="w-7 h-7 mb-6 text-accent" strokeWidth={1.5} />
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 02 — Excellence</p>
              <h3 className="text-xl italic font-black uppercase tracking-tighter mb-3">Excellence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">We compromise on nothing. Only the highest standards of fabric, construction, and finish make our racks.</p>
            </div>
            <div className="flex flex-col items-start md:px-12 py-6">
              <Users className="w-7 h-7 mb-6 text-accent" strokeWidth={1.5} />
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 03 — Community</p>
              <h3 className="text-xl italic font-black uppercase tracking-tighter mb-3">Community</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">We foster a growing community of style enthusiasts who share our dedication to the perfect fit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="mb-16">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 03 — The Process</p>
            <h2 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">How It's Made</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border">
            <div className="bg-background p-8 md:p-10 flex flex-col gap-4 min-h-[260px]">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ 01</p>
              <p className="text-5xl italic font-black uppercase tracking-tighter text-accent">01</p>
              <h3 className="text-lg italic font-black uppercase tracking-tighter">Source</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">We partner with technical mills and independent ateliers — only fabrics that perform and last.</p>
            </div>
            <div className="bg-background p-8 md:p-10 flex flex-col gap-4 min-h-[260px]">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ 02</p>
              <p className="text-5xl italic font-black uppercase tracking-tighter text-accent">02</p>
              <h3 className="text-lg italic font-black uppercase tracking-tighter">Design</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Every silhouette engineered for fit, finish, and freedom of movement — across studio and street.</p>
            </div>
            <div className="bg-background p-8 md:p-10 flex flex-col gap-4 min-h-[260px]">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ 03</p>
              <p className="text-5xl italic font-black uppercase tracking-tighter text-accent">03</p>
              <h3 className="text-lg italic font-black uppercase tracking-tighter">Test</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Worn, washed, stretched. Every piece passes our wear-test before it lands on the rack.</p>
            </div>
            <div className="bg-background p-8 md:p-10 flex flex-col gap-4 min-h-[260px]">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ 04</p>
              <p className="text-5xl italic font-black uppercase tracking-tighter text-accent">04</p>
              <h3 className="text-lg italic font-black uppercase tracking-tighter">Deliver</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Direct from the studio to your closet — no middlemen, no markups, no compromises.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Studio & Stats */}
      <section className="py-24 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-7 relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=1200"
                alt="Volt studio — athletic apparel rack"
                fill
                className="object-cover"
              />
              <span className="absolute top-4 left-4 text-[10px] font-mono uppercase tracking-[0.3em] text-background bg-foreground/80 backdrop-blur px-2.5 py-1.5">
                / Studio · LA
              </span>
              <span className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-[0.3em] text-background bg-foreground/80 backdrop-blur px-2.5 py-1.5">
                ★ Est. 2024
              </span>
            </div>
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ 04 — The Studio</p>
                <h2 className="text-3xl md:text-4xl italic font-black uppercase tracking-tighter mb-6 leading-[1.05]">Crafting the Future of Style</h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Founded in 2024 by a team of designers and independent curators, Volt emerged from a simple desire: to make considered, well-made clothing accessible. Today, we&apos;re proud to dress thousands of customers around the globe.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border mt-12 border border-border">
                <div className="bg-background p-6">
                  <p className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter mb-2">10k+</p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Happy Customers</p>
                </div>
                <div className="bg-background p-6">
                  <p className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter mb-2">50+</p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Partner Brands</p>
                </div>
                <div className="bg-background p-6">
                  <p className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter mb-2">42</p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Cities Shipped</p>
                </div>
                <div className="bg-background p-6">
                  <p className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter mb-2">98%</p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Repeat Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40 mb-6">/ Join the Movement</p>
            <h2 className="text-4xl md:text-6xl italic font-black uppercase tracking-tighter mb-8 leading-[0.95]">
              Ready to suit up?
            </h2>
            <p className="text-base md:text-lg text-background/70 mb-10 max-w-xl leading-relaxed">
              Explore the latest drop and find your next favorite piece — engineered for the way you actually move.
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
