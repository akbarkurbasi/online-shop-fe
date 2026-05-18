'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  ArrowLeft,
  Loader2,
  ImagePlus,
  X as XIcon,
  Clock,
  Star,
  UploadCloud,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import dynamic from 'next/dynamic'
const RichTextEditor = dynamic(
  () => import('@/components/ui/rich-text-editor').then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full bg-secondary animate-pulse rounded-md border border-border flex items-center justify-center text-muted-foreground text-[10px] font-mono uppercase tracking-[0.3em]">
        Loading Editor…
      </div>
    ),
  }
)
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import type { Article } from '@/lib/types'
import { cn } from '@/lib/utils'

const articleSchema = z.object({
  title: z.string().min(3, 'Title is required (min 3 chars)'),
  description: z.string().min(10, 'Description is required (min 10 chars)'),
  content: z.string().min(10, 'Content is required'),
  image: z.string().optional(),
  author: z.string().min(2, 'Author name is required'),
  category: z.string().min(2, 'Category is required'),
  readTime: z.number().min(1, 'Read time must be at least 1 min'),
  excerpt: z.string().optional(),
  featured: z.boolean().default(false),
})

type ArticleFormValues = z.infer<typeof articleSchema>

interface ArticleFormProps {
  initialData?: Article
  articleId?: string
}

function SectionCard({
  index,
  label,
  heading,
  children,
}: {
  index: string
  label: string
  heading: string
  children: React.ReactNode
}) {
  return (
    <section className="border border-border rounded-md bg-background p-6 md:p-8 space-y-6">
      <div className="space-y-2 border-b border-border pb-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
          / {index} — {label}
        </p>
        <h2 className="text-2xl italic font-black uppercase tracking-tighter">{heading}</h2>
      </div>
      {children}
    </section>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
      / {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-destructive">{message}</p>
  )
}

function formatDateShort(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const year = date.getFullYear()
  return `${day} / ${month} / ${year}`
}

export function ArticleForm({ initialData, articleId }: ArticleFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image || null)
  const [isDragging, setIsDragging] = useState(false)
  const isEditing = !!initialData

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      image: '',
      author: 'Admin',
      category: 'Fashion',
      readTime: 5,
      excerpt: '',
      featured: false,
    },
  })

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        description: initialData.description || '',
        content: initialData.content || '',
        image: initialData.image || '',
        author: initialData.author || 'Admin',
        category: initialData.category || 'Fashion',
        readTime: initialData.readTime || 5,
        excerpt: initialData.excerpt || '',
        featured: initialData.featured || false,
      })
    }
  }, [initialData, reset])

  // Live preview values
  const watched = useWatch({ control })

  const acceptFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please drop an image file')
      return
    }
    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) acceptFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) acceptFile(file)
  }, [])

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const onSubmit = async (data: ArticleFormValues) => {
    try {
      setIsLoading(true)
      let finalImageUrl = data.image

      if (!data.image && !selectedFile) {
        toast.error('Please add a cover image')
        setIsLoading(false)
        return
      }

      if (selectedFile) {
        setIsUploading(true)
        try {
          const res = await adminService.uploadImage(selectedFile)
          finalImageUrl = res.data.url
        } catch (uploadError) {
          console.error('Upload failed:', uploadError)
          toast.error('Failed to upload image. Article not saved.')
          setIsLoading(false)
          setIsUploading(false)
          return
        } finally {
          setIsUploading(false)
        }
      }

      const payload = { ...data, image: finalImageUrl }

      if (isEditing && articleId) {
        await adminService.updateArticle(articleId, payload)
        toast.success('Article updated')
      } else {
        await adminService.createArticle(payload)
        toast.success('Article created')
      }

      router.push('/admin/articles')
      router.refresh()
    } catch (error) {
      console.error('Error saving article:', error)
      toast.error(isEditing ? 'Failed to update article' : 'Failed to create article')
    } finally {
      setIsLoading(false)
    }
  }

  const today = new Date()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-24 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-start gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            asChild
            className="h-10 w-10 rounded-md mt-1"
          >
            <Link href="/admin/articles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
              / 03 — Journal {isEditing ? '· Edit' : '· New'}
            </p>
            <h1 className="text-3xl md:text-4xl italic font-black uppercase tracking-tighter">
              {isEditing ? 'Edit Article' : 'New Article'}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT — Form sections */}
        <div className="lg:col-span-8 space-y-6">
          {/* 01 — Basic Info */}
          <SectionCard index="01" label="Basics" heading="Basic Info">
            <div className="space-y-5">
              <div className="space-y-2">
                <FieldLabel required>Title</FieldLabel>
                <Input
                  {...register('title')}
                  placeholder="e.g. 5 Wardrobe Essentials for Fall"
                  className="h-12 rounded-md text-lg italic font-black uppercase tracking-tighter"
                />
                <FieldError message={errors.title?.message} />
              </div>

              <div className="space-y-2">
                <FieldLabel required>Short Description</FieldLabel>
                <Textarea
                  {...register('description')}
                  placeholder="A brief summary of what the article is about…"
                  className="min-h-[100px] resize-none rounded-md text-sm"
                />
                <FieldError message={errors.description?.message} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel required>Author</FieldLabel>
                  <Input
                    {...register('author')}
                    placeholder="Admin"
                    className="h-11 rounded-md text-sm"
                  />
                  <FieldError message={errors.author?.message} />
                </div>
                <div className="space-y-2">
                  <FieldLabel required>Category</FieldLabel>
                  <Input
                    {...register('category')}
                    placeholder="Fashion"
                    className="h-11 rounded-md text-sm"
                  />
                  <FieldError message={errors.category?.message} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FieldLabel required>Read Time · Minutes</FieldLabel>
                  <Input
                    type="number"
                    min="1"
                    {...register('readTime', { valueAsNumber: true })}
                    className="h-11 rounded-md text-sm font-mono"
                  />
                  <FieldError message={errors.readTime?.message} />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Excerpt · Optional</FieldLabel>
                  <Input
                    {...register('excerpt')}
                    placeholder="Short engaging snippet…"
                    className="h-11 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 02 — Cover Image */}
          <SectionCard index="02" label="Media" heading="Cover Image">
            {previewUrl ? (
              <div className="relative group">
                <div className="aspect-[16/9] rounded-md overflow-hidden border border-border bg-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById('article-image-upload')?.click()}
                    className="h-9 px-3 inline-flex items-center gap-2 bg-background/95 backdrop-blur border border-border rounded-md text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-colors"
                  >
                    <ImagePlus className="h-3 w-3" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="h-9 w-9 inline-flex items-center justify-center bg-background/95 backdrop-blur border border-destructive text-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    aria-label="Remove image"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-md">
                    <Loader2 className="h-5 w-5 text-background animate-spin mb-2" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background">Uploading…</p>
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('article-image-upload')?.click()}
                className={cn(
                  'aspect-[16/9] rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors',
                  isDragging
                    ? 'border-foreground bg-secondary'
                    : 'border-border bg-secondary/40 hover:border-foreground/40 hover:bg-secondary'
                )}
              >
                <div className="h-12 w-12 border border-border rounded-md flex items-center justify-center">
                  <UploadCloud className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-foreground">
                  Drop an image or click to upload
                </p>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  16:9 recommended · JPG / PNG / WEBP
                </p>
              </div>
            )}
            <input
              type="file"
              id="article-image-upload"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </SectionCard>

          {/* 03 — Content */}
          <SectionCard index="03" label="Content" heading="Article Body">
            <div className="space-y-2">
              <FieldLabel required>Full Content</FieldLabel>
              <div className="rounded-md overflow-hidden border border-border focus-within:border-foreground transition-colors">
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Start writing the article here…"
                    />
                  )}
                />
              </div>
              <FieldError message={errors.content?.message} />
            </div>
          </SectionCard>

          {/* 04 — Settings */}
          <SectionCard index="04" label="Settings" heading="Visibility">
            <div className="flex items-center justify-between border border-border rounded-md p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-tight">Featured Article</p>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1">
                  Highlight on the journal homepage
                </p>
              </div>
              <Controller
                control={control}
                name="featured"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </SectionCard>
        </div>

        {/* RIGHT — Live Preview (sticky on lg+) */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-28 space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              / Live Preview
            </p>
            <div className="border border-border rounded-md overflow-hidden bg-background">
              <div className="relative aspect-[4/3] bg-secondary">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                      / No Cover Yet
                    </p>
                  </div>
                )}
                {watched.category && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 bg-foreground/85 backdrop-blur text-background text-[9px] font-mono uppercase tracking-[0.2em] rounded-md">
                    / {watched.category}
                  </span>
                )}
                {watched.featured && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-accent-foreground text-[9px] font-mono uppercase tracking-[0.2em] rounded-md">
                    <Star className="h-2.5 w-2.5" />
                    Featured
                  </span>
                )}
              </div>
              <div className="p-5 space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  {formatDateShort(today)}
                </p>
                <h3 className="text-base italic font-black uppercase tracking-tighter line-clamp-2 leading-snug">
                  {watched.title || 'Article title appears here'}
                </h3>
                {(watched.excerpt || watched.description) && (
                  <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                    {watched.excerpt || watched.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 border border-foreground flex items-center justify-center text-[9px] font-mono uppercase tracking-tight rounded-sm">
                      {(watched.author || 'A').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                      {watched.author || 'Author'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {watched.readTime || 0}m
                  </span>
                </div>
              </div>
            </div>

            {/* Spec panel */}
            <div className="border border-border rounded-md bg-background divide-y divide-border">
              {[
                { label: 'Status', value: watched.featured ? 'Featured' : 'Standard', cobalt: watched.featured },
                { label: 'Category', value: watched.category || '—' },
                { label: 'Read Time', value: `${watched.readTime || 0} min` },
                { label: 'Created', value: isEditing ? 'Existing' : 'New Draft' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    / {row.label}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-mono uppercase tracking-[0.2em]',
                      row.cobalt ? 'text-accent' : 'text-foreground'
                    )}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky bottom save bar */}
      <div className="fixed bottom-0 inset-x-0 lg:left-72 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center gap-4">
          <p
            className={cn(
              'text-[10px] font-mono uppercase tracking-[0.3em] inline-flex items-center gap-2 transition-opacity',
              isDirty ? 'text-foreground opacity-100' : 'text-muted-foreground opacity-60'
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                isDirty ? 'bg-accent animate-pulse' : 'bg-muted-foreground'
              )}
            />
            {isDirty ? 'Unsaved Changes' : 'All Saved'}
          </p>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            asChild
            className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
          >
            <Link href="/admin/articles">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-md h-11 px-6 text-[11px] font-mono uppercase tracking-[0.3em] min-w-[180px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>{isEditing ? 'Save Changes →' : 'Publish Article →'}</>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
