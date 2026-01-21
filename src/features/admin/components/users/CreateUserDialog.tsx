'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CreateUserDialogProps, CreateUserData } from '@/features/admin/types/user'

export function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isCreating
}: CreateUserDialogProps) {
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    fullName: '',
    role: 'vendedor'
  })

  const handleSubmit = async () => {
    await onSubmit(formData)
    // Reset form on success
    setFormData({
      email: '',
      password: '',
      fullName: '',
      role: 'vendedor'
    })
  }

  const handleClose = () => {
    if (!isCreating) {
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: 'vendedor'
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <DialogHeader>
            <DialogTitle className="text-[#fafafa] text-xl">Nuevo Usuario</DialogTitle>
            <DialogDescription className="text-[#888888]">
              Completa los datos para crear una cuenta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isCreating}
                className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
                autoFocus
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                Nombre Completo *
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={isCreating}
                className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                Contraseña Temporal *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isCreating}
                className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                Rol
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'vendedor' })}
                disabled={isCreating}
              >
                <SelectTrigger className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#262626] border-[#3a3a38] text-[#fafafa]">
                  <SelectItem value="vendedor" className="focus:bg-[#3a3a38] focus:text-[#fafafa]">
                    Vendedor
                  </SelectItem>
                  <SelectItem value="admin" className="focus:bg-[#3a3a38] focus:text-[#fafafa]">
                    Administrador
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] disabled:opacity-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating}
              className="bg-[#d97757] text-white hover:bg-[#d97757]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              {isCreating ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
