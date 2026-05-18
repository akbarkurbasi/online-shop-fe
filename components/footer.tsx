import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-foreground text-background mt-16">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="h-2.5 w-2.5 bg-accent rounded-sm shrink-0" aria-hidden="true" />
              <h3 className="text-3xl italic font-black uppercase tracking-tighter">Volt</h3>
            </div>
            <p className="text-xs text-background/60 leading-relaxed">
              Sportswear and lifestyle essentials, made to move with you.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/50 mb-5">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/shop?category=tees" className="text-sm font-medium hover:text-accent transition">
                  Tees
                </Link>
              </li>
              <li>
                <Link href="/shop?category=hoodies" className="text-sm font-medium hover:text-accent transition">
                  Hoodies
                </Link>
              </li>
              <li>
                <Link href="/shop?category=track-pants" className="text-sm font-medium hover:text-accent transition">
                  Track Pants
                </Link>
              </li>
              <li>
                <Link href="/shop?category=outerwear" className="text-sm font-medium hover:text-accent transition">
                  Outerwear
                </Link>
              </li>
              <li>
                <Link href="/shop?category=sneakers" className="text-sm font-medium hover:text-accent transition">
                  Sneakers
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/50 mb-5">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm font-medium hover:text-accent transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm font-medium hover:text-accent transition">
                  Journal
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm font-medium hover:text-accent transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm font-medium hover:text-accent transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/50 mb-5">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm font-medium hover:text-accent transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm font-medium hover:text-accent transition">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm font-medium hover:text-accent transition">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/" className="text-sm font-medium hover:text-accent transition">
                  Returns
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/50">
            &copy; {currentYear} Volt — All rights reserved
          </p>
          <div className="flex gap-6">
            <Link href="/" className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/50 hover:text-accent transition">
              Twitter
            </Link>
            <Link href="/" className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/50 hover:text-accent transition">
              Instagram
            </Link>
            <Link href="/" className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/50 hover:text-accent transition">
              Facebook
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
