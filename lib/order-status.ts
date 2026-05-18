import type { Order } from '@/lib/types'

// Border + text classes per order status. Each status gets its own hue so the
// badge is scannable at a glance. Dark-mode variants keep contrast on dark bg.
export const STATUS_STYLES: Record<Order['status'], string> = {
  pending: 'border-amber-500 text-amber-600 dark:text-amber-400',
  paid: 'border-violet-500 text-violet-600 dark:text-violet-400',
  shipped: 'border-sky-500 text-sky-600 dark:text-sky-400',
  delivered: 'border-emerald-500 text-emerald-600 dark:text-emerald-400',
  failed: 'border-red-500 text-red-600 dark:text-red-400',
  expired: 'border-orange-400 text-orange-500 dark:text-orange-400',
  cancelled: 'border-zinc-400 text-zinc-500 dark:text-zinc-400',
}

export const STATUS_FALLBACK_STYLE = 'border-border text-muted-foreground'

export function getStatusStyle(status: string | undefined): string {
  if (!status) return STATUS_FALLBACK_STYLE
  return STATUS_STYLES[status as Order['status']] ?? STATUS_FALLBACK_STYLE
}
