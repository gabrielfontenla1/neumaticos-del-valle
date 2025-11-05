'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader, CheckCircle, AlertCircle, PlayCircle, RefreshCw, Copy, Download } from 'lucide-react'

interface ApiResponse {
  timestamp: string
  endpoint: string
  method: string
  status: number
  statusText: string
  data: any
  duration: number
  error?: string
}

interface TestLog {
  id: string
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  details?: any
}

const TestOrdersPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(false)
  const [testLogs, setTestLogs] = useState<TestLog[]>([])
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [lastResponses, setLastResponses] = useState<ApiResponse[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [testLogs])

  // Add log entry
  const addLog = useCallback(
    (type: TestLog['type'], message: string, details?: any) => {
      const log: TestLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        details,
      }
      setTestLogs(prev => [...prev, log])
    },
    []
  )

  // Check system health
  const checkSystemHealth = useCallback(async () => {
    setIsLoading(true)
    addLog('info', 'Checking system health...')

    try {
      const response = await fetch('/api/health', { method: 'GET' })
      const data = await response.json()

      recordResponse({
        endpoint: '/api/health',
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        data,
        duration: 0,
      })

      if (response.ok) {
        setSystemHealth(data)
        addLog('success', 'System is healthy ✓', data)
      } else {
        addLog('error', 'System health check failed', data)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      addLog('error', `Health check failed: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }, [addLog])

  // Create test order
  const createTestOrder = useCallback(async () => {
    setIsLoading(true)
    addLog('info', 'Creating test order...')

    const testOrderData = {
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+58-412-1234567',
      items: [
        {
          product_id: '1',
          product_name: 'Test Tire',
          sku: 'TEST-SKU-001',
          quantity: 2,
          unit_price: 100.0,
          total_price: 200.0,
          brand: 'Test Brand',
          model: 'Test Model',
        },
      ],
      subtotal: 200.0,
      tax: 32.0,
      shipping: 0,
      payment_method: 'cash',
      source: 'website',
    }

    try {
      const startTime = Date.now()
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testOrderData),
      })
      const duration = Date.now() - startTime
      const data = await response.json()

      recordResponse({
        endpoint: '/api/orders',
        method: 'POST',
        status: response.status,
        statusText: response.statusText,
        data,
        duration,
      })

      if (response.ok && data.success) {
        addLog('success', `Order created: ${data.order.order_number}`, data.order)
      } else {
        addLog('error', `Failed to create order: ${data.error || 'Unknown error'}`, data)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      addLog('error', `Create order failed: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }, [addLog])

  // List orders
  const listOrders = useCallback(async () => {
    setIsLoading(true)
    addLog('info', 'Fetching orders list...')

    try {
      const startTime = Date.now()
      const response = await fetch('/api/admin/orders?limit=10&page=1', { method: 'GET' })
      const duration = Date.now() - startTime
      const data = await response.json()

      recordResponse({
        endpoint: '/api/admin/orders',
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
        data,
        duration,
      })

      if (response.ok && data.success) {
        addLog('success', `Found ${data.total} orders`, data)
      } else {
        addLog('error', `Failed to list orders: ${data.error || 'Unknown error'}`, data)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      addLog('error', `List orders failed: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }, [addLog])

  // Update order status
  const updateOrderStatus = useCallback(
    async (orderId: string, newStatus: string) => {
      setIsLoading(true)
      addLog('info', `Updating order ${orderId} status to ${newStatus}...`)

      try {
        const startTime = Date.now()
        const response = await fetch(`/api/admin/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })
        const duration = Date.now() - startTime
        const data = await response.json()

        recordResponse({
          endpoint: `/api/admin/orders/${orderId}`,
          method: 'PATCH',
          status: response.status,
          statusText: response.statusText,
          data,
          duration,
        })

        if (response.ok && data.success) {
          addLog('success', `Order status updated to ${newStatus}`, data.order)
        } else {
          addLog('error', `Failed to update order: ${data.error || 'Unknown error'}`, data)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        addLog('error', `Update order failed: ${message}`)
      } finally {
        setIsLoading(false)
      }
    },
    [addLog]
  )

  // Record API response
  const recordResponse = (response: Omit<ApiResponse, 'timestamp'>) => {
    const newResponse: ApiResponse = {
      ...response,
      timestamp: new Date().toISOString(),
    }
    setLastResponses(prev => [newResponse, ...prev].slice(0, 10))
  }

  // Clear logs
  const clearLogs = useCallback(() => {
    setTestLogs([])
    addLog('info', 'Logs cleared')
  }, [addLog])

  // Export logs
  const exportLogs = useCallback(() => {
    const data = JSON.stringify(testLogs, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-logs-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [testLogs])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Orders System Testing</h1>
              <p className="text-slate-600 mt-2">
                Comprehensive testing dashboard for the orders management system
              </p>
            </div>
            <Badge className="h-fit">{testLogs.length} logs</Badge>
          </div>
        </div>

        {/* System Health Alert */}
        {systemHealth && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✅ System is healthy. All checks passed.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="responses">API Responses</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common operations for testing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={checkSystemHealth}
                    disabled={isLoading}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                    Check System Health
                  </Button>
                  <Button
                    onClick={createTestOrder}
                    disabled={isLoading}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                    Create Test Order
                  </Button>
                  <Button
                    onClick={listOrders}
                    disabled={isLoading}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                    List All Orders
                  </Button>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    <p className="text-lg font-semibold">
                      {systemHealth ? (
                        <span className="text-green-600">✅ Healthy</span>
                      ) : (
                        <span className="text-gray-600">Unknown</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Logs</p>
                    <p className="text-lg font-semibold">{testLogs.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Last Check</p>
                    <p className="text-sm font-mono">
                      {testLogs.length > 0 ? testLogs[testLogs.length - 1].timestamp : 'Never'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Test Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Test Summary</CardTitle>
                <CardDescription>Overview of test results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-600 font-medium">Success</p>
                    <p className="text-2xl font-bold text-green-700">
                      {testLogs.filter(l => l.type === 'success').length}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600 font-medium">Errors</p>
                    <p className="text-2xl font-bold text-red-700">
                      {testLogs.filter(l => l.type === 'error').length}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-600 font-medium">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {testLogs.filter(l => l.type === 'warning').length}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium">Info</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {testLogs.filter(l => l.type === 'info').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Tests</CardTitle>
                <CardDescription>Test individual API endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2">Health Check</h3>
                    <Button onClick={checkSystemHealth} disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Run Health Check
                        </>
                      )}
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Order Operations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Button onClick={createTestOrder} disabled={isLoading} variant="outline">
                        {isLoading ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Create Order
                          </>
                        )}
                      </Button>
                      <Button onClick={listOrders} disabled={isLoading} variant="outline">
                        {isLoading ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            List Orders
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Responses Tab */}
          <TabsContent value="responses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent API Responses</CardTitle>
                <CardDescription>Last 10 API calls</CardDescription>
              </CardHeader>
              <CardContent>
                {lastResponses.length === 0 ? (
                  <p className="text-slate-600">No API calls yet. Run a test to see responses.</p>
                ) : (
                  <div className="space-y-4">
                    {lastResponses.map((response, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-slate-50">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-sm">
                              {response.method} {response.endpoint}
                            </p>
                            <p className="text-xs text-slate-600">{response.timestamp}</p>
                          </div>
                          <Badge
                            className={
                              response.status < 300
                                ? 'bg-green-100 text-green-800'
                                : response.status < 400
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }
                          >
                            {response.status} {response.statusText}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">Duration: {response.duration}ms</p>
                        <details className="text-xs">
                          <summary className="cursor-pointer font-medium text-slate-700">Response Data</summary>
                          <pre className="mt-2 p-2 bg-white rounded border border-slate-200 overflow-auto max-h-48">
                            {JSON.stringify(response.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Test Logs</CardTitle>
                    <CardDescription>Real-time test execution logs</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={clearLogs}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={exportLogs}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4 bg-slate-950">
                  {testLogs.length === 0 ? (
                    <p className="text-slate-500 text-sm">No logs yet. Run a test to see logs.</p>
                  ) : (
                    testLogs.map(log => {
                      const colors = {
                        success: 'text-green-400',
                        error: 'text-red-400',
                        warning: 'text-yellow-400',
                        info: 'text-blue-400',
                      }
                      return (
                        <div key={log.id} className={`font-mono text-sm ${colors[log.type]}`}>
                          <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
                          {log.details && (
                            <details className="ml-4 text-xs text-slate-400">
                              <summary>Details</summary>
                              <pre className="mt-1 p-2 bg-slate-900 rounded overflow-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      )
                    })
                  )}
                  <div ref={logsEndRef} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default TestOrdersPage
