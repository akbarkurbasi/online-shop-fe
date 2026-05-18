import { adminService } from '@/services/adminService'
import { ArticleForm } from '@/components/admin/article-form'
import { cookies } from 'next/headers'
import { Article } from '@/lib/types'

interface EditArticlePageProps {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let article: Article | null = null
  try {
    const data = await adminService.getArticleById(id, token)
    article = data.data
  } catch (error) {
    console.error('Error fetching article on server:', error)
  }

  if (!article) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold uppercase tracking-widest text-muted-foreground">Article Not Found</h2>
        <p className="text-sm text-muted-foreground">The article you are trying to edit does not exist.</p>
      </div>
    )
  }

  return <ArticleForm initialData={article} articleId={id} />
}
