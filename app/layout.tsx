import type { Metadata, Viewport } from 'next'
import { Outfit, Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import MotionProvider from '@/components/motion/MotionProvider'

const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: 'Volt - Premium Fashion & Apparel',
  description: 'Shop a curated collection of contemporary clothing, denim, knitwear, and accessories.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

import { CartSync } from '@/components/cart-sync'
import { AddedToBagNotification } from '@/components/added-to-bag-notification'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} ${geistMono.variable} font-sans antialiased`}>
        <MotionProvider >
        <ThemeProvider>
          <CartSync />
          {children}
          <AddedToBagNotification />
          <Toaster />
        </ThemeProvider>
        </MotionProvider>
        <Analytics />
      </body>
    </html>
  )
}
