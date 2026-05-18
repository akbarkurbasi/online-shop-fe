import { adminService } from '@/services/adminService'
import { ArticlesClient } from '@/components/admin/articles-client'
import { cookies } from 'next/headers'
import type { Article } from '@/lib/types'

export default async function AdminArticlesPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let initialArticles: Article[] = []
  try {

    const data = await adminService.getArticles(token)
    initialArticles = data.data.items

  } catch (error) {
    console.error('Error fetching articles on server:', error)
  }

  return (
    <div className="animate-in fade-in duration-500">
      <ArticlesClient initialArticles={initialArticles} />
    </div>
  )
}
