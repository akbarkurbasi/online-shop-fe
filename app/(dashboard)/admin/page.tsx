import { adminService, AdminStats } from '@/services/adminService'
import { DashboardClient } from '@/components/admin/dashboard-client'
import { cookies } from 'next/headers'
import type { Product, Article, Order } from '@/lib/types'

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let stats: AdminStats | null = null
  let products: Product[] = []
  let articles: Article[] = []
  let recentOrders: Order[] = []

  try {
    const [statsData, productsData, articlesData, ordersData] = await Promise.all([
      adminService.getStats(token),
      adminService.getProducts({}, token),
      adminService.getArticles(token),
      adminService.getOrders({ page: 1 }, token)
    ])

    stats = statsData
    products = (productsData.data.items || []) as Product[]
    articles = (articlesData.data.items || []) as Article[]
    recentOrders = (ordersData.data.items || []) as Order[]
  } catch (error) {
    console.error('Error fetching dashboard data on server:', error)
  }

  return (
    <DashboardClient
      stats={stats}
      products={products}
      articles={articles}
      recentOrders={recentOrders}
    />
  )
}
