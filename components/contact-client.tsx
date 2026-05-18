'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export function ContactClient() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), credentials: 'include' // Mengirim name, email, subject, message
      });

      const result = await response.json();

      if (!response.ok) {
        // Jika server kirim error (misal: validasi gagal)
        throw new Error(result.message || 'Failed to send message');
      }

      // Jika berhasil
      toast.success('Message sent! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      
    } catch (error: any) {
      // Jika koneksi gagal atau server error
      toast.error(error.message || 'Something went wrong');
      console.error("Feedback Error:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <section className="border-b border-border bg-foreground text-background py-24 md:py-32">
        <div className="container mx-auto px-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background/40 mb-6">/ Contact</p>
          <h1 className="text-5xl md:text-7xl italic font-black uppercase tracking-tighter mb-6 leading-[0.95]">Get In Touch</h1>
          <p className="text-base md:text-lg text-background/70 max-w-xl">
            We&apos;d love to hear from you. Our team is ready to help.
          </p>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-heading font-bold text-secondary-foreground mb-4">Get in Touch</h2>
              <p className="text-lg text-muted-foreground">
                Whether you have a question about a piece in the collection, need help with sizing or an order, or just want to talk style, our team is ready to help.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-secondary-foreground">Our Headquarters</h3>
                  <p className="text-muted-foreground">123 Atelier Lane, Garment District, CA 90210</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-secondary-foreground">Email Support</h3>
                  <p className="text-muted-foreground">hello@volt.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-secondary-foreground">Phone</h3>
                  <p className="text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>
            </div>

            <div className="h-64 rounded-2xl overflow-hidden shadow-md border border-border">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d10200!2d-118.243683!3d34.052235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2c75ddc27da13%3A0xe22fdf6f254608f4!2sLos%20Angeles%2C%20CA!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-xl border border-border">
            <h3 className="text-2xl font-heading font-bold text-secondary-foreground mb-6">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-semibold">Name</label>
                  <input required id="name" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold">Email</label>
                  <input required type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-semibold">Subject</label>
                <input required id="subject" name="subject" value={formData.subject} onChange={handleChange} className="w-full p-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Order Inquiry" />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-semibold">Message</label>
                <textarea required id="message" name="message" value={formData.message} onChange={handleChange} rows={5} className="w-full p-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary" placeholder="How can we help?" />
              </div>
              <Button type="submit" size="lg" className="w-full">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
      <CartDrawer />
    </div>
  )
}
