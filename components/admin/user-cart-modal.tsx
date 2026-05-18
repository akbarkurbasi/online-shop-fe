'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { adminService } from '@/services/adminService'
import { CartBackend } from '@/services/cartService'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'

interface UserCartModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
  userName: string | null
}

export function UserCartModal({ isOpen, onClose, userId, userName }: UserCartModalProps) {
  const [cart, setCart] = useState<CartBackend | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserCart()
    } else {
      setCart(null)
    }
  }, [isOpen, userId])

  const fetchUserCart = async () => {
    if (!userId) return
    setIsLoading(true)
    try {
      const data = await adminService.getUserCart(userId)
      setCart(data)
    } catch (error) {
      console.error('Error fetching user cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subtotal = cart?.items.reduce((acc, item) => acc + (item.product?.price || 0) * item.quantity, 0) || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden border border-border rounded-md">
        <DialogHeader className="px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
                / Cart · {userName}
              </p>
              <DialogTitle className="text-2xl italic font-black uppercase tracking-tighter">
                Customer Bag
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
                Items currently in {userName ? `${userName}’s` : 'this customer’s'} bag.
              </DialogDescription>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center border border-border hover:bg-foreground hover:text-background hover:border-foreground transition-colors rounded-md shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Loading cart…</p>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="border border-border rounded-md p-12 text-left">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Empty</p>
              <p className="text-2xl italic font-black uppercase tracking-tighter mb-2">No Items</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                This customer hasn&apos;t added anything to their bag yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <div className="relative h-20 w-20 rounded-md overflow-hidden border border-border bg-secondary shrink-0">
                    {item.product?.image && (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                      / {item.product?.category}
                    </p>
                    <h4 className="text-xs italic font-black uppercase tracking-tighter line-clamp-1 mb-2">
                      {item.product?.name}
                    </h4>

                    {item.selected_variants && item.selected_variants.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {item.selected_variants.map((v: any, idx: number) => (
                          <span
                            key={idx}
                            className="border border-border px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em] rounded-sm"
                          >
                            {v.type} · {v.value}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                        Qty · {item.quantity}
                      </p>
                      <p className="text-sm italic font-black tracking-tighter">
                        {formatPrice((item.product?.price || 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="px-6 py-5 border-t border-border flex justify-between items-end">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">/ Estimated Total</p>
              <p className="text-2xl italic font-black tracking-tighter text-accent">{formatPrice(subtotal)}</p>
            </div>
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
