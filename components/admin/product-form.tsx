'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Loader2,
  Plus,
  Trash2,
  Star,
  ArrowLeft,
  X as XIcon,
  ImagePlus,
  UploadCloud,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import type { Product, Category } from '@/lib/types'
import { formatPrice, cn } from '@/lib/utils'

const VARIANT_TYPES = [
  { value: 'size', label: 'Size' },
  { value: 'color', label: 'Color' },
  { value: 'material', label: 'Material' },
  { value: 'weight', label: 'Weight' },
]

const variantSchema = z.object({
  name: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  value: z.string().min(1, 'Required'),
  price: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().min(0, 'Price must be positive').nullable(),
  ),
  stock: z.coerce.number().int().min(0),
})

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  originalPrice: z.coerce.number().optional(),
  image: z.string().optional(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
  variants: z.array(variantSchema).default([]),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  initialData?: Product
  isEditing?: boolean
}

function SectionCard({
  index,
  label,
  heading,
  action,
  children,
}: {
  index: string
  label: string
  heading: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="border border-border rounded-md bg-background p-6 md:p-8 space-y-6">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
            / {index} — {label}
          </p>
          <h2 className="text-2xl italic font-black uppercase tracking-tighter">{heading}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function MonoLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
      / {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </span>
  )
}

function stockBucket(stock: number): 'in' | 'low' | 'out' {
  if (stock <= 0) return 'out'
  if (stock <= 5) return 'low'
  return 'in'
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image || null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isFetchingCategories, setIsFetchingCategories] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await adminService.getCategories()
        setCategories(data.data || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast.error('Failed to load categories')
      } finally {
        setIsFetchingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? ({
          ...initialData,
          category:
            typeof initialData.category === 'object' && initialData.category !== null
              ? (initialData.category as any).slug || (initialData.category as any).id
              : initialData.category || '',
          variants:
            initialData.variants?.map((v) => ({
              ...v,
              price: v.price ?? null,
              stock: v.stock ?? 0,
            })) || [],
        } as any)
      : {
          name: '',
          description: '',
          category: '',
          price: 0,
          originalPrice: undefined,
          image: '',
          stock: 0,
          inStock: true,
          featured: false,
          variants: [],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  })

  const watched = useWatch({ control: form.control })

  const onSubmit = async (values: ProductFormValues) => {
    setIsLoading(true)
    try {
      let finalImageUrl = values.image

      if (!values.image && !selectedFile) {
        toast.error('Please add a product image first')
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
          toast.error('Failed to upload image. Product not saved.')
          setIsLoading(false)
          setIsUploading(false)
          return
        } finally {
          setIsUploading(false)
        }
      }

      const payload = { ...values, image: finalImageUrl }

      if (isEditing && initialData) {
        await adminService.updateProduct(initialData.id, payload as any)
        toast.success('Product updated')
      } else {
        await adminService.createProduct(payload as any)
        toast.success('Product created')
      }
      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Failed to save product')
    } finally {
      setIsLoading(false)
    }
  }

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

  const previewStock = Number(watched.stock || 0)
  const previewStockState = stockBucket(previewStock)
  const previewCategoryName = categories.find((c) => c.slug === watched.category)?.name || watched.category || '—'
  const isDirty = form.formState.isDirty

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 pb-24 animate-in fade-in duration-500"
      >
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
              <Link href="/admin/products">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
                / 02 — Inventory {isEditing ? '· Edit' : '· New'}
              </p>
              <h1 className="text-3xl md:text-4xl italic font-black uppercase tracking-tighter">
                {isEditing ? 'Edit Product' : 'New Product'}
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
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel asChild>
                        <MonoLabel required>Product Name</MonoLabel>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. Performance Tee · Black"
                          className="h-12 rounded-md text-lg italic font-black uppercase tracking-tighter"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-mono uppercase tracking-[0.2em]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel asChild>
                        <MonoLabel required>Description</MonoLabel>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the fit, fabric, and details…"
                          className="min-h-[140px] resize-none rounded-md text-sm leading-relaxed"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-mono uppercase tracking-[0.2em]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel asChild>
                        <MonoLabel required>Category</MonoLabel>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isFetchingCategories}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-md text-sm">
                            <SelectValue placeholder={isFetchingCategories ? 'Loading…' : 'Select category'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.slug}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px] font-mono uppercase tracking-[0.2em]" />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>

            {/* 02 — Media */}
            <SectionCard index="02" label="Media" heading="Product Image">
              {previewUrl ? (
                <div className="relative group">
                  <div className="aspect-[4/3] rounded-md overflow-hidden border border-border bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Product preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('product-image-upload')?.click()}
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
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-background">
                        Uploading…
                      </p>
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
                  onClick={() => document.getElementById('product-image-upload')?.click()}
                  className={cn(
                    'aspect-[4/3] rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors',
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
                    4:3 or 4:5 recommended · JPG / PNG / WEBP
                  </p>
                </div>
              )}
              <input
                type="file"
                id="product-image-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </SectionCard>

            {/* 03 — Pricing & Inventory */}
            <SectionCard index="03" label="Pricing" heading="Pricing & Inventory">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel asChild>
                        <MonoLabel required>Price · IDR</MonoLabel>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="h-11 rounded-md text-sm font-mono"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-mono uppercase tracking-[0.2em]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="originalPrice"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel asChild>
                        <MonoLabel>Original Price · Optional</MonoLabel>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          placeholder="—"
                          className="h-11 rounded-md text-sm font-mono"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-mono uppercase tracking-[0.2em]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel asChild>
                        <MonoLabel required>Total Stock</MonoLabel>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="h-11 rounded-md text-sm font-mono"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] font-mono uppercase tracking-[0.2em]" />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>

            {/* 04 — Variants */}
            <SectionCard
              index="04"
              label="Options"
              heading="Variants"
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      name: '',
                      type: 'size',
                      value: '',
                      price: null,
                      stock: 0,
                    })
                  }
                  className="rounded-md h-10 px-4 text-[11px] font-mono uppercase tracking-[0.3em]"
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Add Variant
                </Button>
              }
            >
              {fields.length === 0 ? (
                <div className="border border-dashed border-border rounded-md p-10 text-left">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
                    / Empty
                  </p>
                  <p className="text-base italic font-black uppercase tracking-tighter mb-2">
                    No Variants Yet
                  </p>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                    Add a variant to track per-size or per-color stock independently.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border border-border rounded-md bg-background p-5 space-y-4 group hover:border-foreground/40 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                          / Variant {String(index + 1).padStart(2, '0')}
                        </p>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="h-8 w-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:border-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          aria-label="Remove variant"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name={`variants.${index}.type`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel asChild>
                                <MonoLabel required>Type</MonoLabel>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-10 rounded-md text-xs">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {VARIANT_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`variants.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel asChild>
                                <MonoLabel required>Label</MonoLabel>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g. Medium"
                                  className="h-10 rounded-md text-xs"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name={`variants.${index}.value`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel asChild>
                                <MonoLabel required>Value</MonoLabel>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="M / #000 / 250"
                                  className="h-10 rounded-md text-xs font-mono"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`variants.${index}.price`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel asChild>
                                <MonoLabel>Price · IDR (Optional)</MonoLabel>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  name={field.name}
                                  ref={field.ref}
                                  onBlur={field.onBlur}
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    field.onChange(v === '' ? null : v)
                                  }}
                                  placeholder="Auto · uses base price"
                                  className="h-10 rounded-md text-xs font-mono"
                                />
                              </FormControl>
                              <FormMessage className="text-[10px] font-mono uppercase tracking-[0.2em]" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`variants.${index}.stock`}
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel asChild>
                                <MonoLabel required>Stock</MonoLabel>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  className="h-10 rounded-md text-xs font-mono"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* 05 — Visibility */}
            <SectionCard index="05" label="Settings" heading="Visibility">
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="inStock"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between border border-border rounded-md p-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-tight">Available</p>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1">
                          Show this product in the storefront
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between border border-border rounded-md p-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-tight">Featured</p>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1">
                          Highlight on homepage and shop
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>
          </div>

          {/* RIGHT — Live Preview */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 space-y-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                / Live Preview
              </p>
              <div className="border border-border rounded-md overflow-hidden bg-background">
                <div className="relative aspect-[4/5] bg-secondary">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                        / No Image Yet
                      </p>
                    </div>
                  )}

                  <span className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-[0.2em] text-foreground bg-background/90 backdrop-blur px-2 py-1 rounded-md">
                    SKU · NEW
                  </span>

                  <span
                    className={cn(
                      'absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 border rounded-md text-[9px] font-mono uppercase tracking-[0.2em] bg-background/90 backdrop-blur',
                      previewStockState === 'out'
                        ? 'border-destructive text-destructive'
                        : previewStockState === 'low'
                          ? 'border-accent text-accent'
                          : 'border-border text-muted-foreground'
                    )}
                  >
                    <span className="w-1 h-1 rounded-full bg-current" />
                    {previewStockState === 'out' ? 'Out' : previewStockState === 'low' ? 'Low' : 'In Stock'}
                  </span>

                  {watched.featured && (
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 bg-accent text-accent-foreground text-[9px] font-mono uppercase tracking-[0.2em] rounded-md">
                      <Star className="h-2.5 w-2.5" />
                      Featured
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                    / {previewCategoryName}
                  </p>
                  <h3 className="text-base italic font-black uppercase tracking-tighter line-clamp-1">
                    {watched.name || 'Product name appears here'}
                  </h3>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-sm font-bold tracking-tight">{formatPrice(Number(watched.price || 0))}</p>
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                      {previewStock} in stock
                    </p>
                  </div>
                </div>
              </div>

              {/* Spec panel */}
              <div className="border border-border rounded-md bg-background divide-y divide-border">
                {[
                  { label: 'Category', value: previewCategoryName },
                  { label: 'Price', value: formatPrice(Number(watched.price || 0)) },
                  { label: 'Stock', value: `${previewStock} units` },
                  { label: 'Variants', value: `${(watched.variants || []).length}` },
                  {
                    label: 'Status',
                    value: !watched.inStock
                      ? 'Unavailable'
                      : watched.featured
                        ? 'Featured'
                        : 'Standard',
                    cobalt: !!watched.featured,
                    destructive: !watched.inStock,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                      / {row.label}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-mono uppercase tracking-[0.2em]',
                        row.cobalt && 'text-accent',
                        row.destructive && 'text-destructive',
                        !row.cobalt && !row.destructive && 'text-foreground'
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
              <Link href="/admin/products">Cancel</Link>
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
                <>{isEditing ? 'Save Changes →' : 'Publish Product →'}</>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
