/**
 * adminService.ts
 *
 * Langsung hit backend Go di localhost:8000.
 * TIDAK ada proxy Next.js.
 *
 * SEMUA endpoint admin adalah PRIVATE.
 * Otomatis menyertakan Authorization: Bearer <token> via privateApiClient.
 * Halaman admin juga dilindungi oleh middleware.ts (cek cookie user-role).
 */
import { privateApiClient } from '@/lib/api-client'
import type { Product, Order, Category, Article } from '@/lib/types'

// ── Dashboard ─────────────────────────────────────────────────────────────

export interface AdminStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  revenue: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'customer'
  createdAt: string
}

export const adminService = {
  // Stats
  getStats: (token?: string) =>
    privateApiClient.get<AdminStats>('/admin/stats', token ? { headers: { Authorization: `Bearer ${token}` } } : {}),

  // Product Management — bump default limit so the admin table sees the full catalog
  getProducts: (params?: { category?: string; query?: string; limit?: number; page?: number }, token?: string) =>
    privateApiClient.get<{ data: { items: Product[]; paging?: { current_page: number; total_page: number; total_items: number } } }>(
      '/api/v1/products',
      {
        params: { limit: 1000, ...(params || {}) } as Record<string, string | number>,
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      }
    ),

  createProduct: (data: Partial<Product>) =>
    privateApiClient.post<Product>('/api/v1/products', data),

  updateProduct: (id: string, data: Partial<Product>) =>
    privateApiClient.put<Product>(`/api/v1/products/${id}`, data),

  deleteProduct: (id: string) =>
    privateApiClient.delete<{ message: string }>(`/api/v1/products/${id}`),

  bulkSyncProducts: (products: Product[]) =>
    privateApiClient.post<{ message: string; sync_success: boolean }>('/ml-service/products/bulk', { products }),

  // Category Management
  getCategories: () =>
    privateApiClient.get<{ data: Category[] }>('/api/v1/categories'),

  createCategory: (data: Partial<Category>) =>
    privateApiClient.post<Category>('/api/v1/categories', data, {
      credentials: "include"
    }),

  updateCategory: (id: string, data: Partial<Category>) =>
    privateApiClient.put<Category>(`/api/v1/categories/${id}`, data),

  deleteCategory: (id: string) =>
    privateApiClient.delete<{ message: string }>(`/api/v1/categories/${id}`),

  // Article Management
  getArticles: (token?: string) =>
    privateApiClient.get<{ data: { items: Article[] } }>('/api/v1/articles', token ? { headers: { Authorization: `Bearer ${token}` } } : {}),

  getArticleById: (id: string, token?: string) =>
    privateApiClient.get<{ data: Article }>(`/api/v1/articles/${id}`, token ? { headers: { Authorization: `Bearer ${token}` } } : {}),

  createArticle: (data: Partial<any>) =>
    privateApiClient.post<any>('/api/v1/articles', data),

  updateArticle: (id: string, data: Partial<any>) =>
    privateApiClient.put<any>(`/api/v1/articles/${id}`, data),

  deleteArticle: (id: string) =>
    privateApiClient.delete<{ message: string }>(`/admin/articles/${id}`),

  // User Management
  getUsers: (token?: string) =>
    privateApiClient.get<{ data: { items: AdminUser[] } }>('/api/v1/users', token ? { headers: { Authorization: `Bearer ${token}` } } : {}),

  createUser: (data: Partial<AdminUser> & { password?: string }) =>
    privateApiClient.post<AdminUser>('/api/v1/users', data),

  updateUser: (id: string, data: Partial<AdminUser> & { password?: string }) =>
    privateApiClient.put<AdminUser>(`/api/v1/users/${id}`, data),

  updateUserRole: (id: string, role: string) =>
    privateApiClient.patch<AdminUser>(`/admin/users/${id}`, { role }),

  deleteUser: (id: string) =>
    privateApiClient.delete<{ message: string }>(`/api/v1/users/${id}`),

  // Order Management
  getOrders: (params?: { status?: string; page?: number }, token?: string) =>
    privateApiClient.get<{ data: { items: Order[] } }>('/api/v1/orders', {
      params: params as Record<string, string | number>,
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {})
    }),

  updateOrderStatus: (id: string, status: Order['status']) =>
    privateApiClient.patch<Order>(`/admin/orders/${id}`, { status }),

  getUserOrders: (userId: string) =>
    privateApiClient.get<Order[]>(`/admin/users/${userId}/orders`),

  getUserCart: (userId: string) =>
    privateApiClient.get<any>(`/admin/users/${userId}/cart`),

  // Upload Management
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return privateApiClient.post<{
      data: {
        url: string
      }
    }>('/api/v1/uploads/image', formData)
  },
}
