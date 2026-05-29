'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { productService } from '@/services/productService'
import type { Product } from '@/lib/types'
import { useAuth } from '@/lib/store/auth'
import { cn, formatPrice } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: Product[]
}

const QUICK_PROMPTS = [
  'Recommend some premium jackets',
  'What featured shirts do you have?',
  'Suggest activewear or sports apparel',
  'Any unique styling recommendations?',
]

const parseInlineMarkdown = (text: string): React.ReactNode[] => {
  // Regex to split by bold (**text** or __text__) and italic (*text* or _text_)
  const regex = /(\*\*.*?\*\*|__.*?__|__.*?__|\*.*?\*|_.*?_)/g
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={index} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>
    }
    return part
  })
}

const renderMarkdown = (text: string) => {
  const lines = text.replace(/\r/g, '').split('\n')
  return lines.map((line, i) => {
    const trimmed = line.trim()
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ')
    const isNumbered = /^\d+\.\s/.test(trimmed)

    let cleanLine = trimmed
    if (isBullet) {
      cleanLine = trimmed.slice(2)
    } else if (isNumbered) {
      cleanLine = trimmed.replace(/^\d+\.\s/, '')
    }

    const content = parseInlineMarkdown(cleanLine)

    if (isBullet) {
      return (
        <li key={i} className="list-disc list-inside ml-2 my-1 pl-1 text-[11px] leading-relaxed">
          {content}
        </li>
      )
    }

    if (isNumbered) {
      return (
        <li key={i} className="list-decimal list-inside ml-2 my-1 pl-1 text-[11px] leading-relaxed">
          {content}
        </li>
      )
    }

    return (
      <p key={i} className={cn("text-[11px] leading-relaxed", i > 0 && "mt-1.5")}>
        {content}
      </p>
    )
  })
}

export function ChatbotWidget() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi there! I am Volt AI, your premium personal shopper. Looking for something special from our catalog today?',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessageId = `msg-${Date.now()}`
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await productService.queryChatbot(text)
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response.response,
        products: response.source_products || [],
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error('Chatbot API error:', err)
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'I encountered an unexpected issue finding recommendations. Please try asking in a different way or explore our catalog directly!',
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductClick = (productId: string) => {
    if (user) {
      const userIdNum = parseInt(user.id, 10)
      if (!isNaN(userIdNum)) {
        productService.trackInteraction(userIdNum, productId, 'click').catch(console.error)
      }
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Box */}
      {isOpen && (
        <div className="mb-4 w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-8rem)] bg-background/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-foreground text-background flex items-center justify-center relative overflow-hidden">
                <Bot className="h-5 w-5" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent rounded-full border border-background" />
              </div>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] font-black flex items-center gap-1.5">
                  Volt AI <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
                </h3>
                <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">chat to our assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-md hover:bg-secondary flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 max-w-[85%] animate-in fade-in duration-200',
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-md bg-secondary border border-border/50 flex-shrink-0 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-foreground" />
                  </div>
                )}
                
                <div className="space-y-3">
                  <div
                    className={cn(
                      'p-3.5 text-xs leading-relaxed rounded-xl font-medium text-left',
                      msg.role === 'user'
                        ? 'bg-foreground text-background rounded-tr-none'
                        : 'bg-secondary/40 border border-border/50 text-foreground rounded-tl-none'
                    )}
                  >
                    {renderMarkdown(msg.content)}
                  </div>

                  {/* Recommendation Card List */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-accent">
                        / RECOMMEND PRODUCT ({msg.products.length})
                      </p>
                      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory scrollbar-none">
                        {msg.products.map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.id}`}
                            onClick={() => handleProductClick(product.id)}
                            className="flex-shrink-0 w-[180px] bg-secondary/20 border border-border hover:border-accent/40 rounded-lg overflow-hidden transition-all snap-start flex flex-col group"
                          >
                            <div className="relative aspect-[4/5] bg-secondary/40">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                sizes="180px"
                              />
                              {product.rating > 0 && (
                                <span className="absolute top-1.5 right-1.5 text-[8px] font-mono bg-background/90 px-1 py-0.5 rounded border border-border">
                                  ★ {product.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <div className="p-2.5 flex-1 flex flex-col bg-background/40">
                              <h4 className="text-[10px] font-bold uppercase tracking-tight line-clamp-1 group-hover:text-accent transition-colors">
                                {product.name}
                              </h4>
                              <p className="text-[9px] text-muted-foreground uppercase font-mono tracking-widest mt-0.5">
                                {product.category}
                              </p>
                              <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                                <span className="text-[10px] font-extrabold tracking-tight">
                                  {formatPrice(product.price)}
                                </span>
                                <span className="text-[8px] font-mono uppercase text-muted-foreground group-hover:text-accent transition-colors flex items-center gap-0.5">
                                  View <ArrowRight className="h-2 w-2" />
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto items-center animate-pulse">
                <div className="h-7 w-7 rounded-md bg-secondary border border-border/50 flex-shrink-0 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-foreground" />
                </div>
                <div className="p-3 bg-secondary/20 border border-border/30 rounded-xl rounded-tl-none flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Searching catalog...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 pb-3 space-y-1.5">
              <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">
                / Try asking:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[9px] font-medium text-left px-2.5 py-1.5 bg-secondary/40 hover:bg-foreground hover:text-background border border-border rounded-lg transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="p-3 border-t border-border bg-secondary/10 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(inputValue)
              }}
              placeholder="Ask for custom stylist recommendations..."
              className="flex-1 bg-background border border-border/80 hover:border-foreground/30 focus:border-foreground/80 focus:ring-0 rounded-lg px-3 py-2 text-xs font-medium placeholder:text-muted-foreground outline-none transition-all"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="h-9 w-9 bg-foreground text-background disabled:bg-secondary disabled:text-muted-foreground rounded-lg flex items-center justify-center transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300',
          isOpen
            ? 'bg-secondary border border-border text-foreground hover:bg-secondary/80 hover:scale-95'
            : 'bg-foreground text-background hover:bg-foreground/90 hover:scale-105'
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  )
}
