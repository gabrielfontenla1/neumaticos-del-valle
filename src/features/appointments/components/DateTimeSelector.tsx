// Date and Time Selector Component

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertCircle } from 'lucide-react'
import type { TimeSlot } from '../types'

interface DateTimeSelectorProps {
  selectedDate?: string
  selectedTime?: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  getTimeSlots: (date: string) => Promise<TimeSlot[]>
}

export function DateTimeSelector({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  getTimeSlots
}: DateTimeSelectorProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  // Maximum 30 days in advance
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  // Load time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate)
    }
  }, [selectedDate])

  const loadTimeSlots = async (date: string) => {
    setLoadingSlots(true)
    try {
      const slots = await getTimeSlots(date)
      setTimeSlots(slots)
    } catch (error) {
      console.error('Error loading time slots:', error)
      setTimeSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    onDateChange(newDate)
    // Reset time selection when date changes
    onTimeChange('')
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr + 'T12:00:00')
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    return date.toLocaleDateString('es-AR', options)
  }

  // Check if date is weekend
  const isWeekend = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    const day = date.getDay()
    return day === 0 // Sunday
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Selecciona Fecha y Hora</h3>

      {/* Date Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          <Calendar className="inline w-4 h-4 mr-2" />
          Fecha del turno
        </label>
        <input
          type="date"
          value={selectedDate || ''}
          onChange={handleDateChange}
          min={today}
          max={maxDateStr}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          required
        />
        {selectedDate && (
          <p className="text-sm text-gray-600">
            {formatDate(selectedDate)}
            {isWeekend(selectedDate) && (
              <span className="ml-2 text-orange-600 font-medium">
                (Domingo - Cerrado)
              </span>
            )}
          </p>
        )}
      </div>

      {/* Time Selection */}
      {selectedDate && !isWeekend(selectedDate) && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            <Clock className="inline w-4 h-4 mr-2" />
            Hora del turno
          </label>

          {loadingSlots ? (
            <div className="text-center py-8 text-gray-500">
              Cargando horarios disponibles...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.map((slot) => {
                  const isSelected = slot.time === selectedTime
                  const isAvailable = slot.available

                  return (
                    <button
                      key={slot.time}
                      onClick={() => isAvailable && onTimeChange(slot.time)}
                      disabled={!isAvailable}
                      className={`
                        px-3 py-2 rounded-md font-medium text-sm transition-all
                        ${isSelected
                          ? 'bg-red-600 text-white'
                          : isAvailable
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                        }
                      `}
                    >
                      {slot.time}
                    </button>
                  )
                })}
              </div>

              {timeSlots.filter(s => s.available).length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      No hay horarios disponibles para esta fecha.
                      Por favor, selecciona otro día.
                    </span>
                  </p>
                </div>
              )}

              {selectedTime && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Horario seleccionado:</strong> {selectedTime} hs
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedDate && isWeekend(selectedDate) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>
              Los domingos no atendemos. Por favor, selecciona otro día.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}