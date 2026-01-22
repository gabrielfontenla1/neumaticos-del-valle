// Admin Branches Management Page - Excel-style Table
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, RefreshCw, Plus, Trash2, Edit2, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'sonner'
import type { Branch, OpeningHours } from '@/types/branch'

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
    setIsCreateDialogOpen(true)
  }

  if (loading && branches.length === 0) {
    return (
      <div className="p-6 bg-[#30302e] min-h-screen">
        <TableSkeleton rows={8} columns={7} />
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

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] max-w-3xl max-h-[90vh] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <DialogHeader>
              <DialogTitle className="text-[#fafafa] text-xl">Crear Nueva Sucursal</DialogTitle>
              <DialogDescription className="text-[#888888]">
                Completa todos los campos requeridos (*) para crear una nueva sucursal
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                  Información Básica
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-name" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                      Nombre *
                    </Label>
                    <Input
                      id="new-name"
                      placeholder="ej: Sucursal Catamarca Centro"
                      value={newBranch.name}
                      onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                      className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-city" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                      Ciudad *
                    </Label>
                    <Input
                      id="new-city"
                      placeholder="ej: San Fernando del Valle de Catamarca"
                      value={newBranch.city}
                      onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                      className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-address" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                      Dirección *
                    </Label>
                    <Input
                      id="new-address"
                      placeholder="ej: Av. Belgrano 123"
                      value={newBranch.address}
                      onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                      className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-province" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                      Provincia *
                    </Label>
                    <Input
                      id="new-province"
                      placeholder="ej: Catamarca"
                      value={newBranch.province || ''}
                      onChange={(e) => setNewBranch({ ...newBranch, province: e.target.value })}
                      className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                    />
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                  Contacto
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-phone" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                      Teléfono *
                    </Label>
                    <Input
                      id="new-phone"
                      placeholder="ej: 3834123456"
                      value={newBranch.phone}
                      onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                      className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-whatsapp" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                      WhatsApp
                    </Label>
                    <Input
                      id="new-whatsapp"
                      placeholder="ej: 5493834123456"
                      value={newBranch.whatsapp || ''}
                      onChange={(e) => setNewBranch({ ...newBranch, whatsapp: e.target.value })}
                      className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-email" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                      Email
                    </Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="ej: sucursal@neumaticos.com"
                      value={newBranch.email || ''}
                      onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                      className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                    />
                  </div>
                </div>
              </div>

              {/* Horarios */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                  Horarios
                </h3>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-weekdays" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                      Lunes a Viernes
                    </Label>
                    <Input
                      id="new-weekdays"
                      placeholder="ej: 08:00 - 12:30 y 16:00 - 20:00"
                      value={newBranch.opening_hours?.weekdays}
                      onChange={(e) =>
                        setNewBranch({
                          ...newBranch,
                          opening_hours: { ...newBranch.opening_hours!, weekdays: e.target.value },
                        })
                      }
                      className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-saturday" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Sábado
                      </Label>
                      <Input
                        id="new-saturday"
                        placeholder="ej: 08:30 - 12:30"
                        value={newBranch.opening_hours?.saturday}
                        onChange={(e) =>
                          setNewBranch({
                            ...newBranch,
                            opening_hours: { ...newBranch.opening_hours!, saturday: e.target.value },
                          })
                        }
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-sunday" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Domingo
                      </Label>
                      <Input
                        id="new-sunday"
                        placeholder="ej: Cerrado"
                        value={newBranch.opening_hours?.sunday}
                        onChange={(e) =>
                          setNewBranch({
                            ...newBranch,
                            opening_hours: { ...newBranch.opening_hours!, sunday: e.target.value },
                          })
                        }
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ubicación (opcional) */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                  Ubicación (Opcional)
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-latitude" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                      Latitud
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
                      className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-longitude" className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                      Longitud
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
                      className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                    />
                  </div>
                </div>
              </div>

              {/* Imagen de Fondo */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                  Imagen de Fondo
                </h3>

                <ImageUpload
                  value={newBranch.background_image_url || undefined}
                  onChange={(url) => setNewBranch({ ...newBranch, background_image_url: url || undefined })}
                  onUpload={(file) => handleUploadImage(file)}
                  disabled={uploadingImage}
                />
              </div>

              {/* Configuración */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                  Configuración
                </h3>

                <div className="flex items-center justify-between p-4 bg-[#30302e]/50 rounded-lg border border-[#3a3a38]">
                  <div className="space-y-0.5">
                    <Label className="text-[#fafafa] font-medium">Sucursal Principal</Label>
                    <p className="text-xs text-[#888888]">
                      Marcar como sucursal principal de la empresa
                    </p>
                  </div>
                  <Switch
                    checked={newBranch.is_main}
                    onCheckedChange={(checked) => setNewBranch({ ...newBranch, is_main: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-[#30302e]/50 rounded-lg border border-[#3a3a38]">
                  <div className="space-y-0.5">
                    <Label className="text-[#fafafa] font-medium">Estado Activo</Label>
                    <p className="text-xs text-[#888888]">
                      Mostrar sucursal en la página pública
                    </p>
                  </div>
                  <Switch
                    checked={newBranch.active}
                    onCheckedChange={(checked) => setNewBranch({ ...newBranch, active: checked })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38]"
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateBranch}
                disabled={creating || uploadingImage}
                className="bg-[#d97757] text-white hover:bg-[#d97757]/90"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Sucursal'
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar structure to Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] max-w-3xl max-h-[90vh] overflow-y-auto">
          {branchToEdit && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <DialogHeader>
                <DialogTitle className="text-[#fafafa] text-xl">Editar Sucursal</DialogTitle>
                <DialogDescription className="text-[#888888]">
                  Modifica los campos necesarios de la sucursal
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Same structure as Create Dialog but with branchToEdit */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                    Información Básica
                  </h3>

                  <div className="space-y-2">
                    <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                      ID de la Sucursal
                    </Label>
                    <Input
                      value={branchToEdit.id}
                      readOnly
                      className="bg-[#1a1a18] border-[#3a3a38] text-[#888888] font-mono cursor-default"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Nombre *
                      </Label>
                      <Input
                        value={branchToEdit.name}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, name: e.target.value })}
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Ciudad *
                      </Label>
                      <Input
                        value={branchToEdit.city}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, city: e.target.value })}
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Dirección *
                      </Label>
                      <Input
                        value={branchToEdit.address}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, address: e.target.value })}
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Provincia *
                      </Label>
                      <Input
                        value={branchToEdit.province || ''}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, province: e.target.value })}
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                    Contacto
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Teléfono *
                      </Label>
                      <Input
                        value={branchToEdit.phone}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, phone: e.target.value })}
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        WhatsApp
                      </Label>
                      <Input
                        value={branchToEdit.whatsapp || ''}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, whatsapp: e.target.value })}
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Email
                      </Label>
                      <Input
                        type="email"
                        value={branchToEdit.email || ''}
                        onChange={(e) => setBranchToEdit({ ...branchToEdit, email: e.target.value })}
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                    Horarios
                  </h3>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Lunes a Viernes
                      </Label>
                      <Input
                        value={branchToEdit.opening_hours.weekdays}
                        onChange={(e) =>
                          setBranchToEdit({
                            ...branchToEdit,
                            opening_hours: { ...branchToEdit.opening_hours, weekdays: e.target.value },
                          })
                        }
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                          Sábado
                        </Label>
                        <Input
                          value={branchToEdit.opening_hours.saturday}
                          onChange={(e) =>
                            setBranchToEdit({
                              ...branchToEdit,
                              opening_hours: { ...branchToEdit.opening_hours, saturday: e.target.value },
                            })
                          }
                          className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                          Domingo
                        </Label>
                        <Input
                          value={branchToEdit.opening_hours.sunday || ''}
                          onChange={(e) =>
                            setBranchToEdit({
                              ...branchToEdit,
                              opening_hours: { ...branchToEdit.opening_hours, sunday: e.target.value },
                            })
                          }
                          className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                    Ubicación (Opcional)
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wide">
                        Latitud
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        value={branchToEdit.latitude || ''}
                        onChange={(e) =>
                          setBranchToEdit({ ...branchToEdit, latitude: e.target.value ? parseFloat(e.target.value) : undefined })
                        }
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
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
                        onChange={(e) =>
                          setBranchToEdit({ ...branchToEdit, longitude: e.target.value ? parseFloat(e.target.value) : undefined })
                        }
                        className="bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                    Imagen de Fondo
                  </h3>

                  <ImageUpload
                    value={branchToEdit.background_image_url || undefined}
                    onChange={(url) => setBranchToEdit({ ...branchToEdit, background_image_url: url || undefined })}
                    onUpload={(file) => handleUploadImage(file, branchToEdit.id)}
                    disabled={uploadingImage}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#d97757] uppercase tracking-wide">
                    Configuración
                  </h3>

                  <div className="flex items-center justify-between p-4 bg-[#30302e]/50 rounded-lg border border-[#3a3a38]">
                    <div className="space-y-0.5">
                      <Label className="text-[#fafafa] font-medium">Sucursal Principal</Label>
                      <p className="text-xs text-[#888888]">
                        Marcar como sucursal principal de la empresa
                      </p>
                    </div>
                    <Switch
                      checked={branchToEdit.is_main}
                      onCheckedChange={(checked) => setBranchToEdit({ ...branchToEdit, is_main: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#30302e]/50 rounded-lg border border-[#3a3a38]">
                    <div className="space-y-0.5">
                      <Label className="text-[#fafafa] font-medium">Estado Activo</Label>
                      <p className="text-xs text-[#888888]">
                        Mostrar sucursal en la página pública
                      </p>
                    </div>
                    <Switch
                      checked={branchToEdit.active}
                      onCheckedChange={(checked) => setBranchToEdit({ ...branchToEdit, active: checked })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38]"
                  disabled={updating}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEditBranch}
                  disabled={updating || uploadingImage}
                  className="bg-[#d97757] text-white hover:bg-[#d97757]/90"
                >
                  {updating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa]">
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
    </main>
  )
}
