'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CategoryForm } from '@/components/admin/category-form'
import type { Category } from '@/lib/types'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getCategories()
      setCategories(data.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAdd = () => {
    setEditingCategory(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? This might affect products in this category.')) return

    try {
      await adminService.deleteCategory(id)
      toast.success('Category deleted')
      fetchCategories()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  const onFormSuccess = () => {
    setIsDialogOpen(false)
    fetchCategories()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">Loading categories…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end pb-6 border-b border-border">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Catalog</p>
          <h2 className="text-2xl italic font-black uppercase tracking-tighter">Categories</h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mt-2">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} total
          </p>
        </div>
        <Button onClick={handleAdd} className="rounded-md h-11 px-5 text-[11px] font-mono uppercase tracking-[0.3em]">
          <Plus className="h-3.5 w-3.5 mr-2" />
          New Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="border border-border rounded-md p-12 text-left">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">/ Empty</p>
          <p className="text-2xl italic font-black uppercase tracking-tighter mb-2">No Categories</p>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Create your first category to start classifying products.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-md overflow-hidden">
          {categories.map((category, i) => (
            <div
              key={category.id}
              className="bg-background p-5 group hover:bg-secondary/40 transition-colors"
            >
              <div className="flex justify-between items-start mb-6">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                  / {String(i + 1).padStart(2, '0')}
                </p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(category)} className="h-8 w-8 rounded-md">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-md text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <h3 className="text-lg italic font-black uppercase tracking-tighter mb-1">{category.name}</h3>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                slug · {category.slug}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-md border border-border">
          <DialogHeader>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
              / {editingCategory ? 'Edit' : 'New'}
            </p>
            <DialogTitle className="text-2xl italic font-black uppercase tracking-tighter">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              {editingCategory
                ? 'Rename this category or change its image.'
                : 'Create a new category that products can be assigned to.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <CategoryForm
              initialData={editingCategory || undefined}
              isEditing={!!editingCategory}
              onSuccess={onFormSuccess}
              onCancel={() => setIsDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
