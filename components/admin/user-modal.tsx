'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { adminService, AdminUser } from '@/services/adminService'

const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.string().min(1, 'Role is required'),
})

type UserFormValues = z.infer<typeof userSchema>

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user?: AdminUser | null
}

export function UserModal({ isOpen, onClose, onSuccess, user }: UserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!user

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'customer',
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      })
    } else {
      reset({
        name: '',
        email: '',
        password: '',
        role: 'customer',
      })
    }
  }, [user, reset, isOpen])

  const onSubmit = async (data: UserFormValues) => {
    try {
      setIsLoading(true)
      if (isEditing && user) {
        await adminService.updateUser(user.id, data)
        toast.success('Customer updated')
      } else {
        if (!data.password) {
          toast.error('Password is required for new customers')
          return
        }
        await adminService.createUser(data)
        toast.success('Customer created')
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast.error(error.message || 'Failed to save customer')
    } finally {
      setIsLoading(false)
    }
  }

  const roleValue = watch('role')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] rounded-md border border-border">
        <DialogHeader>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground mb-2">
            / {isEditing ? 'Edit' : 'New'}
          </p>
          <DialogTitle className="text-2xl italic font-black uppercase tracking-tighter">
            {isEditing ? 'Edit Customer' : 'New Customer'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
            {isEditing
              ? 'Update this customer’s details. Leave the password blank to keep it unchanged.'
              : 'Create a new customer account with their contact details and role.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              / Full Name
            </label>
            <Input
              id="name"
              placeholder="John Doe"
              className="h-11 rounded-md text-sm"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              / Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              className="h-11 rounded-md text-sm"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              / {isEditing ? 'New Password · Leave blank to keep current' : 'Password'}
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-11 rounded-md text-sm"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              / Role
            </label>
            <Select value={roleValue} onValueChange={(val) => setValue('role', val)}>
              <SelectTrigger className="h-11 rounded-md text-sm">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-destructive">{errors.role.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : isEditing ? (
                'Save Changes →'
              ) : (
                'Create Customer →'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
