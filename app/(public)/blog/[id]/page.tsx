import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { articleService } from '@/services/articleService'
import { Clock, ArrowRight } from 'lucide-react'
import type { Article } from '@/lib/types'

async function getArticle(id: string): Promise<Article | null> {
  try {
    const data = await articleService.getArticleById(id)
    return data.data
  } catch (error) {
    console.error('Error fetching article:', error)
    return null
  }
}

async function getRelatedArticles(
  categoryId: string,
  currentId: string
): Promise<Article[]> {
  try {
    const articles = await articleService.getArticles({ category: categoryId })
    return articles.data.items.filter((a) => a.id !== currentId).slice(0, 3)
  } catch (error) {
    console.error('Error fetching related articles:', error)
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = await getArticle(id)

  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }

  return {
    title: article.title,
    description: article.excerpt,
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

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const article = await getArticle(id)

  if (!article) {
    notFound()
  }

  const relatedArticles = await getRelatedArticles(article.category, id)
  const dateLabel = formatDate(article.publishedAt)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-10 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            <Link href="/blog" className="hover:text-foreground transition">/ Journal</Link>
            <span>·</span>
            <span className="capitalize">{article.category}</span>
            <span>·</span>
            <span className="text-foreground truncate max-w-[260px]">{article.title}</span>
          </div>

          {/* Article Header */}
          <div className="max-w-4xl mb-12">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] bg-foreground text-background px-2.5 py-1.5">
                / {article.category}
              </span>
              {dateLabel && (
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  {dateLabel}
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl italic font-black uppercase tracking-tighter leading-[0.95] text-balance mb-8">
              {article.title}
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
              {article.excerpt}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-6 border-t border-border">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ Author</span>
                <span className="text-xs font-bold uppercase tracking-tight">{article.author}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ Read</span>
                <span className="text-xs font-bold uppercase tracking-tight flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {article.readTime} min
                </span>
              </div>
              {dateLabel && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">/ Published</span>
                  <span className="text-xs font-bold uppercase tracking-tight">{dateLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Featured Image */}
          <div className="mb-16">
            <div className="relative aspect-[16/9] bg-secondary overflow-hidden rounded-xl">
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <span className="absolute top-4 left-4 text-[10px] font-mono uppercase tracking-[0.3em] bg-foreground text-background px-2.5 py-1.5">
                / {article.category}
              </span>
              {dateLabel && (
                <span className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-[0.3em] bg-background/90 backdrop-blur text-foreground px-2.5 py-1.5">
                  {dateLabel}
                </span>
              )}
            </div>
          </div>

          {/* Article Content */}
          <article className="max-w-3xl mx-auto mb-20">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-6">/ Article</p>
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: article.content || '' }}
            />
          </article>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="pt-16 border-t border-border">
              <div className="flex items-end justify-between mb-10 pb-4 border-b border-border">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Related</p>
                  <h2 className="text-3xl md:text-4xl italic font-black uppercase tracking-tighter">More From The Journal</h2>
                </div>
                <Link href="/blog" className="hidden md:inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] hover:text-accent transition">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {relatedArticles.map((relatedArticle) => (
                  <Link
                    key={relatedArticle.id}
                    href={`/blog/${relatedArticle.id}`}
                    className="group h-full flex flex-col bg-background border border-border hover:border-foreground transition-colors"
                  >
                    <div className="relative aspect-[4/3] bg-secondary overflow-hidden rounded-xl">
                      <Image
                        src={relatedArticle.image}
                        alt={relatedArticle.title}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-700"
                      />
                      <span className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-[0.3em] bg-foreground text-background px-2 py-1">
                        / {relatedArticle.category}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1 p-6">
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
                        {formatDate(relatedArticle.publishedAt)}
                      </p>
                      <h3 className="text-base italic font-black uppercase tracking-tighter group-hover:text-accent transition-colors line-clamp-2 mb-4">
                        {relatedArticle.title}
                      </h3>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{relatedArticle.readTime} min</span>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground group-hover:text-accent transition-colors flex items-center gap-1.5">
                          Read <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  )
}
