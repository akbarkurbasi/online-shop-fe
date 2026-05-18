'use client'

import { useAuth } from '@/lib/store/auth'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User, ShoppingBag, Heart, Settings, LogOut } from 'lucide-react'
import { orderService } from '@/services/orderService'

export function AccountClient() {
  const router = useRouter()
  const { user, logout, hasHydrated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    // Wait for Zustand persist to rehydrate from localStorage before deciding —
    // otherwise the initial `user = null` triggers a redirect on every refresh.
    if (!hasHydrated) return
    if (!user) {
      router.push('/auth/login')
    } else {
      const fetchOrders = async () => {
        try {
          const data = await orderService.myOrders()
          setOrders(data.data.items)
        } catch (error) {
          console.error('Failed to fetch orders:', error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchOrders()
    }
  }, [user, hasHydrated, router])

  if (!hasHydrated || isLoading || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Account</h1>
            <p className="text-muted-foreground">Manage your profile and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Profile Card */}
              <div className="bg-card rounded-lg border border-border p-6 sticky top-24">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mb-4">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{user.name}</h2>
                  <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                </div>

                <div className="border-t border-border pt-6 space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/account/orders">
                      <ShoppingBag className="w-4 h-4" />
                      My Orders
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/account/wishlist">
                      <Heart className="w-4 h-4" />
                      Wishlist
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" asChild>
                    <Link href="/account/settings">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 mt-4"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Information */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">
                      Full Name
                    </label>
                    <p className="text-foreground font-medium">{user.name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">
                      Email Address
                    </label>
                    <p className="text-foreground font-medium">{user.email}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">
                      Member Since
                    </label>
                    <p className="text-foreground font-medium">{formatDate(user.createdAt)}</p>
                  </div>

                  <Button variant="outline" className="mt-6" asChild>
                    <Link href="/account/settings">Edit Profile</Link>
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-lg border border-border p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{orders.length}</div>
                  <p className="text-sm text-muted-foreground">Orders Placed</p>
                </div>
                <div className="bg-card rounded-lg border border-border p-6 text-center">
                  <div className="text-3xl font-bold text-primary mb-2">0</div>
                  <p className="text-sm text-muted-foreground">Wishlist Items</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-lg font-bold text-foreground mb-6">Recent Activity</h3>

                <div className="flex flex-col items-center justify-center py-12">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground text-center">
                    No purchases yet. Start shopping to see your orders here.
                  </p>
                  <Button className="mt-6" asChild>
                    <Link href="/shop">Browse Products</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
