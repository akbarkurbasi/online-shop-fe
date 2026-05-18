/**
 * articleService.ts
 *
 * Langsung hit backend Go di localhost:8000.
 * TIDAK ada proxy Next.js.
 *
 * PUBLIC  → GET /articles, GET /articles/:id (semua bisa akses, SEO-friendly)
 * PRIVATE → POST/PUT/DELETE /articles (butuh login admin/editor)
 */
import { publicApiClient, privateApiClient } from '@/lib/api-client'
import type { Article } from '@/lib/types'

export const articleService = {
  // ── Public ────────────────────────────────────────────────────────────────
  getArticles: (params?: { category?: string; featured?: boolean }) =>
    publicApiClient.get<{ data: { items: Article[] } }>('/api/v1/articles', {
      params: params as Record<string, string | number>,
    }),

  getArticleById: (id: string) =>
    publicApiClient.get<{ data: Article }>(`/api/v1/articles/${id}`),

  // ── Private (admin/editor) ────────────────────────────────────────────────
  createArticle: (data: Partial<Article>) =>
    privateApiClient.post<Article>('/api/v1/articles', data),

  updateArticle: (id: string, data: Partial<Article>) =>
    privateApiClient.put<Article>(`/api/v1/articles/${id}`, data),

  deleteArticle: (id: string) =>
    privateApiClient.delete<{ message: string }>(`/api/v1/articles/${id}`),
}
