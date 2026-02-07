'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { GeneralInfoSection } from './sections/GeneralInfoSection'
import { SpecificationsSection } from './sections/SpecificationsSection'
import { CharacteristicsSection } from './sections/CharacteristicsSection'
import { StatusMarketingSection } from './sections/StatusMarketingSection'
import type { EditProductDialogProps, ProductFormData } from './types'

const initialFormData: ProductFormData = {
  name: '',
  sku: '',
  brand_name: null,
  description: null,
  price: null,
  sale_price: null,
  stock: 0,
  min_stock_alert: 5,
  width: null,
  aspect_ratio: null,
  rim_diameter: null,
  construction: null,
  load_index: null,
  speed_rating: null,
  season: null,
  extra_load: false,
  run_flat: false,
  seal_inside: false,
  tube_type: false,
  homologation: null,
  status: 'active',
  featured: false,
  best_seller: false,
  new_arrival: false,
}

export function EditProductDialog({
  open,
  onOpenChange,
  productId,
  onSuccess
}: EditProductDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [originalData, setOriginalData] = useState<ProductFormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const loadProduct = useCallback(async () => {
    if (!productId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (!response.ok) throw new Error('Error al cargar el producto')

      const data = await response.json()
      const product = data.product || data

      const loadedData: ProductFormData = {
        name: product.name || '',
        sku: product.sku || '',
        brand_name: product.brand_name || null,
        description: product.description || null,
        price: product.price || null,
        sale_price: product.sale_price || null,
        stock: product.stock ?? product.stock_quantity ?? 0,
        min_stock_alert: product.min_stock_alert ?? 5,
        width: product.width || null,
        aspect_ratio: product.aspect_ratio || null,
        rim_diameter: product.rim_diameter || null,
        construction: product.construction || null,
        load_index: product.load_index || null,
        speed_rating: product.speed_rating || null,
        season: product.season || null,
        extra_load: product.extra_load ?? false,
        run_flat: product.run_flat ?? false,
        seal_inside: product.seal_inside ?? false,
        tube_type: product.tube_type ?? false,
        homologation: product.homologation || null,
        status: product.status || 'active',
        featured: product.featured ?? false,
        best_seller: product.best_seller ?? false,
        new_arrival: product.new_arrival ?? false,
      }

      setFormData(loadedData)
      setOriginalData(loadedData)
    } catch (error) {
      console.error('Error loading product:', error)
      toast.error('Error al cargar el producto')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    if (open && productId) {
      loadProduct()
      setActiveTab('general')
    } else {
      setFormData(initialFormData)
      setOriginalData(initialFormData)
    }
  }, [open, productId, loadProduct])

  const handleChange = (data: Partial<ProductFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData)

  const handleSave = async () => {
    if (!productId || !hasChanges) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar')
      }

      toast.success('Producto actualizado correctamente')
      setOriginalData(formData)
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar el producto')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#262624] border-[#3a3a38] text-[#fafafa] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Screen reader only title for accessibility during loading state */}
        <DialogTitle className="sr-only">Editar Producto</DialogTitle>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="w-8 h-8 animate-spin text-[#d97757] mb-4" />
              <p className="text-[#888888]">Cargando producto...</p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 min-h-0"
            >
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#d97757]/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-[#d97757]" />
                  </div>
                  <div>
                    <h2 className="text-[#fafafa] text-xl font-semibold" aria-hidden="true">
                      Editar Producto
                    </h2>
                    <DialogDescription className="text-[#888888]">
                      SKU: {formData.sku}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col min-h-0 mt-4"
              >
                <TabsList className="flex-shrink-0 bg-[#1e1e1c] border border-[#3a3a38] p-1 w-full grid grid-cols-4">
                  <TabsTrigger
                    value="general"
                    className="data-[state=active]:bg-[#d97757] data-[state=active]:text-white text-[#888888] text-sm"
                  >
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="specs"
                    className="data-[state=active]:bg-[#d97757] data-[state=active]:text-white text-[#888888] text-sm"
                  >
                    Specs
                  </TabsTrigger>
                  <TabsTrigger
                    value="characteristics"
                    className="data-[state=active]:bg-[#d97757] data-[state=active]:text-white text-[#888888] text-sm"
                  >
                    Caracs.
                  </TabsTrigger>
                  <TabsTrigger
                    value="status"
                    className="data-[state=active]:bg-[#d97757] data-[state=active]:text-white text-[#888888] text-sm"
                  >
                    Estado
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto py-4 min-h-0">
                  <TabsContent value="general" className="mt-0 h-full">
                    <GeneralInfoSection
                      formData={formData}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </TabsContent>
                  <TabsContent value="specs" className="mt-0 h-full">
                    <SpecificationsSection
                      formData={formData}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </TabsContent>
                  <TabsContent value="characteristics" className="mt-0 h-full">
                    <CharacteristicsSection
                      formData={formData}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </TabsContent>
                  <TabsContent value="status" className="mt-0 h-full">
                    <StatusMarketingSection
                      formData={formData}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  </TabsContent>
                </div>
              </Tabs>

              <DialogFooter className="flex-shrink-0 pt-4 border-t border-[#3a3a38]">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="bg-[#262626] border-[#3a3a38] text-[#fafafa] hover:bg-[#3a3a38] disabled:opacity-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="bg-[#d97757] text-white hover:bg-[#d97757]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
