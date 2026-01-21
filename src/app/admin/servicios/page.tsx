// Admin Services Management Page - Excel-style Table
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wrench, Save, RefreshCw, Plus, Trash2, Check, X, Edit2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  requires_vehicle: boolean
  icon: string | null
}

export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null)
  const [generatingId, setGeneratingId] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
    setServiceToEdit({ ...service })
    setIsEditDialogOpen(true)
  }

  const handleEditService = async () => {
    try {
      if (!serviceToEdit) return

      // Validación de campos requeridos
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
    try {
      // Validación de campos requeridos
      if (!newService.name || newService.name.trim() === '') {
        toast.error('El nombre del servicio es requerido')
        return
      }

      if (!newService.description || newService.description.trim() === '') {
        toast.error('La descripción del servicio es requerida')
        return
      }

      if (!newService.duration || newService.duration <= 0) {
        toast.error('La duración debe ser mayor a 0 minutos')
        return
      }

      if (newService.price === undefined || newService.price === null || newService.price < 0) {
        toast.error('El precio debe ser mayor o igual a 0')
        return
      }

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

  const openCreateDialog = async () => {
    try {
      setGeneratingId(true)
      // Generate ID from backend
      const response = await fetch('/api/appointment-services/generate-id')
      const data = await response.json()

      if (response.ok && data.id) {
        setNewService({
          id: data.id,
          name: '',
          description: '',
          duration: 30,
          price: 0,
          requires_vehicle: false,
          icon: null
        })
        setIsCreateDialogOpen(true)
      } else {
        toast.error('Error al generar ID del servicio')
      }
    } catch (error) {
      console.error('Error generating service ID:', error)
      toast.error('Error al generar ID del servicio')
    } finally {
      setGeneratingId(false)
    }
  }

  if (loading && services.length === 0) {
    return (
      <div className="p-6 bg-[#30302e] min-h-screen">
        <TableSkeleton rows={8} columns={8} />
      </div>
    )
  }

  return (
    <main className="p-6 space-y-6 bg-[#30302e] min-h-screen">
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
                disabled={generatingId}
                className="bg-[#d97757] text-white hover:bg-[#d97757]/90 transition-colors shadow-lg shadow-[#d97757]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingId ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {generatingId ? 'Generando...' : 'Nuevo Servicio'}
              </Button>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] max-w-2xl">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <DialogHeader>
                      <DialogTitle className="text-[#fafafa] text-xl">Crear Nuevo Servicio</DialogTitle>
                      <DialogDescription className="text-[#888888]">
                        Completa todos los campos para crear un nuevo servicio
                      </DialogDescription>
                    </DialogHeader>
                        <div className="space-y-4 py-4">
                          {/* ID - Full Width - Backend Generated */}
                          <div className="space-y-2">
                            <Label htmlFor="new-id" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                              ID del Servicio
                            </Label>
                            <Input
                              id="new-id"
                              value={newService.id}
                              readOnly
                              className="bg-[#1a1a18] border-[#3a3a38] text-[#888888] font-mono cursor-default"
                            />
                          </div>

                          {/* Nombre - Full Width */}
                          <div className="space-y-2">
                            <Label htmlFor="new-name" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                              Nombre del Servicio *
                            </Label>
                            <Input
                              id="new-name"
                              placeholder="ej: Rotación de Neumáticos"
                              value={newService.name}
                              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                              className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                              autoFocus
                            />
                          </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-description" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Descripción *
                      </Label>
                      <Textarea
                        id="new-description"
                        placeholder="Describe el servicio..."
                        value={newService.description}
                        onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] resize-none min-h-[80px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-duration" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                          Duración (min)
                        </Label>
                        <Input
                          id="new-duration"
                          type="number"
                          value={newService.duration}
                          onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) || 0 })}
                          className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-price" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                          Precio (ARS)
                        </Label>
                        <Input
                          id="new-price"
                          type="number"
                          value={newService.price}
                          onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                          className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                        />
                      </div>
                    </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                          disabled={creating}
                          className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] disabled:opacity-50"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleCreateService}
                          disabled={creating}
                          className="bg-[#d97757] text-white hover:bg-[#d97757]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {creating ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          {creating ? 'Creando...' : 'Crear Servicio'}
                        </Button>
                      </DialogFooter>
                    </motion.div>
                  </DialogContent>
              </Dialog>
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
        <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
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
              {services.map((service, index) => (
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
              <p className="text-[#666666] text-sm mt-2">Click en "Nuevo Servicio" para crear uno</p>
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
                    {/* ID - Full Width */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-id" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        ID del Servicio *
                      </Label>
                      <Input
                        id="edit-id"
                        placeholder="ej: tire-rotation"
                        value={serviceToEdit.id}
                        disabled
                        className="bg-[#1a1a18] border-[#3a3a38] text-[#888888] cursor-not-allowed font-mono"
                      />
                    </div>

                    {/* Nombre - Full Width */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-name" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Nombre del Servicio *
                      </Label>
                      <Input
                        id="edit-name"
                        placeholder="ej: Rotación de Neumáticos"
                        value={serviceToEdit.name}
                        onChange={(e) => setServiceToEdit({ ...serviceToEdit, name: e.target.value })}
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                  Descripción *
                </Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe el servicio..."
                  value={serviceToEdit.description}
                  onChange={(e) => setServiceToEdit({ ...serviceToEdit, description: e.target.value })}
                  className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] resize-none min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-duration" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                    Duración (min)
                  </Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    value={serviceToEdit.duration}
                    onChange={(e) => setServiceToEdit({ ...serviceToEdit, duration: parseInt(e.target.value) || 0 })}
                    className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                    Precio (ARS)
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={serviceToEdit.price}
                    onChange={(e) => setServiceToEdit({ ...serviceToEdit, price: parseFloat(e.target.value) || 0 })}
                    className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                  />
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
