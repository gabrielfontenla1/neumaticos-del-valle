// Admin Branches Management Page - Excel-style Table
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, RefreshCw, Plus, Trash2, Edit2, Store, Phone, Mail, Clock, Settings, Building2, Copy, Check, Globe, Loader2, ChevronLeft, ChevronRight, Sparkles, CheckCircle2, AlertCircle, Sun, Moon, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'sonner'
import type { Branch, OpeningHours, DaySchedule, StructuredSchedule } from '@/types/branch'

// Exact colors from rapicompras darkColors theme
const colors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#3a3a38',
  input: '#262626',
  secondary: '#262626',
}

// Provincias de Argentina (ordenadas alfabéticamente)
const ARGENTINA_PROVINCES = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const

// Default structured schedule
const defaultStructuredSchedule: StructuredSchedule = {
  weekdays: {
    closed: false,
    morning: { from: '08:00', to: '12:30' },
    afternoon: { from: '16:00', to: '20:00' },
  },
  saturday: {
    closed: false,
    morning: { from: '08:30', to: '12:30' },
    afternoon: undefined,
  },
  sunday: {
    closed: true,
    morning: undefined,
    afternoon: undefined,
  },
}

// Convert structured schedule to string format for API
const scheduleToString = (day: DaySchedule): string => {
  if (day.closed) return 'Cerrado'
  const parts: string[] = []
  if (day.morning?.from && day.morning?.to) {
    parts.push(`${day.morning.from} - ${day.morning.to}`)
  }
  if (day.afternoon?.from && day.afternoon?.to) {
    parts.push(`${day.afternoon.from} - ${day.afternoon.to}`)
  }
  return parts.length > 0 ? parts.join(' y ') : 'Cerrado'
}

// Convert structured schedule to OpeningHours
const structuredToOpeningHours = (schedule: StructuredSchedule): OpeningHours => ({
  weekdays: scheduleToString(schedule.weekdays),
  saturday: scheduleToString(schedule.saturday),
  sunday: scheduleToString(schedule.sunday),
})

// Email validation regex
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone validation (only numbers, min 8 digits)
const isValidPhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '')
  return digitsOnly.length >= 8
}

// Field error interface
interface FieldErrors {
  name?: string
  address?: string
  city?: string
  province?: string
  phone?: string
  email?: string
  whatsapp?: string
}

const defaultOpeningHours: OpeningHours = {
  weekdays: '08:00 - 12:30 y 16:00 - 20:00',
  saturday: '08:30 - 12:30',
  sunday: 'Cerrado',
}

export default function SucursalesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [branchToDelete, setBranchToDelete] = useState<string | null>(null)
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [createStep, setCreateStep] = useState(0)
  const [stepError, setStepError] = useState<string | null>(null)
  const [newBranch, setNewBranch] = useState<Partial<Branch>>({
    name: '',
    address: '',
    city: '',
    province: '',
    phone: '',
    whatsapp: '',
    email: '',
    latitude: undefined,
    longitude: undefined,
    opening_hours: defaultOpeningHours,
    background_image_url: undefined,
    is_main: false,
    active: true,
  })
  const [schedule, setSchedule] = useState<StructuredSchedule>(defaultStructuredSchedule)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/branches')
      const data = await response.json()

      if (response.ok) {
        setBranches(data.branches || [])
      } else {
        setError('Error al cargar sucursales')
        toast.error('Error al cargar sucursales')
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
      setError('Error al cargar sucursales')
      toast.error('Error al cargar sucursales')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadImage = async (file: File, branchId?: string) => {
    try {
      setUploadingImage(true)

      const formData = new FormData()
      formData.append('file', file)
      if (branchId) {
        formData.append('branchId', branchId)
      }

      const response = await fetch('/api/admin/branches/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok && data.url) {
        return { success: true, url: data.url }
      } else {
        return { success: false, error: data.error || 'Error al subir imagen' }
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      return { success: false, error: 'Error al subir imagen' }
    } finally {
      setUploadingImage(false)
    }
  }

  const openEditDialog = (branch: Branch) => {
    setBranchToEdit({ ...branch })
    setIsEditDialogOpen(true)
  }

  const handleEditBranch = async () => {
    try {
      if (!branchToEdit) return

      // Validación de campos requeridos
      if (!branchToEdit.name || branchToEdit.name.trim() === '') {
        toast.error('El nombre es requerido')
        return
      }

      if (!branchToEdit.address || branchToEdit.address.trim() === '') {
        toast.error('La dirección es requerida')
        return
      }

      if (!branchToEdit.city || branchToEdit.city.trim() === '') {
        toast.error('La ciudad es requerida')
        return
      }

      if (!branchToEdit.province || branchToEdit.province.trim() === '') {
        toast.error('La provincia es requerida')
        return
      }

      if (!branchToEdit.phone || branchToEdit.phone.trim() === '') {
        toast.error('El teléfono es requerido')
        return
      }

      setUpdating(true)

      const response = await fetch('/api/admin/branches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branchToEdit),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Sucursal actualizada correctamente')
        setIsEditDialogOpen(false)
        setBranchToEdit(null)
        fetchBranches()
      } else {
        toast.error(data.error || 'Error al actualizar sucursal')
      }
    } catch (error) {
      console.error('Error updating branch:', error)
      toast.error('Error al actualizar sucursal')
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateBranch = async () => {
    try {
      // Validación de campos requeridos
      if (!newBranch.name || newBranch.name.trim() === '') {
        toast.error('El nombre es requerido')
        return
      }

      if (!newBranch.address || newBranch.address.trim() === '') {
        toast.error('La dirección es requerida')
        return
      }

      if (!newBranch.city || newBranch.city.trim() === '') {
        toast.error('La ciudad es requerida')
        return
      }

      if (!newBranch.province || newBranch.province.trim() === '') {
        toast.error('La provincia es requerida')
        return
      }

      if (!newBranch.phone || newBranch.phone.trim() === '') {
        toast.error('El teléfono es requerido')
        return
      }

      if (!newBranch.email || newBranch.email.trim() === '') {
        toast.error('El email es requerido')
        return
      }

      setCreating(true)

      const response = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBranch),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Sucursal creada correctamente')
        setIsCreateDialogOpen(false)
        setNewBranch({
          name: '',
          address: '',
          city: '',
          province: '',
          phone: '',
          whatsapp: '',
          email: '',
          latitude: undefined,
          longitude: undefined,
          opening_hours: defaultOpeningHours,
          background_image_url: undefined,
          is_main: false,
          active: true,
        })
        fetchBranches()
      } else {
        toast.error(data.error || 'Error al crear sucursal')
      }
    } catch (error) {
      console.error('Error creating branch:', error)
      toast.error('Error al crear sucursal')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteBranch = async () => {
    try {
      if (!branchToDelete) return

      setDeleting(true)

      const response = await fetch(`/api/admin/branches?id=${branchToDelete}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Sucursal eliminada correctamente')
        setIsDeleteDialogOpen(false)
        setBranchToDelete(null)
        fetchBranches()
      } else {
        toast.error(data.error || 'Error al eliminar sucursal')
      }
    } catch (error) {
      console.error('Error deleting branch:', error)
      toast.error('Error al eliminar sucursal')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (branchId: string) => {
    setBranchToDelete(branchId)
    setIsDeleteDialogOpen(true)
  }

  const copyIdToClipboard = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id)
      setCopiedId(true)
      toast.success('ID copiado al portapapeles')
      setTimeout(() => setCopiedId(false), 2000)
    } catch {
      toast.error('Error al copiar')
    }
  }

  const openCreateDialog = () => {
    setNewBranch({
      name: '',
      address: '',
      city: '',
      province: '',
      phone: '',
      whatsapp: '',
      email: '',
      latitude: undefined,
      longitude: undefined,
      opening_hours: defaultOpeningHours,
      background_image_url: undefined,
      is_main: false,
      active: true,
    })
    setCreateStep(0)
    setStepError(null)
    setFieldErrors({})
    setSchedule(defaultStructuredSchedule)
    setIsCreateDialogOpen(true)
  }

  // Stepper configuration
  const CREATE_STEPS = [
    { id: 0, title: 'Información', description: 'Datos básicos de la sucursal', icon: Building2 },
    { id: 1, title: 'Contacto', description: 'Teléfono, email y WhatsApp', icon: Phone },
    { id: 2, title: 'Horarios', description: 'Días y horas de atención', icon: Clock },
    { id: 3, title: 'Configuración', description: 'Opciones adicionales', icon: Settings },
  ]

  const validateCreateStep = (step: number): boolean => {
    setStepError(null)
    const errors: FieldErrors = {}

    switch (step) {
      case 0:
        if (!newBranch.name?.trim()) {
          errors.name = 'El nombre es requerido'
        } else if (newBranch.name.trim().length < 3) {
          errors.name = 'El nombre debe tener al menos 3 caracteres'
        }
        if (!newBranch.address?.trim()) {
          errors.address = 'La dirección es requerida'
        } else if (newBranch.address.trim().length < 5) {
          errors.address = 'La dirección debe tener al menos 5 caracteres'
        }
        if (!newBranch.city?.trim()) {
          errors.city = 'La ciudad es requerida'
        }
        if (!newBranch.province?.trim()) {
          errors.province = 'La provincia es requerida'
        }

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors)
          setStepError('Por favor completa los campos requeridos')
          return false
        }
        setFieldErrors({})
        return true

      case 1:
        if (!newBranch.phone?.trim()) {
          errors.phone = 'El teléfono es requerido'
        } else if (!isValidPhone(newBranch.phone)) {
          errors.phone = 'El teléfono debe tener al menos 8 dígitos'
        }
        if (!newBranch.email?.trim()) {
          errors.email = 'El email es requerido'
        } else if (!isValidEmail(newBranch.email)) {
          errors.email = 'El formato de email no es válido'
        }
        if (newBranch.whatsapp?.trim() && !isValidPhone(newBranch.whatsapp)) {
          errors.whatsapp = 'El WhatsApp debe tener al menos 8 dígitos'
        }

        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors)
          setStepError('Por favor corrige los errores')
          return false
        }
        setFieldErrors({})
        return true

      case 2:
        // Update opening_hours from structured schedule
        setNewBranch({
          ...newBranch,
          opening_hours: structuredToOpeningHours(schedule)
        })
        return true

      case 3:
        return true

      default:
        return true
    }
  }

  const handleNextStep = () => {
    if (validateCreateStep(createStep)) {
      if (createStep < CREATE_STEPS.length - 1) {
        setCreateStep(createStep + 1)
      }
    }
  }

  const handlePrevStep = () => {
    if (createStep > 0) {
      setStepError(null)
      setCreateStep(createStep - 1)
    }
  }

  if (loading && branches.length === 0) {
    return (
      <main className="p-6 space-y-6 min-h-screen">
        {/* Header Card Skeleton */}
        <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-[#d97757]/20 border border-[#d97757]/30 animate-pulse">
                  <div className="w-8 h-8 bg-[#d97757]/40 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-7 w-56 bg-[#3a3a38] rounded animate-pulse" />
                  <div className="h-4 w-72 bg-[#3a3a38]/60 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-28 bg-[#3a3a38] rounded-md animate-pulse" />
                <div className="h-10 w-36 bg-[#d97757]/30 rounded-md animate-pulse" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Table Card Skeleton */}
        <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {/* Table Header */}
              <div className="grid grid-cols-7 gap-4 p-4 border-b border-[#3a3a38]">
                {['Sucursal', 'Dirección', 'Contacto', 'Horarios', 'Principal', 'Estado', 'Acciones'].map((_, i) => (
                  <div key={i} className="h-4 bg-[#3a3a38]/60 rounded animate-pulse" />
                ))}
              </div>

              {/* Table Rows */}
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-7 gap-4 p-4 border-b border-[#3a3a38]/50"
                  style={{ animationDelay: `${rowIndex * 100}ms` }}
                >
                  {/* Sucursal */}
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-[#3a3a38] rounded animate-pulse" />
                    <div className="h-3 w-24 bg-[#3a3a38]/40 rounded animate-pulse" />
                  </div>
                  {/* Dirección */}
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-[#3a3a38] rounded animate-pulse" />
                    <div className="h-3 w-28 bg-[#3a3a38]/40 rounded animate-pulse" />
                  </div>
                  {/* Contacto */}
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-[#3a3a38] rounded animate-pulse" />
                    <div className="h-3 w-32 bg-[#3a3a38]/40 rounded animate-pulse" />
                  </div>
                  {/* Horarios */}
                  <div className="space-y-1">
                    <div className="h-3 w-36 bg-[#3a3a38] rounded animate-pulse" />
                    <div className="h-3 w-28 bg-[#3a3a38]/40 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-[#3a3a38]/40 rounded animate-pulse" />
                  </div>
                  {/* Principal */}
                  <div className="flex justify-center">
                    <div className="h-6 w-6 bg-[#3a3a38] rounded-full animate-pulse" />
                  </div>
                  {/* Estado */}
                  <div className="flex justify-center">
                    <div className="h-6 w-16 bg-[#3a3a38] rounded-full animate-pulse" />
                  </div>
                  {/* Acciones */}
                  <div className="flex justify-center gap-2">
                    <div className="h-8 w-8 bg-[#3a3a38] rounded animate-pulse" />
                    <div className="h-8 w-8 bg-[#3a3a38] rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-3 text-[#888888]">
          <Loader2 className="w-5 h-5 animate-spin text-[#d97757]" />
          <span className="text-sm">Cargando sucursales...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 space-y-6 min-h-screen">
      {/* Header Card */}
      <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#d97757]/20 border border-[#d97757]/30">
                <Store className="w-8 h-8 text-[#d97757]" />
              </div>
              <div>
                <CardTitle className="text-2xl text-[#fafafa]">Gestión de Sucursales</CardTitle>
                <CardDescription className="text-[#888888]">
                  Administra las sucursales de la empresa - {branches.length} sucursales totales
                </CardDescription>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={fetchBranches}
                disabled={loading}
                variant="outline"
                className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recargar
              </Button>
              <Button
                onClick={openCreateDialog}
                className="bg-[#d97757] text-white hover:bg-[#d97757]/90 transition-colors shadow-lg shadow-[#d97757]/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Sucursal
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Table Card */}
      <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#3a3a38] hover:bg-[#30302e]/50">
                  <TableHead className="text-[#a1a1aa] font-semibold">Sucursal</TableHead>
                  <TableHead className="text-[#a1a1aa] font-semibold">Dirección</TableHead>
                  <TableHead className="text-[#a1a1aa] font-semibold">Contacto</TableHead>
                  <TableHead className="text-[#a1a1aa] font-semibold">Horarios</TableHead>
                  <TableHead className="text-[#a1a1aa] font-semibold text-center">Principal</TableHead>
                  <TableHead className="text-[#a1a1aa] font-semibold text-center">Estado</TableHead>
                  <TableHead className="text-[#a1a1aa] font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow
                    key={branch.id}
                    onClick={() => openEditDialog(branch)}
                    className="border-[#3a3a38] hover:bg-[#30302e]/70 cursor-pointer transition-colors"
                  >
                    <TableCell className="text-[#fafafa]">
                      <div>
                        <div className="font-medium">{branch.name}</div>
                        <div className="text-xs text-[#888888] font-mono">{branch.id}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#fafafa]">
                      <div>
                        <div className="text-sm">{branch.address}</div>
                        <div className="text-xs text-[#888888]">{branch.city}, {branch.province}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#fafafa]">
                      <div className="text-sm">
                        <div>📞 {branch.phone}</div>
                        {branch.whatsapp && <div>💬 {branch.whatsapp}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#fafafa]">
                      <div className="text-xs">
                        <div>L-V: {branch.opening_hours.weekdays}</div>
                        <div>Sáb: {branch.opening_hours.saturday}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {branch.is_main && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#d97757]/20 text-[#d97757]">
                          Principal
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          branch.active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {branch.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(branch)
                          }}
                          className="text-[#d97757] hover:text-[#d97757] hover:bg-[#d97757]/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteDialog(branch.id)
                          }}
                          className="text-red-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog - Stepper Version */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateStep(0)
          setStepError(null)
        }
        setIsCreateDialogOpen(open)
      }}>
        <DialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] max-w-2xl p-0 max-h-[90vh] flex flex-col">
          {/* Header with Progress */}
          <div className="bg-gradient-to-r from-[#262624] to-[#30302e] p-6 border-b border-[#3a3a38] shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <DialogTitle className="text-xl font-bold text-[#fafafa]">
                  Nueva Sucursal
                </DialogTitle>
                <DialogDescription className="text-[#888888] mt-1">
                  {CREATE_STEPS[createStep].description}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 bg-[#30302e] px-3 py-1.5 rounded-full border border-[#3a3a38]">
                <span className="text-sm font-medium text-[#d97757]">{createStep + 1}</span>
                <span className="text-sm text-[#888888]">de {CREATE_STEPS.length}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-[#3a3a38] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#d97757] to-[#e89578]"
                initial={{ width: 0 }}
                animate={{ width: `${((createStep + 1) / CREATE_STEPS.length) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {CREATE_STEPS.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = index < createStep
                const isCurrent = index === createStep
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-[#22c55e] text-white'
                          : isCurrent
                          ? 'bg-[#d97757] text-white ring-4 ring-[#d97757]/20'
                          : 'bg-[#3a3a38] text-[#888888]'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-[#d97757]' : 'text-[#888888]'}`}>
                      {step.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6 min-h-[280px] flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={createStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Error Message */}
                {stepError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-red-400 text-sm">{stepError}</p>
                  </motion.div>
                )}

                {/* Step 0: Información Básica */}
                {createStep === 0 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name" className="text-[#fafafa] font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#d97757]" />
                        Nombre de la Sucursal *
                      </Label>
                      <Input
                        id="new-name"
                        placeholder="ej: Sucursal Catamarca Centro"
                        value={newBranch.name}
                        onChange={(e) => {
                          setNewBranch({ ...newBranch, name: e.target.value })
                          if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined })
                        }}
                        className={`bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] h-12 focus:border-[#d97757] focus:ring-[#d97757]/20 ${
                          fieldErrors.name ? 'border-red-500' : 'border-[#3a3a38]'
                        }`}
                        autoFocus
                      />
                      {fieldErrors.name && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-address" className="text-[#fafafa] font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#d97757]" />
                        Dirección *
                      </Label>
                      <Input
                        id="new-address"
                        placeholder="ej: Av. Belgrano 123"
                        value={newBranch.address}
                        onChange={(e) => {
                          setNewBranch({ ...newBranch, address: e.target.value })
                          if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: undefined })
                        }}
                        className={`bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] h-12 focus:border-[#d97757] ${
                          fieldErrors.address ? 'border-red-500' : 'border-[#3a3a38]'
                        }`}
                      />
                      {fieldErrors.address && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.address}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-city" className="text-[#fafafa] font-medium">
                          Ciudad *
                        </Label>
                        <Input
                          id="new-city"
                          placeholder="ej: San Fernando del Valle"
                          value={newBranch.city}
                          onChange={(e) => {
                            setNewBranch({ ...newBranch, city: e.target.value })
                            if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: undefined })
                          }}
                          className={`bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] h-12 focus:border-[#d97757] ${
                            fieldErrors.city ? 'border-red-500' : 'border-[#3a3a38]'
                          }`}
                        />
                        {fieldErrors.city && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.city}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-province" className="text-[#fafafa] font-medium">
                          Provincia *
                        </Label>
                        <Select
                          value={newBranch.province || ''}
                          onValueChange={(value) => {
                            setNewBranch({ ...newBranch, province: value })
                            if (fieldErrors.province) setFieldErrors({ ...fieldErrors, province: undefined })
                          }}
                        >
                          <SelectTrigger
                            className={`!bg-[#30302e] !text-[#fafafa] h-12 focus:ring-[#d97757] [&>svg]:!text-[#888888] [&>span]:!text-[#fafafa] ${
                              fieldErrors.province ? '!border-red-500' : '!border-[#3a3a38]'
                            } ${!newBranch.province ? '[&>span]:!text-[#666666]' : ''}`}
                          >
                            <SelectValue placeholder="Seleccionar provincia" />
                          </SelectTrigger>
                          <SelectContent className="!bg-[#262624] !border-[#3a3a38] max-h-[280px]">
                            {ARGENTINA_PROVINCES.map((province) => (
                              <SelectItem
                                key={province}
                                value={province}
                                className="!text-[#fafafa] !bg-transparent hover:!bg-[#3a3a38] focus:!bg-[#3a3a38] focus:!text-[#fafafa] cursor-pointer"
                              >
                                {province}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.province && (
                          <p className="text-red-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors.province}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Contacto */}
                {createStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-phone" className="text-[#fafafa] font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#d97757]" />
                        Teléfono *
                      </Label>
                      <Input
                        id="new-phone"
                        placeholder="ej: 3834123456"
                        value={newBranch.phone}
                        onChange={(e) => {
                          setNewBranch({ ...newBranch, phone: e.target.value })
                          if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: undefined })
                        }}
                        className={`bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] h-12 focus:border-[#d97757] ${
                          fieldErrors.phone ? 'border-red-500' : 'border-[#3a3a38]'
                        }`}
                        autoFocus
                      />
                      {fieldErrors.phone && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.phone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-email" className="text-[#fafafa] font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#d97757]" />
                        Email *
                      </Label>
                      <Input
                        id="new-email"
                        type="email"
                        placeholder="ej: sucursal@neumaticos.com"
                        value={newBranch.email || ''}
                        onChange={(e) => {
                          setNewBranch({ ...newBranch, email: e.target.value })
                          if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined })
                        }}
                        className={`bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] h-12 focus:border-[#d97757] ${
                          fieldErrors.email ? 'border-red-500' : 'border-[#3a3a38]'
                        }`}
                      />
                      {fieldErrors.email && (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-whatsapp" className="text-[#fafafa] font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#22c55e]" />
                        WhatsApp <span className="text-[#888888] text-xs">(opcional)</span>
                      </Label>
                      <Input
                        id="new-whatsapp"
                        placeholder="ej: 5493834123456"
                        value={newBranch.whatsapp || ''}
                        onChange={(e) => {
                          setNewBranch({ ...newBranch, whatsapp: e.target.value })
                          if (fieldErrors.whatsapp) setFieldErrors({ ...fieldErrors, whatsapp: undefined })
                        }}
                        className={`bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] h-12 focus:border-[#d97757] ${
                          fieldErrors.whatsapp ? 'border-red-500' : 'border-[#3a3a38]'
                        }`}
                      />
                      {fieldErrors.whatsapp ? (
                        <p className="text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.whatsapp}
                        </p>
                      ) : (
                        <p className="text-xs text-[#888888]">Incluye código de país (ej: 549 para Argentina)</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Horarios */}
                {createStep === 2 && (
                  <div className="space-y-4">
                    {/* Weekdays Schedule */}
                    <div className="p-4 bg-[#30302e] rounded-xl border border-[#3a3a38]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#d97757]/10">
                            <Calendar className="w-5 h-5 text-[#d97757]" />
                          </div>
                          <div>
                            <Label className="text-[#fafafa] font-medium">Lunes a Viernes</Label>
                            <p className="text-xs text-[#888888]">Horario de atención semanal</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#888888]">Cerrado</span>
                          <Switch
                            checked={schedule.weekdays.closed}
                            onCheckedChange={(checked) => setSchedule({
                              ...schedule,
                              weekdays: { ...schedule.weekdays, closed: checked }
                            })}
                          />
                        </div>
                      </div>

                      {!schedule.weekdays.closed && (
                        <div className="space-y-3">
                          {/* Morning Shift */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-24">
                              <Sun className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-[#fafafa]">Mañana</span>
                            </div>
                            <Input
                              type="time"
                              value={schedule.weekdays.morning?.from || ''}
                              onChange={(e) => setSchedule({
                                ...schedule,
                                weekdays: {
                                  ...schedule.weekdays,
                                  morning: { ...schedule.weekdays.morning!, from: e.target.value }
                                }
                              })}
                              className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] h-10 w-28"
                            />
                            <span className="text-[#888888]">a</span>
                            <Input
                              type="time"
                              value={schedule.weekdays.morning?.to || ''}
                              onChange={(e) => setSchedule({
                                ...schedule,
                                weekdays: {
                                  ...schedule.weekdays,
                                  morning: { ...schedule.weekdays.morning!, to: e.target.value }
                                }
                              })}
                              className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] h-10 w-28"
                            />
                          </div>

                          {/* Afternoon Shift */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-24">
                              <Moon className="w-4 h-4 text-blue-400" />
                              <span className="text-sm text-[#fafafa]">Tarde</span>
                            </div>
                            <Input
                              type="time"
                              value={schedule.weekdays.afternoon?.from || ''}
                              onChange={(e) => setSchedule({
                                ...schedule,
                                weekdays: {
                                  ...schedule.weekdays,
                                  afternoon: { from: e.target.value, to: schedule.weekdays.afternoon?.to || '' }
                                }
                              })}
                              className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] h-10 w-28"
                            />
                            <span className="text-[#888888]">a</span>
                            <Input
                              type="time"
                              value={schedule.weekdays.afternoon?.to || ''}
                              onChange={(e) => setSchedule({
                                ...schedule,
                                weekdays: {
                                  ...schedule.weekdays,
                                  afternoon: { from: schedule.weekdays.afternoon?.from || '', to: e.target.value }
                                }
                              })}
                              className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] h-10 w-28"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSchedule({
                                ...schedule,
                                weekdays: { ...schedule.weekdays, afternoon: undefined }
                              })}
                              className="text-[#888888] hover:text-red-400 h-8 px-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Saturday Schedule */}
                    <div className="p-4 bg-[#30302e] rounded-xl border border-[#3a3a38]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#22c55e]/10">
                            <Calendar className="w-5 h-5 text-[#22c55e]" />
                          </div>
                          <div>
                            <Label className="text-[#fafafa] font-medium">Sábado</Label>
                            <p className="text-xs text-[#888888]">Horario fin de semana</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#888888]">Cerrado</span>
                          <Switch
                            checked={schedule.saturday.closed}
                            onCheckedChange={(checked) => setSchedule({
                              ...schedule,
                              saturday: { ...schedule.saturday, closed: checked }
                            })}
                          />
                        </div>
                      </div>

                      {!schedule.saturday.closed && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-24">
                              <Sun className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-[#fafafa]">Mañana</span>
                            </div>
                            <Input
                              type="time"
                              value={schedule.saturday.morning?.from || ''}
                              onChange={(e) => setSchedule({
                                ...schedule,
                                saturday: {
                                  ...schedule.saturday,
                                  morning: { ...schedule.saturday.morning!, from: e.target.value }
                                }
                              })}
                              className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] h-10 w-28"
                            />
                            <span className="text-[#888888]">a</span>
                            <Input
                              type="time"
                              value={schedule.saturday.morning?.to || ''}
                              onChange={(e) => setSchedule({
                                ...schedule,
                                saturday: {
                                  ...schedule.saturday,
                                  morning: { ...schedule.saturday.morning!, to: e.target.value }
                                }
                              })}
                              className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] h-10 w-28"
                            />
                          </div>

                          {schedule.saturday.afternoon ? (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 w-24">
                                <Moon className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-[#fafafa]">Tarde</span>
                              </div>
                              <Input
                                type="time"
                                value={schedule.saturday.afternoon?.from || ''}
                                onChange={(e) => setSchedule({
                                  ...schedule,
                                  saturday: {
                                    ...schedule.saturday,
                                    afternoon: { from: e.target.value, to: schedule.saturday.afternoon?.to || '' }
                                  }
                                })}
                                className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] h-10 w-28"
                              />
                              <span className="text-[#888888]">a</span>
                              <Input
                                type="time"
                                value={schedule.saturday.afternoon?.to || ''}
                                onChange={(e) => setSchedule({
                                  ...schedule,
                                  saturday: {
                                    ...schedule.saturday,
                                    afternoon: { from: schedule.saturday.afternoon?.from || '', to: e.target.value }
                                  }
                                })}
                                className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] h-10 w-28"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSchedule({
                                  ...schedule,
                                  saturday: { ...schedule.saturday, afternoon: undefined }
                                })}
                                className="text-[#888888] hover:text-red-400 h-8 px-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSchedule({
                                ...schedule,
                                saturday: {
                                  ...schedule.saturday,
                                  afternoon: { from: '16:00', to: '20:00' }
                                }
                              })}
                              className="text-[#d97757] hover:text-[#d97757] hover:bg-[#d97757]/10"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Agregar turno tarde
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sunday Schedule */}
                    <div className="p-4 bg-[#30302e] rounded-xl border border-[#3a3a38]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-500/10">
                            <Calendar className="w-5 h-5 text-red-400" />
                          </div>
                          <div>
                            <Label className="text-[#fafafa] font-medium">Domingo</Label>
                            <p className="text-xs text-[#888888]">Generalmente cerrado</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#888888]">Cerrado</span>
                          <Switch
                            checked={schedule.sunday.closed}
                            onCheckedChange={(checked) => setSchedule({
                              ...schedule,
                              sunday: { ...schedule.sunday, closed: checked }
                            })}
                          />
                        </div>
                      </div>

                      {!schedule.sunday.closed && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-24">
                              <Sun className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-[#fafafa]">Mañana</span>
                            </div>
                            <Input
                              type="time"
                              value={schedule.sunday.morning?.from || '09:00'}
                              onChange={(e) => setSchedule({
                                ...schedule,
                                sunday: {
                                  ...schedule.sunday,
                                  morning: { from: e.target.value, to: schedule.sunday.morning?.to || '13:00' }
                                }
                              })}
                              className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] h-10 w-28"
                            />
                            <span className="text-[#888888]">a</span>
                            <Input
                              type="time"
                              value={schedule.sunday.morning?.to || '13:00'}
                              onChange={(e) => setSchedule({
                                ...schedule,
                                sunday: {
                                  ...schedule.sunday,
                                  morning: { from: schedule.sunday.morning?.from || '09:00', to: e.target.value }
                                }
                              })}
                              className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] h-10 w-28"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-[#262624] rounded-lg border border-[#3a3a38]">
                      <p className="text-xs text-[#888888] mb-2">Vista previa del horario:</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-[#fafafa]">
                          <span className="text-[#d97757] font-medium">Lun-Vie:</span> {scheduleToString(schedule.weekdays)}
                        </p>
                        <p className="text-[#fafafa]">
                          <span className="text-[#22c55e] font-medium">Sábado:</span> {scheduleToString(schedule.saturday)}
                        </p>
                        <p className="text-[#fafafa]">
                          <span className="text-red-400 font-medium">Domingo:</span> {scheduleToString(schedule.sunday)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Configuración */}
                {createStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#30302e] rounded-xl border border-[#3a3a38] hover:border-[#d97757]/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#d97757]/10">
                          <Store className="w-5 h-5 text-[#d97757]" />
                        </div>
                        <div>
                          <Label className="text-[#fafafa] font-medium">Sucursal Principal</Label>
                          <p className="text-xs text-[#888888]">
                            Marcar como sucursal principal de la empresa
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={newBranch.is_main}
                        onCheckedChange={(checked) => setNewBranch({ ...newBranch, is_main: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#30302e] rounded-xl border border-[#3a3a38] hover:border-[#22c55e]/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#22c55e]/10">
                          <Globe className="w-5 h-5 text-[#22c55e]" />
                        </div>
                        <div>
                          <Label className="text-[#fafafa] font-medium">Estado Activo</Label>
                          <p className="text-xs text-[#888888]">
                            Mostrar sucursal en la página pública
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={newBranch.active}
                        onCheckedChange={(checked) => setNewBranch({ ...newBranch, active: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#fafafa] font-medium flex items-center gap-2">
                        <Settings className="w-4 h-4 text-[#d97757]" />
                        Imagen de Fondo <span className="text-[#888888] text-xs">(opcional)</span>
                      </Label>
                      <ImageUpload
                        value={newBranch.background_image_url || undefined}
                        onChange={(url) => setNewBranch({ ...newBranch, background_image_url: url || undefined })}
                        onUpload={(file) => handleUploadImage(file)}
                        disabled={uploadingImage}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-latitude" className="text-[#888888] text-sm">
                          Latitud (opcional)
                        </Label>
                        <Input
                          id="new-latitude"
                          type="number"
                          step="any"
                          placeholder="ej: -28.4699"
                          value={newBranch.latitude || ''}
                          onChange={(e) =>
                            setNewBranch({ ...newBranch, latitude: e.target.value ? parseFloat(e.target.value) : undefined })
                          }
                          className="bg-[#30302e] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-longitude" className="text-[#888888] text-sm">
                          Longitud (opcional)
                        </Label>
                        <Input
                          id="new-longitude"
                          type="number"
                          step="any"
                          placeholder="ej: -65.7795"
                          value={newBranch.longitude || ''}
                          onChange={(e) =>
                            setNewBranch({ ...newBranch, longitude: e.target.value ? parseFloat(e.target.value) : undefined })
                          }
                          className="bg-[#30302e] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer with Navigation */}
          <div className="p-6 border-t border-[#3a3a38] bg-[#262624] shrink-0">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={createStep === 0 ? () => setIsCreateDialogOpen(false) : handlePrevStep}
                className="bg-transparent border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38]"
                disabled={creating}
              >
                {createStep === 0 ? (
                  'Cancelar'
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </>
                )}
              </Button>

              {createStep < CREATE_STEPS.length - 1 ? (
                <Button
                  onClick={handleNextStep}
                  className="bg-[#d97757] text-white hover:bg-[#d97757]/90 min-w-[120px]"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateBranch}
                  disabled={creating || uploadingImage}
                  className="bg-[#22c55e] text-white hover:bg-[#22c55e]/90 min-w-[140px]"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Crear Sucursal
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Sheet - Modern Tabbed Layout */}
      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl bg-[#262624] border-l border-[#3a3a38] p-0 flex flex-col"
        >
          {/* Visually hidden title for accessibility */}
          <SheetHeader className="sr-only">
            <SheetTitle>Editar Sucursal</SheetTitle>
            <SheetDescription>Formulario para editar los datos de la sucursal</SheetDescription>
          </SheetHeader>

          {branchToEdit && (
            <>
              {/* Header with Branch Info */}
              <div className="border-b border-[#3a3a38] p-6 bg-gradient-to-r from-[#262624] to-[#30302e]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[#d97757]/20 border border-[#d97757]/30">
                      <Building2 className="w-6 h-6 text-[#d97757]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#fafafa]">{branchToEdit.name}</h2>
                      <p className="text-sm text-[#888888] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {branchToEdit.city}, {branchToEdit.province}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {branchToEdit.is_main && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#d97757]/20 text-[#d97757]">
                        Principal
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      branchToEdit.active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {branchToEdit.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>

                {/* ID with copy button */}
                <div className="mt-4 flex items-center gap-2">
                  <code className="text-xs text-[#666] bg-[#1a1a18] px-2 py-1 rounded font-mono flex-1 truncate">
                    {branchToEdit.id}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyIdToClipboard(branchToEdit.id)}
                    className="h-7 w-7 p-0 text-[#888888] hover:text-[#fafafa] hover:bg-[#3a3a38]"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              {/* Tabs Content */}
              <Tabs defaultValue="location" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-full justify-start rounded-none border-b border-[#3a3a38] bg-transparent p-0 h-auto">
                  <TabsTrigger
                    value="location"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#d97757] data-[state=active]:bg-transparent data-[state=active]:text-[#d97757] text-[#888888] px-4 py-3 gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="hidden sm:inline">Ubicación</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="contact"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#d97757] data-[state=active]:bg-transparent data-[state=active]:text-[#d97757] text-[#888888] px-4 py-3 gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="hidden sm:inline">Contacto</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="hours"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#d97757] data-[state=active]:bg-transparent data-[state=active]:text-[#d97757] text-[#888888] px-4 py-3 gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="hidden sm:inline">Horarios</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#d97757] data-[state=active]:bg-transparent data-[state=active]:text-[#d97757] text-[#888888] px-4 py-3 gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Config</span>
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                  {/* Location Tab */}
                  <TabsContent value="location" className="m-0 p-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Nombre de la Sucursal *
                      </Label>
                      <Input
                        value={branchToEdit.name}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, name: e.target.value })}
                        placeholder="ej: Sucursal Catamarca Centro"
                        className="bg-[#1a1a18] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757] h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Dirección *
                      </Label>
                      <Input
                        value={branchToEdit.address}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, address: e.target.value })}
                        placeholder="ej: Av. Belgrano 938"
                        className="bg-[#1a1a18] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757] h-11"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                          Ciudad *
                        </Label>
                        <Input
                          value={branchToEdit.city}
                          onChange={(e) => setBranchToEdit({ ...branchToEdit, city: e.target.value })}
                          placeholder="ej: San Fernando"
                          className="bg-[#1a1a18] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757] h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                          Provincia *
                        </Label>
                        <Select
                          value={branchToEdit.province || ''}
                          onValueChange={(value) => setBranchToEdit({ ...branchToEdit, province: value })}
                        >
                          <SelectTrigger
                            className={`!bg-[#1a1a18] !border-[#3a3a38] !text-[#fafafa] h-11 focus:ring-[#d97757] [&>svg]:!text-[#888888] [&>span]:!text-[#fafafa] ${
                              !branchToEdit.province ? '[&>span]:!text-[#666666]' : ''
                            }`}
                          >
                            <SelectValue placeholder="Seleccionar provincia" />
                          </SelectTrigger>
                          <SelectContent className="!bg-[#262624] !border-[#3a3a38] max-h-[280px]">
                            {ARGENTINA_PROVINCES.map((province) => (
                              <SelectItem
                                key={province}
                                value={province}
                                className="!text-[#fafafa] !bg-transparent hover:!bg-[#3a3a38] focus:!bg-[#3a3a38] focus:!text-[#fafafa] cursor-pointer"
                              >
                                {province}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#3a3a38]">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-4 h-4 text-[#888888]" />
                        <span className="text-sm text-[#888888]">Coordenadas GPS (opcional)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                            Latitud
                          </Label>
                          <Input
                            type="number"
                            step="any"
                            value={branchToEdit.latitude || ''}
                            onChange={(e) => setBranchToEdit({ ...branchToEdit, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                            placeholder="-28.4699"
                            className="bg-[#1a1a18] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757] h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                            Longitud
                          </Label>
                          <Input
                            type="number"
                            step="any"
                            value={branchToEdit.longitude || ''}
                            onChange={(e) => setBranchToEdit({ ...branchToEdit, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                            placeholder="-65.7795"
                            className="bg-[#1a1a18] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757] h-11"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Contact Tab */}
                  <TabsContent value="contact" className="m-0 p-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        Teléfono *
                      </Label>
                      <Input
                        value={branchToEdit.phone}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, phone: e.target.value })}
                        placeholder="ej: 5493855854741"
                        className="bg-[#1a1a18] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757] h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide flex items-center gap-2">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </Label>
                      <Input
                        value={branchToEdit.whatsapp || ''}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, whatsapp: e.target.value })}
                        placeholder="ej: 5493855854741"
                        className="bg-[#1a1a18] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757] h-11"
                      />
                      <p className="text-xs text-[#666]">
                        Formato internacional sin + ni espacios
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        Email
                      </Label>
                      <Input
                        type="email"
                        value={branchToEdit.email || ''}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, email: e.target.value })}
                        placeholder="ej: catamarca@neumaticos.com"
                        className="bg-[#1a1a18] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757] h-11"
                      />
                      <p className="text-xs text-[#666]">
                        Se usará para notificaciones de turnos
                      </p>
                    </div>
                  </TabsContent>

                  {/* Hours Tab */}
                  <TabsContent value="hours" className="m-0 p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                          Lunes a Viernes
                        </Label>
                        <span className="text-xs text-[#666]">Horario completo</span>
                      </div>
                      <Input
                        value={branchToEdit.opening_hours.weekdays}
                        onChange={(e) => setBranchToEdit({
                          ...branchToEdit,
                          opening_hours: { ...branchToEdit.opening_hours, weekdays: e.target.value },
                        })}
                        placeholder="ej: 08:30 - 19:00"
                        className="bg-[#1a1a18] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757] h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Sábados
                      </Label>
                      <Input
                        value={branchToEdit.opening_hours.saturday}
                        onChange={(e) => setBranchToEdit({
                          ...branchToEdit,
                          opening_hours: { ...branchToEdit.opening_hours, saturday: e.target.value },
                        })}
                        placeholder="ej: 08:30 - 13:00"
                        className="bg-[#1a1a18] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757] h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Domingos
                      </Label>
                      <Input
                        value={branchToEdit.opening_hours.sunday || ''}
                        onChange={(e) => setBranchToEdit({
                          ...branchToEdit,
                          opening_hours: { ...branchToEdit.opening_hours, sunday: e.target.value },
                        })}
                        placeholder="ej: Cerrado"
                        className="bg-[#1a1a18] border-[#3a3a38] text-[#fafafa] placeholder:text-[#666666] focus:border-[#d97757] h-11"
                      />
                    </div>

                    <div className="mt-4 p-4 bg-[#1a1a18] rounded-lg border border-[#3a3a38]">
                      <h4 className="text-sm font-medium text-[#fafafa] mb-2">Vista previa</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#888888]">Lun - Vie:</span>
                          <span className="text-[#fafafa]">{branchToEdit.opening_hours.weekdays || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#888888]">Sábado:</span>
                          <span className="text-[#fafafa]">{branchToEdit.opening_hours.saturday || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#888888]">Domingo:</span>
                          <span className="text-[#fafafa]">{branchToEdit.opening_hours.sunday || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="m-0 p-6 space-y-6">
                    {/* Image Upload */}
                    <div className="space-y-3">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Imagen de Fondo
                      </Label>
                      <ImageUpload
                        value={branchToEdit.background_image_url || undefined}
                        onChange={(url) => setBranchToEdit({ ...branchToEdit, background_image_url: url || undefined })}
                        onUpload={(file) => handleUploadImage(file, branchToEdit.id)}
                        disabled={uploadingImage}
                      />
                    </div>

                    {/* Switches */}
                    <div className="space-y-3">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Configuración
                      </Label>

                      <div className="space-y-3">
                        <div
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                            branchToEdit.is_main
                              ? 'bg-[#d97757]/10 border-[#d97757]/30'
                              : 'bg-[#1a1a18] border-[#3a3a38] hover:border-[#4a4a48]'
                          }`}
                          onClick={() => setBranchToEdit({ ...branchToEdit, is_main: !branchToEdit.is_main })}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${branchToEdit.is_main ? 'bg-[#d97757]/20' : 'bg-[#262624]'}`}>
                              <Store className={`w-4 h-4 ${branchToEdit.is_main ? 'text-[#d97757]' : 'text-[#888888]'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#fafafa]">Sucursal Principal</p>
                              <p className="text-xs text-[#888888]">Casa matriz de la empresa</p>
                            </div>
                          </div>
                          <Switch
                            checked={branchToEdit.is_main}
                            onCheckedChange={(checked) => setBranchToEdit({ ...branchToEdit, is_main: checked })}
                          />
                        </div>

                        <div
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                            branchToEdit.active
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-[#1a1a18] border-[#3a3a38] hover:border-[#4a4a48]'
                          }`}
                          onClick={() => setBranchToEdit({ ...branchToEdit, active: !branchToEdit.active })}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${branchToEdit.active ? 'bg-green-500/20' : 'bg-[#262624]'}`}>
                              <Globe className={`w-4 h-4 ${branchToEdit.active ? 'text-green-400' : 'text-[#888888]'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#fafafa]">Visible al Público</p>
                              <p className="text-xs text-[#888888]">Mostrar en la web y turnero</p>
                            </div>
                          </div>
                          <Switch
                            checked={branchToEdit.active}
                            onCheckedChange={(checked) => setBranchToEdit({ ...branchToEdit, active: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4 border-t border-[#3a3a38]">
                      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-400">Eliminar Sucursal</p>
                            <p className="text-xs text-[#888888]">Esta acción no se puede deshacer</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setIsEditDialogOpen(false)
                              openDeleteDialog(branchToEdit.id)
                            }}
                            className="text-red-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              {/* Footer with Save Button */}
              <div className="border-t border-[#3a3a38] p-4 bg-[#262624]">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="flex-1 bg-transparent border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38]"
                    disabled={updating}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEditBranch}
                    disabled={updating || uploadingImage}
                    className="flex-1 bg-[#d97757] text-white hover:bg-[#d97757]/90"
                  >
                    {updating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#fafafa]">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#888888]">
              Esta acción no se puede deshacer. Se eliminará permanentemente la sucursal
              y su imagen asociada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38]"
              disabled={deleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBranch}
              disabled={deleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading Overlay - Shows while deleting */}
      {deleting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#262624] border border-[#3a3a38] shadow-2xl"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#d97757]/20 animate-ping" />
              <div className="relative p-4 rounded-full bg-[#d97757]/10 border border-[#d97757]/30">
                <Loader2 className="w-8 h-8 text-[#d97757] animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-[#fafafa]">Eliminando sucursal...</p>
              <p className="text-sm text-[#888888] mt-1">Por favor espere</p>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  )
}
