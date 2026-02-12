// Admin Services Management Page - Excel-style Table
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, RefreshCw, Plus, Trash2, CheckCircle2, FileText, Settings, ChevronLeft, ChevronRight, AlertCircle, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
import { toast } from 'sonner'
import { adminColors as colors } from '@/lib/constants/admin-theme'

interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  requires_vehicle: boolean
  icon: string | null
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (á→a, ñ→n, etc.)
    .replace(/[^a-z0-9\s-]/g, '')   // Remove non-alphanumeric
    .trim()
    .replace(/\s+/g, '-')           // Spaces to hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens
}

const CREATE_STEPS = [
  { id: 0, title: 'Información', description: 'Nombre y descripción del servicio', icon: FileText },
  { id: 1, title: 'Configuración', description: 'Duración y precio', icon: Settings },
]

const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '75', label: '1h 15min' },
  { value: '90', label: '1h 30min' },
  { value: '105', label: '1h 45min' },
  { value: '120', label: '2 horas' },
]


export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [createStep, setCreateStep] = useState(0)
  const [stepError, setStepError] = useState<string | null>(null)
  const [newPriceDisplay, setNewPriceDisplay] = useState('')
  const [editPriceDisplay, setEditPriceDisplay] = useState('')
  const [newService, setNewService] = useState<Service>({
    id: '',
    name: '',
    description: '',
    duration: 30,
    price: 0,
    requires_vehicle: false,
    icon: null
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/appointment-services')
      const data = await response.json()

      if (response.ok) {
        setServices(data.services || [])
      } else {
        setError('Error al cargar servicios')
        toast.error('Error al cargar servicios')
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      setError('Error al cargar servicios')
      toast.error('Error al cargar servicios')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (service: Service) => {
    // Snap duration to nearest 15-min increment
    const snapped = Math.round(service.duration / 15) * 15
    const clampedDuration = Math.max(15, Math.min(120, snapped))
    setServiceToEdit({ ...service, duration: clampedDuration })
    setEditPriceDisplay(service.price > 0 ? service.price.toLocaleString('es-AR') : '')
    setIsEditDialogOpen(true)
  }

  const handleEditService = async () => {
    try {
      if (!serviceToEdit) return

      if (!serviceToEdit.name || serviceToEdit.name.trim() === '') {
        toast.error('El nombre del servicio es requerido')
        return
      }

      if (!serviceToEdit.description || serviceToEdit.description.trim() === '') {
        toast.error('La descripción del servicio es requerida')
        return
      }

      if (!serviceToEdit.duration || serviceToEdit.duration <= 0) {
        toast.error('La duración debe ser mayor a 0 minutos')
        return
      }

      if (serviceToEdit.price === undefined || serviceToEdit.price === null || serviceToEdit.price < 0) {
        toast.error('El precio debe ser mayor o igual a 0')
        return
      }

      setUpdating(true)

      const response = await fetch('/api/appointment-services', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          services: [{
            ...serviceToEdit,
            requires_vehicle: serviceToEdit.requires_vehicle ?? false,
            icon: serviceToEdit.icon ?? null
          }]
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Servicio actualizado correctamente')
        setIsEditDialogOpen(false)
        setServiceToEdit(null)
        fetchServices()
      } else {
        toast.error(data.error || 'Error al actualizar servicio')
      }
    } catch (error) {
      console.error('Error updating service:', error)
      toast.error('Error al actualizar servicio')
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateService = async () => {
    if (!validateCreateStep(1)) return

    try {
      setCreating(true)

      const response = await fetch('/api/appointment-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newService,
          requires_vehicle: false,
          icon: null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Servicio creado correctamente')
        setIsCreateDialogOpen(false)
        setNewService({
          id: '',
          name: '',
          description: '',
          duration: 30,
          price: 0,
          requires_vehicle: false,
          icon: null
        })
        fetchServices()
      } else {
        toast.error(data.error || 'Error al crear servicio')
      }
    } catch (error) {
      console.error('Error creating service:', error)
      toast.error('Error al crear servicio')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteService = async () => {
    try {
      if (!serviceToDelete) return

      setDeleting(true)

      const response = await fetch(`/api/appointment-services?id=${serviceToDelete}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Servicio eliminado correctamente')
        setIsDeleteDialogOpen(false)
        setServiceToDelete(null)
        fetchServices()
      } else {
        toast.error(data.error || 'Error al eliminar servicio')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error('Error al eliminar servicio')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (serviceId: string) => {
    setServiceToDelete(serviceId)
    setIsDeleteDialogOpen(true)
  }

  const openCreateDialog = () => {
    setNewService({
      id: '',
      name: '',
      description: '',
      duration: 30,
      price: 0,
      requires_vehicle: false,
      icon: null
    })
    setCreateStep(0)
    setStepError(null)
    setNewPriceDisplay('')
    setIsCreateDialogOpen(true)
  }

  const handleNewServiceNameChange = (name: string) => {
    const slug = slugify(name)
    let finalSlug = slug
    const existingIds = new Set(services.map(s => s.id))
    if (existingIds.has(finalSlug) && finalSlug !== '') {
      let counter = 2
      while (existingIds.has(`${finalSlug}-${counter}`)) {
        counter++
      }
      finalSlug = `${finalSlug}-${counter}`
    }
    setNewService(prev => ({ ...prev, name, id: finalSlug }))
  }

  const validateCreateStep = (step: number): boolean => {
    setStepError(null)
    switch (step) {
      case 0:
        if (!newService.name.trim()) { setStepError('El nombre es requerido'); return false }
        if (!newService.id) { setStepError('El ID no se pudo generar'); return false }
        if (!newService.description.trim()) { setStepError('La descripción es requerida'); return false }
        return true
      case 1:
        if (!newService.duration || newService.duration <= 0) { setStepError('Seleccioná una duración'); return false }
        if (newService.price < 0) { setStepError('El precio no puede ser negativo'); return false }
        return true
      default: return true
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

  if (loading && services.length === 0) {
    return (
      <div className="p-6 min-h-screen">
        <TableSkeleton rows={8} columns={8} />
      </div>
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
                <Wrench className="w-8 h-8 text-[#d97757]" />
              </div>
              <div>
                <CardTitle className="text-2xl text-[#fafafa]">Gestión de Servicios</CardTitle>
                <CardDescription className="text-[#888888]">
                  Administra los servicios del turnero - {services.length} servicios totales
                </CardDescription>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={fetchServices}
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
                Nuevo Servicio
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200">
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Excel-style Table with shadcn/ui */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20 py-0 gap-0 overflow-hidden">
          <Table>
            <TableHeader className="bg-[#1a1a18] border-b-2 border-[#d97757]/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold text-[#d97757] uppercase tracking-wider min-w-[250px] py-4">
                  Servicio
                </TableHead>
                <TableHead className="text-xs font-bold text-[#d97757] uppercase tracking-wider min-w-[350px] py-4">
                  Descripción
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-[#d97757] uppercase tracking-wider w-32 py-4">
                  Duración
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-[#d97757] uppercase tracking-wider w-40 py-4">
                  Precio
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-[#d97757] uppercase tracking-wider w-24 py-4">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-[#3a3a38]/50">
              {services.map((service) => (
                <TableRow
                  key={service.id}
                  onClick={() => openEditDialog(service)}
                  className="hover:bg-[#2a2a28]/60 transition-all duration-200 border-b border-[#3a3a38]/30 group cursor-pointer hover:shadow-lg hover:shadow-[#d97757]/5"
                  style={{
                    opacity: 1,
                    transform: 'translateX(0)'
                  }}
                >
                    {/* Name */}
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-base font-semibold text-[#fafafa] group-hover:text-[#d97757] transition-colors">
                          {service.name}
                        </span>
                        <span className="text-xs text-[#888888] font-mono">{service.id}</span>
                      </div>
                    </TableCell>

                    {/* Description */}
                    <TableCell className="py-4">
                      <span className="text-sm text-[#a1a1aa] line-clamp-2 leading-relaxed">{service.description}</span>
                    </TableCell>

                    {/* Duration */}
                    <TableCell className="text-center py-4">
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#1a1a18] border border-[#3a3a38]">
                        <span className="text-sm text-[#fafafa] font-medium">{service.duration}</span>
                        <span className="text-xs text-[#888888]">min</span>
                      </div>
                    </TableCell>

                    {/* Price */}
                    <TableCell className="text-center py-4">
                      <span className="text-base text-[#d97757] font-bold">
                        ${service.price.toLocaleString('es-AR')}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center py-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(service.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-9 w-9 p-0 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Empty State */}
          {services.length === 0 && !loading && (
            <div className="py-12 text-center">
              <Wrench className="w-12 h-12 text-[#888888] mx-auto mb-4" />
              <p className="text-[#888888]">No hay servicios disponibles</p>
              <p className="text-[#666666] text-sm mt-2">Click en &quot;Nuevo Servicio&quot; para crear uno</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Footer Info */}
      <Card className="bg-[#262624] border-[#3a3a38]">
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6 text-[#888888]">
              <span>Total de servicios: <strong className="text-[#fafafa]">{services.length}</strong></span>
              <span>Precio promedio: <strong className="text-[#d97757]">${services.length > 0 ? Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length).toLocaleString('es-AR') : 0}</strong></span>
            </div>
            <div className="text-[#666666] text-xs">
              Última actualización: {new Date().toLocaleString('es-AR')}
            </div>
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
        <DialogContent showCloseButton={false} data-overlay-translucent className="bg-transparent border-none p-0 shadow-none max-w-2xl" style={{ animation: 'none' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-[#262624] border border-[#3a3a38] text-[#fafafa] placeholder:text-[#555555] rounded-lg p-0 max-h-[90vh] flex flex-col overflow-hidden relative"
          >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsCreateDialogOpen(false)}
            className="absolute top-4 right-4 z-10 rounded-sm opacity-70 transition-opacity hover:opacity-100 text-[#888888] hover:text-[#fafafa]"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Cerrar</span>
          </button>

          {/* Header with Progress */}
          <div className="bg-gradient-to-r from-[#262624] to-[#30302e] px-6 py-4 border-b border-[#3a3a38] shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <DialogTitle className="text-xl font-bold text-[#fafafa]">
                  Nuevo Servicio
                </DialogTitle>
                <DialogDescription className="text-[#888888] mt-1">
                  {CREATE_STEPS[createStep].description}
                </DialogDescription>
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
                          ? 'bg-[#d97757] text-white'
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

                {/* Step 0: Información */}
                {createStep === 0 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name" className="text-[#fafafa] font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#d97757]" />
                        Nombre del Servicio *
                      </Label>
                      <Input
                        id="new-name"
                        placeholder="ej: Rotación de Neumáticos"
                        value={newService.name}
                        onChange={(e) => handleNewServiceNameChange(e.target.value)}
                        className="bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] h-12 border-[#3a3a38] focus:border-[#d97757] focus:ring-[#d97757]/20 focus-visible:border-[#d97757] focus-visible:ring-[#d97757]/20"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-id" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        ID del Servicio (auto-generado)
                      </Label>
                      <Input
                        id="new-id"
                        value={newService.id}
                        readOnly
                        tabIndex={-1}
                        className="bg-[#1a1a18] border-[#3a3a38] text-[#888888] font-mono cursor-default h-12"
                        placeholder="Se genera automáticamente del nombre"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-description" className="text-[#fafafa] font-medium">
                        Descripción *
                      </Label>
                      <Textarea
                        id="new-description"
                        placeholder="Describe el servicio..."
                        value={newService.description}
                        onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                        className="bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] border-[#3a3a38] focus:border-[#d97757] focus:ring-[#d97757]/20 focus-visible:border-[#d97757] focus-visible:ring-[#d97757]/20 resize-none min-h-[100px]"
                      />
                    </div>
                  </div>
                )}

                {/* Step 1: Configuración */}
                {createStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-duration" className="text-[#fafafa] font-medium flex items-center gap-2">
                        <Settings className="w-4 h-4 text-[#d97757]" />
                        Duración
                      </Label>
                      <Select
                        value={String(newService.duration)}
                        onValueChange={(val) => setNewService({ ...newService, duration: parseInt(val) })}
                      >
                        <SelectTrigger className="!bg-[#30302e] !text-[#fafafa] !border-[#3a3a38] h-12 focus:ring-[#d97757] [&>svg]:!text-[#888888] [&>span]:!text-[#fafafa]">
                          <SelectValue placeholder="Seleccionar duración" />
                        </SelectTrigger>
                        <SelectContent className="!bg-[#262624] !border-[#3a3a38]">
                          {DURATION_OPTIONS.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="!text-[#fafafa] !bg-transparent hover:!bg-[#3a3a38] focus:!bg-[#3a3a38] focus:!text-[#fafafa] cursor-pointer [&>span>svg]:!text-[#fafafa]"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-price" className="text-[#fafafa] font-medium">
                        Precio ARS
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-sm pointer-events-none">$</span>
                        <Input
                          id="new-price"
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={newPriceDisplay}
                          onFocus={() => {
                            if (newService.price === 0) setNewPriceDisplay('')
                          }}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '')
                            const parsed = parseInt(digits, 10) || 0
                            setNewService({ ...newService, price: parsed })
                            setNewPriceDisplay(parsed === 0 ? '' : parsed.toLocaleString('es-AR'))
                          }}
                          onBlur={() => {
                            if (newService.price === 0) {
                              setNewPriceDisplay('')
                            } else {
                              setNewPriceDisplay(newService.price.toLocaleString('es-AR'))
                            }
                          }}
                          className="bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] h-12 border-[#3a3a38] focus:border-[#d97757] focus:ring-[#d97757]/20 focus-visible:border-[#d97757] focus-visible:ring-[#d97757]/20 pl-8"
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
                type="button"
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
                  type="button"
                  onClick={handleNextStep}
                  className="bg-[#d97757] text-white hover:bg-[#d97757]/90 min-w-[120px]"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleCreateService}
                  disabled={creating}
                  className="bg-[#d97757] text-white hover:bg-[#d97757]/90 min-w-[160px]"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Servicio'
                  )}
                </Button>
              )}
            </div>
          </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <DialogHeader>
              <DialogTitle className="text-[#fafafa] text-xl">Editar Servicio</DialogTitle>
              <DialogDescription className="text-[#888888]">
                Modifica los datos del servicio
              </DialogDescription>
            </DialogHeader>
                {serviceToEdit && (
                  <div className="space-y-4 py-4">
                    {/* ID - Readonly */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-id" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        ID del Servicio
                      </Label>
                      <Input
                        id="edit-id"
                        value={serviceToEdit.id}
                        readOnly
                        tabIndex={-1}
                        className="bg-[#1a1a18] border-[#3a3a38] text-[#888888] cursor-default font-mono h-12"
                      />
                    </div>

                    {/* Nombre */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-name" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Nombre del Servicio *
                      </Label>
                      <Input
                        id="edit-name"
                        placeholder="ej: Rotación de Neumáticos"
                        value={serviceToEdit.name}
                        onChange={(e) => setServiceToEdit({ ...serviceToEdit, name: e.target.value })}
                        className="bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] h-12 border-[#3a3a38] focus:border-[#d97757] focus:ring-[#d97757]/20 focus-visible:border-[#d97757] focus-visible:ring-[#d97757]/20"
                      />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-description" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Descripción *
                      </Label>
                      <Textarea
                        id="edit-description"
                        placeholder="Describe el servicio..."
                        value={serviceToEdit.description}
                        onChange={(e) => setServiceToEdit({ ...serviceToEdit, description: e.target.value })}
                        className="bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] border-[#3a3a38] focus:border-[#d97757] focus:ring-[#d97757]/20 focus-visible:border-[#d97757] focus-visible:ring-[#d97757]/20 resize-none min-h-[80px]"
                      />
                    </div>

                    {/* Duración + Precio */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-duration" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                          Duración
                        </Label>
                        <Select
                          value={String(serviceToEdit.duration)}
                          onValueChange={(val) => setServiceToEdit({ ...serviceToEdit, duration: parseInt(val) })}
                        >
                          <SelectTrigger className="!bg-[#30302e] !text-[#fafafa] !border-[#3a3a38] h-12 focus:ring-[#d97757] [&>svg]:!text-[#888888] [&>span]:!text-[#fafafa]">
                            <SelectValue placeholder="Seleccionar duración" />
                          </SelectTrigger>
                          <SelectContent className="!bg-[#262624] !border-[#3a3a38]">
                            {DURATION_OPTIONS.map((opt) => (
                              <SelectItem
                                key={opt.value}
                                value={opt.value}
                                className="!text-[#fafafa] !bg-transparent hover:!bg-[#3a3a38] focus:!bg-[#3a3a38] focus:!text-[#fafafa] cursor-pointer [&>span>svg]:!text-[#fafafa]"
                              >
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-price" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                          Precio ARS
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-sm pointer-events-none">$</span>
                          <Input
                            id="edit-price"
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={editPriceDisplay}
                            onFocus={() => {
                              if (serviceToEdit.price === 0) setEditPriceDisplay('')
                            }}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '')
                              const parsed = parseInt(digits, 10) || 0
                              setServiceToEdit({ ...serviceToEdit, price: parsed })
                              setEditPriceDisplay(parsed === 0 ? '' : parsed.toLocaleString('es-AR'))
                            }}
                            onBlur={() => {
                              if (serviceToEdit.price === 0) {
                                setEditPriceDisplay('')
                              } else {
                                setEditPriceDisplay(serviceToEdit.price.toLocaleString('es-AR'))
                              }
                            }}
                            className="bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] h-12 border-[#3a3a38] focus:border-[#d97757] focus:ring-[#d97757]/20 focus-visible:border-[#d97757] focus-visible:ring-[#d97757]/20 pl-8"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={updating}
                  className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] disabled:opacity-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEditService}
                  disabled={updating}
                  className="bg-[#d97757] text-white hover:bg-[#d97757]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {updating ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </motion.div>
          </DialogContent>
        </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#262624] border-[#3a3a38]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#fafafa] text-xl">¿Eliminar servicio?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#888888]">
                Esta acción no se puede deshacer. El servicio será eliminado permanentemente de la base de datos y no aparecerá más en el turnero.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deleting}
                className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] disabled:opacity-50"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteService}
                disabled={deleting}
                className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
                ) : null}
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
