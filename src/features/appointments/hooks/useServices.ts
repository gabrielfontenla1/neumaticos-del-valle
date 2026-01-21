import { useEffect, useState } from 'react'
import { Service } from '../types'

export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        // Transform database services to match the Service interface
        const transformedServices: Service[] = (data.services || []).map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: parseFloat(service.price),
          voucherEligible: service.id === 'tire-repair' // Keep this logic for backwards compatibility
        }))

        setServices(transformedServices)
      } else {
        setError('Failed to fetch services')
      }
    } catch (err) {
      console.error('Error fetching services:', err)
      setError('Error loading services')
    } finally {
      setLoading(false)
    }
  }

  return {
    services,
    loading,
    error,
    refetch: fetchServices
  }
}
