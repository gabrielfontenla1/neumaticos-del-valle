'use client'

import { Clock, CheckCircle } from 'lucide-react'
import { format, parseISO, isWeekend, isSunday } from 'date-fns'
import { es } from 'date-fns/locale'
import { TIME_SLOTS } from '../../types'

interface TimeStepProps {
  selectedDate: string
  selectedTime?: string
  onSelect: (time: string) => void
  getTimeSlots?: (date: string) => Promise<any[]>
}

export default function TimeStep({
  selectedDate,
  selectedTime,
  onSelect,
  getTimeSlots
}: TimeStepProps) {

  // Filtrar horarios según el día seleccionado
  const getAvailableSlots = () => {
    if (!selectedDate) return []

    const date = parseISO(selectedDate)

    // Si es domingo, no hay horarios
    if (isSunday(date)) return []

    // Si es sábado, solo hasta las 13:00
    if (isWeekend(date) && !isSunday(date)) {
      return TIME_SLOTS.filter(time => {
        const hour = parseInt(time.split(':')[0])
        return hour >= 9 && hour < 13
      })
    }

    // Días de semana: horario completo
    return TIME_SLOTS
  }

  const availableSlots = getAvailableSlots()

  // Agrupar horarios por período del día
  const morningSlots = availableSlots.filter(time => {
    const hour = parseInt(time.split(':')[0])
    return hour < 12
  })

  const afternoonSlots = availableSlots.filter(time => {
    const hour = parseInt(time.split(':')[0])
    return hour >= 12
  })

  const formatSelectedDate = () => {
    if (!selectedDate) return ''
    const date = parseISO(selectedDate)
    return format(date, "EEEE d 'de' MMMM", { locale: es })
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Selecciona la Hora
        </h3>
        <p className="text-gray-600">
          Horarios disponibles para el <span className="font-semibold capitalize">{formatSelectedDate()}</span>
        </p>
      </div>

      {morningSlots.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">MAÑANA</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {morningSlots.map((time) => {
              const isSelected = selectedTime === time

              return (
                <button
                  key={time}
                  onClick={() => onSelect(time)}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all
                    ${isSelected
                      ? 'border-red-600 bg-red-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="text-center">
                    <span className={`font-semibold ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                      {time}
                    </span>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-red-600 mx-auto mt-1" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {afternoonSlots.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">TARDE</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {afternoonSlots.map((time) => {
              const isSelected = selectedTime === time

              return (
                <button
                  key={time}
                  onClick={() => onSelect(time)}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all
                    ${isSelected
                      ? 'border-red-600 bg-red-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="text-center">
                    <span className={`font-semibold ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                      {time}
                    </span>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-red-600 mx-auto mt-1" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {availableSlots.length === 0 && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            No hay horarios disponibles para este día
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
          <div>
            <p className="text-sm text-gray-700 font-medium mb-1">
              Duración estimada del servicio
            </p>
            <p className="text-sm text-gray-600">
              Tu servicio tomará aproximadamente 30-60 minutos dependiendo del tipo de servicio seleccionado.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}