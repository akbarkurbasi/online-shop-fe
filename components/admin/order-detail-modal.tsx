'use client'

import { Package, Truck, User, Phone, Mail, X, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatPrice, cn } from '@/lib/utils'
import { STATUS_STYLES, STATUS_FALLBACK_STYLE } from '@/lib/order-status'
import Image from 'next/image'
import type { Order } from '@/lib/types'

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

export function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-2rem)] sm:max-w-3xl max-h-[90vh] p-0 gap-0 border border-border rounded-md flex flex-col overflow-hidden"
      >
        <DialogHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-border flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3 truncate">
                / Order · #{order.id.slice(-8).toUpperCase()}
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <DialogTitle className="text-2xl italic font-black uppercase tracking-tighter">
                  Order Detail
                </DialogTitle>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-1 border rounded-md text-[10px] font-mono uppercase tracking-[0.2em]',
                    STATUS_STYLES[order.status] || STATUS_FALLBACK_STYLE
                  )}
                >
                  <span className="w-1 h-1 rounded-full bg-current" />
                  {order.status}
                </span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Placed {new Date(order.created_at).toLocaleString()}
              </p>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
                Items, totals, shipping, and status for order #{order.id.slice(-8).toUpperCase()}.
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

        <div className="px-5 sm:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10 flex-1 overflow-y-auto custom-scrollbar">
          {/* Customer & Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <User className="h-3 w-3" />
                / Customer
              </p>
              <div className="border border-border rounded-md p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-bold uppercase tracking-tight">{order.customer_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-mono">{order.customer_email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-mono">{order.customer_phone}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <Truck className="h-3 w-3" />
                / Shipping
              </p>
              <div className="border border-border rounded-md p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">/ Address</p>
                  <p className="text-xs font-bold uppercase tracking-tight">{order.customer_address}</p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1">
                    {order.city}, {order.state} {order.zip_code}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">/ Payment</p>
                  <p className="text-xs font-bold uppercase tracking-tight">Xendit</p>
                </div>
                {order.payment_url && (
                  <a
                    href={order.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2.5 border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-colors rounded-md group"
                  >
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em]">View Checkout</span>
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
              <Package className="h-3 w-3" />
              / Items · {order.items?.length || 0}
            </p>
            <div className="border border-border rounded-md overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="bg-secondary border-b border-border">
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Product</th>
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground text-center">Qty</th>
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground text-right">Price</th>
                    <th className="px-5 py-3 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-md overflow-hidden border border-border bg-secondary shrink-0">
                            {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs italic font-black uppercase tracking-tighter line-clamp-1">{item.name}</p>
                            {item.selectedVariants && item.selectedVariants.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {item.selectedVariants.map((v, i) => (
                                  <span
                                    key={i}
                                    className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground border border-border px-1.5 py-0.5 rounded-sm"
                                  >
                                    {v.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-center">{item.quantity}</td>
                      <td className="px-5 py-4 text-xs font-mono text-right">{formatPrice(item.price)}</td>
                      <td className="px-5 py-4 text-sm italic font-black tracking-tighter text-right">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-secondary border-t border-border">
                  <tr>
                    <td colSpan={3} className="px-5 py-5 text-right text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                      / Grand Total
                    </td>
                    <td className="px-5 py-5 text-right text-2xl italic font-black tracking-tighter text-accent">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
