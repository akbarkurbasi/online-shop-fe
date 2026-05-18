import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { Clock, ArrowRight } from 'lucide-react'
import { articleService } from '@/services/articleService'
import type { Article } from '@/lib/types'

async function getArticles(): Promise<{
  data: {
    items: Article[]
  }
}> {
  try {
    return await articleService.getArticles()
  } catch (error) {
    console.error('Error fetching articles:', error)
    return { data: { items: [] } }
  }
}

function formatDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const year = d.getFullYear()
  return `${day} / ${month} / ${year}`
}

export default async function JournalPage() {
  const articles = await getArticles()
  const items = articles.data.items
  const featured = items[0]
  const rest = items.slice(1)

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Page Header */}
      <section className="border-b border-border bg-foreground text-background py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40 mb-6">/ 02 — Journal</p>
              <h1 className="text-5xl md:text-7xl lg:text-8xl italic font-black uppercase tracking-tighter leading-[0.9]">
                The<br />Journal
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="text-sm md:text-base text-background/70 leading-relaxed mb-6">
                Drops, restocks, events, and shop activity — straight from the Volt studio.
              </p>
              <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-background/40">
                <span>/ {items.length} {items.length === 1 ? 'post' : 'posts'}</span>
                <span>·</span>
                <span>Updated weekly</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4">
          {items.length === 0 ? (
            <div className="border border-border p-16 text-left max-w-2xl">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Empty</p>
              <h2 className="text-3xl italic font-black uppercase tracking-tighter mb-3">No Updates Yet</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Check back soon — the next drop is just around the corner.
              </p>
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <Link href={`/blog/${featured.id}`} className="block group mb-20">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ Featured</p>
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground hidden md:inline">
                      Latest Post →
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                    <div className="lg:col-span-7 relative aspect-[4/3] bg-secondary overflow-hidden rounded-xl">
                      <Image
                        src={featured.image}
                        alt={featured.title}
                        fill
                        priority
                        className="object-cover group-hover:scale-105 transition duration-700"
                        sizes="(max-width: 1024px) 100vw, 60vw"
                      />
                      <span className="absolute top-4 left-4 text-[10px] font-mono uppercase tracking-[0.3em] bg-foreground text-background px-2.5 py-1.5">
                        / {featured.category}
                      </span>
                      <span className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-[0.3em] bg-accent text-accent-foreground px-2.5 py-1.5">
                        ★ Featured
                      </span>
                    </div>
                    <div className="lg:col-span-5 flex flex-col">
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-4">
                        {formatDate(featured.publishedAt)}
                      </p>
                      <h2 className="text-3xl md:text-4xl italic font-black uppercase tracking-tighter leading-[1.05] mb-6 group-hover:text-accent transition-colors">
                        {featured.title}
                      </h2>
                      <p className="text-base text-muted-foreground leading-relaxed mb-8">
                        {featured.excerpt}
                      </p>
                      <div className="flex items-center gap-6 pt-6 border-t border-border">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                            {featured.readTime} min read
                          </span>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                          By {featured.author}
                        </span>
                        <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-accent transition-colors">
                          Read Post <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Rest */}
              {rest.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ All Posts</p>
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                      {rest.length} {rest.length === 1 ? 'post' : 'posts'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {rest.map((article) => (
                      <Link key={article.id} href={`/blog/${article.id}`} className="group h-full flex flex-col bg-background border border-border hover:border-foreground transition-colors">
                        <div className="relative aspect-[4/3] bg-secondary overflow-hidden rounded-xl">
                          <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover group-hover:scale-105 transition duration-700"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          <span className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-[0.3em] bg-foreground text-background px-2 py-1">
                            / {article.category}
                          </span>
                        </div>

                        <div className="flex flex-col flex-1 p-6">
                          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
                            {formatDate(article.publishedAt)}
                          </p>
                          <h3 className="text-lg italic font-black uppercase tracking-tighter group-hover:text-accent transition-colors line-clamp-2 mb-3">
                            {article.title}
                          </h3>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-6 leading-relaxed">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{article.readTime} min</span>
                            </div>
                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground group-hover:text-accent transition-colors flex items-center gap-1.5">
                              Read <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
      <CartDrawer />
    </div>
  )
}
