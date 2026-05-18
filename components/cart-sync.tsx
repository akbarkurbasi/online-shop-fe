'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/store/cart'
import { useAuth } from '@/lib/store/auth'

export function CartSync() {
  const { fetchCart } = useCart()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCart()
    }
  }, [user, fetchCart])

  return null
}
