'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Clock, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Header } from '@/components/header'
import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCart } from '@/lib/store/cart'
import { useUI } from '@/lib/store/ui'
import { useAuth } from '@/lib/store/auth'
import { orderService } from '@/services/orderService'
import { formatPrice, cn } from '@/lib/utils'

const SHIPPING_OPTIONS = {
  standard: { label: 'Standard', cost: 0, eta: '3–5 business days' },
  express: { label: 'Express', cost: 25000, eta: '1–2 business days' },
} as const

type ShippingMethod = keyof typeof SHIPPING_OPTIONS

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, 'Required'),
  email: z.string().trim().email('Enter a valid email'),
  phone: z.string().trim().min(8, 'Enter a valid phone number'),
  address: z.string().trim().min(5, 'Required'),
  city: z.string().trim().min(2, 'Required'),
  state: z.string().trim().min(2, 'Required'),
  zipCode: z.string().trim().min(3, 'Required'),
  shippingMethod: z.enum(['standard', 'express']),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export function CheckoutClient() {
  const { items, getTotalPrice, removeSelectedItems } = useCart()
  const { user } = useAuth()
  const selectedItems = useMemo(() => items.filter((i) => i.selected), [items])
  const { toggleCart } = useUI()

  const [isProcessing, setIsProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [popupBlocked, setPopupBlocked] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const [promoCode, setPromoCode] = useState('')
  const [promoState, setPromoState] = useState<'idle' | 'checking' | 'rejected'>('idle')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      customerName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      shippingMethod: 'standard',
    },
  })

  const shippingMethod = (watch('shippingMethod') as ShippingMethod) || 'standard'
  const shippingCost = SHIPPING_OPTIONS[shippingMethod].cost
  const subtotal = getTotalPrice()
  const finalTotal = subtotal + shippingCost

  const itemCount = selectedItems.length
  const formValues = watch()

  const onValid = () => {
    setServerError(null)
    setShowConfirm(true)
  }

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return
    setPromoState('checking')
    setTimeout(() => setPromoState('rejected'), 700)
  }

  const processOrder = async () => {
    setShowConfirm(false)
    setIsProcessing(true)
    setServerError(null)

    try {
      const { data: response } = await orderService.createOrder({
        customer_name: formValues.customerName,
        customer_email: formValues.email,
        customer_phone: formValues.phone,
        customer_address: formValues.address,
        city: formValues.city,
        state: formValues.state,
        zip_code: formValues.zipCode,
        items: selectedItems.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category,
          selectedVariants: item.selectedVariants,
          selected: item.selected,
        })),
        total: finalTotal,
      })

      // Track purchase interaction
      if (user && selectedItems.length > 0) {
        const userIdNum = parseInt(user.id, 10)
        if (!isNaN(userIdNum)) {
          const { productService } = await import('@/services/productService')
          selectedItems.forEach((item) => {
            productService.trackInteraction(userIdNum, item.product_id, 'purchase').catch(console.error)
          })
        }
      }

      const redirectUrl = response?.payment_url
      if (redirectUrl) {
        setPaymentUrl(redirectUrl)
        setOrderPlaced(true)
        removeSelectedItems()
        // window.open is best-effort — popup blockers can return null. We surface
        // a hint and the user can still launch payment via the visible button.
        const paymentTab = window.open(redirectUrl, '_blank', 'noopener,noreferrer')
        setPopupBlocked(!paymentTab)
        toast.success(
          paymentTab
            ? 'Order placed — payment opened in a new tab'
            : 'Order placed — open the payment from the page below'
        )
      } else {
        setServerError('Order created but no payment link was returned. Please contact support.')
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong placing your order.'
      setServerError(message)
      toast.error('Could not place order')
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Empty state · cart fully empty ────────────────────────────────────────
  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-24 flex flex-col items-center text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Empty</p>
          <h1 className="text-4xl italic font-black uppercase tracking-tighter mb-3">Your bag is empty</h1>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
            Add a piece from the latest drop before checking out.
          </p>
          <Button asChild className="h-12 px-8 rounded-md text-[11px] font-mono uppercase tracking-[0.3em]">
            <Link href="/shop">Browse Collection →</Link>
          </Button>
        </div>
        <Footer />
        <CartDrawer />
      </div>
    )
  }

  // ── Empty state · cart has items but nothing is selected ──────────────────
  if (selectedItems.length === 0 && !orderPlaced) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-24 flex flex-col items-center text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">/ Nothing Selected</p>
          <h1 className="text-4xl italic font-black uppercase tracking-tighter mb-3">No Items Selected</h1>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
            Open your bag and choose the items you want to check out.
          </p>
          <Button
            onClick={toggleCart}
            className="h-12 px-8 rounded-md text-[11px] font-mono uppercase tracking-[0.3em]"
          >
            Open Bag →
          </Button>
        </div>
        <Footer />
        <CartDrawer />
      </div>
    )
  }

  // ── Waiting for payment ────────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="text-center max-w-md w-full bg-card border border-border rounded-md p-10">
            <div className="h-14 w-14 border border-accent/40 bg-accent/5 rounded-md flex items-center justify-center mx-auto mb-6">
              <Clock className="h-7 w-7 text-accent" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-3">
              / Waiting for Payment
            </p>
            <h1 className="text-3xl italic font-black uppercase tracking-tighter mb-3">
              Waiting for Payment
            </h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              We&apos;ve opened your payment in a new tab. Complete the checkout there and your order status will update automatically. If the new tab didn&apos;t open or you closed it, use the button below to reopen the payment.
            </p>

            {popupBlocked && (
              <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 flex gap-3 text-destructive text-left">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] leading-relaxed">
                  Your browser blocked the new tab. Click below to open the payment manually.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                asChild
                className="w-full h-12 rounded-md text-[11px] font-mono uppercase tracking-[0.3em]"
                size="lg"
              >
                <a href={paymentUrl || '#'} target="_blank" rel="noopener noreferrer">
                  Reopen Payment →
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full h-12 rounded-md text-[11px] font-mono uppercase tracking-[0.3em]"
                size="lg"
              >
                <Link href="/shop">Back to Shop</Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // ── Main checkout ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="flex-1">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          {/* Top bar: back link + page heading */}
          <div className="mb-10 flex flex-col gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Shop
            </Link>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Checkout</p>
              <h1 className="text-4xl md:text-5xl italic font-black uppercase tracking-tighter">
                Complete your order
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit(onValid)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* ── Left column: form sections ────────────────────────────── */}
              <div className="lg:col-span-2 space-y-6">
                {serverError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 flex gap-3 text-destructive">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-mono uppercase tracking-[0.2em] leading-relaxed">
                      {serverError}
                    </p>
                  </div>
                )}

                {/* 01 — Contact */}
                <section className="bg-card border border-border rounded-md p-6 md:p-8">
                  <div className="mb-6">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ 01 Contact</p>
                    <h2 className="text-2xl italic font-black uppercase tracking-tighter">Who&apos;s ordering</h2>
                  </div>

                  <div className="space-y-5">
                    <FieldRow label="Full Name" error={errors.customerName?.message}>
                      <Input
                        {...register('customerName')}
                        placeholder="e.g. John Doe"
                        className={cn('h-12 rounded-md', errors.customerName && 'border-destructive')}
                      />
                    </FieldRow>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FieldRow label="Email Address" error={errors.email?.message}>
                        <Input
                          type="email"
                          {...register('email')}
                          placeholder="you@example.com"
                          className={cn('h-12 rounded-md', errors.email && 'border-destructive')}
                        />
                      </FieldRow>
                      <FieldRow label="Phone Number" error={errors.phone?.message}>
                        <Input
                          type="tel"
                          {...register('phone')}
                          placeholder="0812XXXXXXXX"
                          className={cn('h-12 rounded-md', errors.phone && 'border-destructive')}
                        />
                      </FieldRow>
                    </div>
                  </div>
                </section>

                {/* 02 — Shipping address */}
                <section className="bg-card border border-border rounded-md p-6 md:p-8">
                  <div className="mb-6">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ 02 Shipping Address</p>
                    <h2 className="text-2xl italic font-black uppercase tracking-tighter">Where to send it</h2>
                  </div>

                  <div className="space-y-5">
                    <FieldRow label="Address Line" error={errors.address?.message}>
                      <Input
                        {...register('address')}
                        placeholder="e.g. Jl. Sudirman No. 123"
                        className={cn('h-12 rounded-md', errors.address && 'border-destructive')}
                      />
                    </FieldRow>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                      <FieldRow label="City" error={errors.city?.message}>
                        <Input
                          {...register('city')}
                          placeholder="Jakarta"
                          className={cn('h-12 rounded-md', errors.city && 'border-destructive')}
                        />
                      </FieldRow>
                      <FieldRow label="Province / State" error={errors.state?.message}>
                        <Input
                          {...register('state')}
                          placeholder="DKI Jakarta"
                          className={cn('h-12 rounded-md', errors.state && 'border-destructive')}
                        />
                      </FieldRow>
                      <FieldRow
                        label="Zip Code"
                        error={errors.zipCode?.message}
                        className="col-span-2 md:col-span-1"
                      >
                        <Input
                          {...register('zipCode')}
                          placeholder="12345"
                          className={cn('h-12 rounded-md', errors.zipCode && 'border-destructive')}
                        />
                      </FieldRow>
                    </div>
                  </div>
                </section>

                {/* 03 — Shipping method */}
                <section className="bg-card border border-border rounded-md p-6 md:p-8">
                  <div className="mb-6">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ 03 Shipping Method</p>
                    <h2 className="text-2xl italic font-black uppercase tracking-tighter">How fast</h2>
                  </div>

                  <RadioGroup
                    value={shippingMethod}
                    onValueChange={(value) =>
                      setValue('shippingMethod', value as ShippingMethod, { shouldDirty: true })
                    }
                    className="gap-3"
                  >
                    {(['standard', 'express'] as ShippingMethod[]).map((key) => {
                      const opt = SHIPPING_OPTIONS[key]
                      const active = shippingMethod === key
                      return (
                        <label
                          key={key}
                          htmlFor={`ship-${key}`}
                          className={cn(
                            'flex items-center gap-4 border rounded-md px-5 py-4 cursor-pointer transition-colors',
                            active
                              ? 'border-foreground bg-secondary/50'
                              : 'border-border hover:border-foreground/60',
                          )}
                        >
                          <RadioGroupItem id={`ship-${key}`} value={key} />
                          <div className="flex-1 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-mono uppercase tracking-[0.2em] font-bold">
                                {opt.label}
                              </p>
                              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-1">
                                {opt.eta}
                              </p>
                            </div>
                            <p className="text-xs font-mono uppercase tracking-[0.2em] font-bold whitespace-nowrap">
                              {opt.cost === 0 ? 'Free' : formatPrice(opt.cost)}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                  </RadioGroup>
                </section>

                {/* Place order button (desktop visible; mobile shows below summary as well via sticky) */}
                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    size="lg"
                    className="w-full h-14 rounded-md text-[11px] font-mono uppercase tracking-[0.3em]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Placing order…
                      </>
                    ) : (
                      <>Place Order · {formatPrice(finalTotal)}</>
                    )}
                  </Button>
                  <p className="text-center text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    Encrypted via Xendit secure gateway
                  </p>
                </div>
              </div>

              {/* ── Right column: order summary ───────────────────────────── */}
              <aside className="lg:col-span-1">
                <div className="lg:sticky lg:top-24 space-y-4">
                  <div className="bg-card border border-border rounded-md p-6">
                    <div className="flex items-baseline justify-between mb-5">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                          / Order Summary
                        </p>
                        <h3 className="text-xl italic font-black uppercase tracking-tighter">
                          {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={toggleCart}
                        className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground hover:text-accent transition-colors"
                      >
                        Edit →
                      </button>
                    </div>

                    {/* Items */}
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar -mr-2 pr-2 divide-y divide-border">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                          <div className="relative w-14 h-16 bg-secondary border border-border rounded-md overflow-hidden flex-shrink-0">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">
                              / {item.category}
                            </p>
                            <p className="text-xs font-bold uppercase tracking-tight leading-snug line-clamp-2">
                              {item.name}
                            </p>

                            {item.selectedVariants && item.selectedVariants.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.selectedVariants.map((v, i) => {
                                  const isColor = v.type?.toLowerCase() === 'color'
                                  const label = isColor ? v.name : v.value || v.name
                                  return (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 border border-border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em]"
                                    >
                                      {isColor && /^#[0-9a-f]{3,8}$/i.test(v.value) && (
                                        <span
                                          aria-hidden="true"
                                          className="w-2 h-2 rounded-sm border border-border"
                                          style={{ backgroundColor: v.value }}
                                        />
                                      )}
                                      {label}
                                    </span>
                                  )
                                })}
                              </div>
                            )}

                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                                Qty × {item.quantity}
                              </span>
                              <span className="text-xs font-bold">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Promo · not a nested <form> — pressing Enter inside it would otherwise submit the outer checkout form */}
                    <div className="mt-5 pt-5 border-t border-dashed border-border space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                        / Promo Code
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value)
                            if (promoState !== 'idle') setPromoState('idle')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleApplyPromo()
                            }
                          }}
                          placeholder="Enter code"
                          className="h-11 rounded-md flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyPromo}
                          disabled={!promoCode.trim() || promoState === 'checking'}
                          className="h-11 px-4 rounded-md text-[10px] font-mono uppercase tracking-[0.3em]"
                        >
                          {promoState === 'checking' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                      {promoState === 'rejected' && (
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-destructive flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3" />
                          Code not recognised
                        </p>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="mt-5 pt-5 border-t border-dashed border-border space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.3em]">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.3em]">
                        <span className="text-muted-foreground">
                          Shipping · {SHIPPING_OPTIONS[shippingMethod].label}
                        </span>
                        <span className="text-foreground">
                          {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                        </span>
                      </div>

                      <div className="pt-4 mt-1 border-t border-border flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-1">/ Total</p>
                          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                            Inc. shipping
                          </p>
                        </div>
                        <span className="text-2xl italic font-black tracking-tighter text-accent">
                          {formatPrice(finalTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-md border border-border">
          <AlertDialogHeader>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Final review</p>
            <AlertDialogTitle className="text-2xl italic font-black uppercase tracking-tighter">
              Place order?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              You&apos;ll be redirected to our secure payment gateway to complete{' '}
              <span className="text-foreground font-bold">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>{' '}
              · Total{' '}
              <span className="text-foreground font-bold">{formatPrice(finalTotal)}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="rounded-md h-12 px-6 text-[11px] font-mono uppercase tracking-[0.3em]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={processOrder}
              className="rounded-md h-12 px-8 text-[11px] font-mono uppercase tracking-[0.3em]"
            >
              Place Order →
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
      <CartDrawer />
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────

function FieldRow({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-destructive text-[10px] font-mono uppercase tracking-[0.2em]">
          {error}
        </p>
      )}
    </div>
  )
}
