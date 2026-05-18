'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Save } from 'lucide-react'
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
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import type { Category } from '@/lib/types'

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormProps {
  initialData?: Category
  isEditing?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export function CategoryForm({ initialData, isEditing = false, onSuccess, onCancel }: CategoryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData ? {
      name: initialData.name,
      slug: initialData.slug,
    } : {
      name: '',
      slug: '',
    },
  })

  const onSubmit = async (values: CategoryFormValues) => {
    setIsLoading(true)
    try {
      if (isEditing && initialData) {
        await adminService.updateCategory(initialData.id, values)
        toast.success('Category updated')
      } else {
        await adminService.createCategory(values)
        toast.success('Category created')
      }
      if (onSuccess) {
        onSuccess()
      }
      router.refresh()
    } catch (error) {
      toast.error('Failed to save category')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                / Category Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. T-Shirts"
                  className="h-11 rounded-md text-sm"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    if (!isEditing) {
                      form.setValue('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                    }
                  }}
                />
              </FormControl>
              <FormMessage className="text-[10px] font-mono uppercase tracking-[0.2em]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                / URL Slug
              </FormLabel>
              <FormControl>
                <Input placeholder="t-shirts" className="h-11 rounded-md text-sm font-mono" {...field} />
              </FormControl>
              <FormMessage className="text-[10px] font-mono uppercase tracking-[0.2em]" />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 border-t border-border pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-md h-11 px-6 text-[11px] font-mono uppercase tracking-[0.3em] min-w-[140px]"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
            {isEditing ? 'Save Changes →' : 'Create →'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
