'use client'

import { useState, useEffect } from 'react'
import { useCartContext } from '@/providers/CartProvider'
import { useNotifications } from '@/components/CartNotifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, RefreshCw, Trash2, Plus, Copy, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

// Mock product for testing
const MOCK_PRODUCT = {
  id: 'test-tire-001',
  name: 'Neumático Test',
  brand: 'Test Brand',
  sku: 'TEST-225/65R17',
  width: 225,
  aspect_ratio: 65,
  rim_diameter: 17,
  season: 'Invierno',
  price: 89000,
  sale_price: 69000,
  stock_quantity: 10,
  image_url: '/placeholder-tire.png'
}

export default function TestCartPage() {
  const { items, totals, isLoading, addItem, removeItem, clearAll, updateQuantity } = useCartContext()
  const { showNotification } = useNotifications()
  const [localStorage, setLocalStorage] = useState<Record<string, string>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Monitor localStorage in real-time
  useEffect(() => {
    const updateStorageState = () => {
      if (typeof window !== 'undefined') {
        const storage: Record<string, string> = {}
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)
          if (key?.startsWith('ndv_')) {
            const value = window.localStorage.getItem(key)
            if (value) storage[key] = value
          }
        }
        setLocalStorage(storage)
      }
    }

    updateStorageState()
    window.addEventListener('storage', updateStorageState)

    return () => window.removeEventListener('storage', updateStorageState)
  }, [items])

  const handleAddProduct = async () => {
    setIsAdding(true)
    try {
      const success = await addItem(MOCK_PRODUCT.id, 1)
      if (success) {
        showNotification({
          type: 'success',
          title: 'Producto agregado',
          message: `${MOCK_PRODUCT.brand} ${MOCK_PRODUCT.name} fue añadido al carrito`,
          duration: 3000
        })
      } else {
        showNotification({
          type: 'error',
          title: 'Error al agregar',
          message: 'No se pudo agregar el producto al carrito',
          duration: 3000
        })
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error inesperado',
        message: error instanceof Error ? error.message : 'Algo salió mal',
        duration: 3000
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleClearCart = async () => {
    try {
      await clearAll()
      showNotification({
        type: 'success',
        title: 'Carrito vaciado',
        message: 'Todos los productos han sido eliminados',
        duration: 2000
      })
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error al limpiar',
        message: 'No se pudo vaciar el carrito',
        duration: 3000
      })
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    try {
      const success = await updateQuantity(itemId, newQty)
      if (success) {
        showNotification({
          type: 'success',
          title: 'Cantidad actualizada',
          duration: 2000
        })
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error al actualizar',
        duration: 2000
      })
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      const success = await removeItem(itemId)
      if (success) {
        showNotification({
          type: 'success',
          title: 'Producto removido',
          duration: 2000
        })
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error al remover',
        duration: 2000
      })
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-bold text-gray-900">Testing E2E - Carrito</h1>
          <p className="text-gray-600">
            Panel de pruebas para validar funcionalidad del carrito y persistencia de datos
          </p>
        </motion.div>

        {/* Alert */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3"
        >
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Página de testing interna</p>
            <p className="text-sm text-blue-700">Esta página se usa para testing E2E y validación de funcionalidad</p>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="actions">Acciones</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="scenarios">Escenarios</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cart State Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>🛒</span> Estado del Carrito
                    </CardTitle>
                    <CardDescription>Información actual del carrito</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Productos</p>
                        <motion.p
                          key={totals.items_count}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-2xl font-bold text-gray-900"
                        >
                          {totals.items_count}
                        </motion.p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${totals.total.toLocaleString('es-CL')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Subtotal</p>
                        <p className="text-lg text-gray-900">
                          ${totals.subtotal.toLocaleString('es-CL')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Envío</p>
                        <p className="text-lg text-gray-900">
                          ${totals.shipping.toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                    {isLoading && (
                      <div className="flex items-center gap-2 text-blue-600 text-sm">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                          <RefreshCw className="h-4 w-4" />
                        </motion.div>
                        Cargando datos...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Items List Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>📦</span> Items en el Carrito
                    </CardTitle>
                    <CardDescription>{items.length} producto(s)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 ? (
                      <p className="text-gray-500 text-sm">El carrito está vacío</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {items.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {item.brand} {item.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.quantity} × ${item.price.toLocaleString('es-CL')}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                −
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock_quantity}
                              >
                                +
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                ✕
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Acciones de Testing</CardTitle>
                <CardDescription>Ejecuta diferentes operaciones para validar el carrito</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Add Product */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleAddProduct}
                      disabled={isAdding || isLoading}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white gap-2"
                      size="lg"
                    >
                      <Plus className="h-5 w-5" />
                      {isAdding ? 'Agregando...' : 'Agregar Producto Test'}
                    </Button>
                  </motion.div>

                  {/* Clear Cart */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleClearCart}
                      disabled={items.length === 0}
                      variant="destructive"
                      className="w-full h-12 gap-2"
                      size="lg"
                    >
                      <Trash2 className="h-5 w-5" />
                      Limpiar Carrito
                    </Button>
                  </motion.div>

                  {/* Add Multiple */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={async () => {
                        for (let i = 0; i < 3; i++) {
                          await addItem(MOCK_PRODUCT.id, 1)
                          await new Promise(resolve => setTimeout(resolve, 300))
                        }
                        showNotification({
                          type: 'success',
                          title: '3 Productos agregados',
                          duration: 2000
                        })
                      }}
                      disabled={isLoading}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                      size="lg"
                    >
                      <Plus className="h-5 w-5" />
                      Agregar 3 Productos
                    </Button>
                  </motion.div>

                  {/* Refresh Cart */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => {
                        window.location.reload()
                      }}
                      className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                      size="lg"
                    >
                      <RefreshCw className="h-5 w-5" />
                      Recargar Página
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>localStorage Monitor</CardTitle>
                <CardDescription>Datos persistidos en el navegador (ndv_* keys)</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(localStorage).length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay datos almacenados</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {Object.entries(localStorage).map(([key, value]) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-xs font-medium text-gray-600 truncate">
                            {key}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(key, key)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedKey === key ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                            Ver contenido ({(value?.length || 0)} caracteres)
                          </summary>
                          <div className="mt-2 bg-white border border-gray-300 rounded p-2 font-mono text-xs overflow-x-auto max-h-40 overflow-y-auto">
                            <pre className="text-gray-800 whitespace-pre-wrap break-words">
                              {value}
                            </pre>
                          </div>
                        </details>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Escenarios de Testing</CardTitle>
                  <CardDescription>Casos de uso para validación E2E</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <TestScenario
                      number={1}
                      title="Agregar un producto"
                      steps={[
                        'Click en "Agregar Producto Test"',
                        'Verifica que el contador del carrito aumenta',
                        'Verifica que aparece la notificación verde de éxito',
                        'Verifica que el producto aparece en el resumen'
                      ]}
                    />

                    <TestScenario
                      number={2}
                      title="Agregar múltiples productos"
                      steps={[
                        'Click en "Agregar 3 Productos"',
                        'Verifica que se agregan 3 items secuencialmente',
                        'Verifica que el total se calcula correctamente',
                        'Verifica que el localStorage se actualiza'
                      ]}
                    />

                    <TestScenario
                      number={3}
                      title="Actualizar cantidad"
                      steps={[
                        'Agrega un producto',
                        'Click en el botón + para aumentar cantidad',
                        'Verifica que la cantidad cambia en la UI',
                        'Verifica que el subtotal se recalcula'
                      ]}
                    />

                    <TestScenario
                      number={4}
                      title="Remover producto"
                      steps={[
                        'Agrega un producto',
                        'Click en el botón ✕ para remover',
                        'Verifica que se elimina del carrito',
                        'Verifica que aparece notificación de éxito'
                      ]}
                    />

                    <TestScenario
                      number={5}
                      title="Persistencia en localStorage"
                      steps={[
                        'Agrega algunos productos',
                        'Abre la tab "Storage"',
                        'Verifica que hay datos en localStorage',
                        'Recarga la página',
                        'Verifica que los productos persisten'
                      ]}
                    />

                    <TestScenario
                      number={6}
                      title="Vaciar carrito"
                      steps={[
                        'Agrega varios productos',
                        'Click en "Limpiar Carrito"',
                        'Verifica que se eliminan todos',
                        'Verifica que el contador llega a 0',
                        'Verifica que localStorage se limpia'
                      ]}
                    />

                    <TestScenario
                      number={7}
                      title="Abrir drawer del carrito"
                      steps={[
                        'Agrega un producto',
                        'Click en el icono del carrito en la nav',
                        'Verifica que se abre el drawer desde la derecha',
                        'Verifica que muestra el contador animado',
                        'Verifica que aparecen los botones de acción'
                      ]}
                    />

                    <TestScenario
                      number={8}
                      title="Estados de carga"
                      steps={[
                        'Abre las DevTools (F12)',
                        'Mira la tab Network y ralentiza la conexión',
                        'Agrega un producto',
                        'Verifica que aparece el estado "Cargando..."',
                        'Verifica que los botones se deshabilitan'
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

interface TestScenarioProps {
  number: number
  title: string
  steps: string[]
}

function TestScenario({ number, title, steps }: TestScenarioProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
            {number}
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <ol className="mt-2 space-y-1 text-sm text-gray-600">
            {steps.map((step, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-gray-400">{String.fromCharCode(97 + idx)})</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </motion.div>
  )
}
