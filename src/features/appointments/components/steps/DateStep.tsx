'use client'

import { Calendar, ChevronRight } from 'lucide-react'
import { format, addDays, isWeekend, isSunday } from 'date-fns'
import { es } from 'date-fns/locale'

interface DateStepProps {
  selectedDate?: string
  onSelect: (date: string) => void
}

export default function DateStep({ selectedDate, onSelect }: DateStepProps) {
  // Generar los próximos 7 días
  const today = new Date()
  const nextSevenDays = Array.from({ length: 7 }, (_, i) => {
    return addDays(today, i)
  })

  // Función para verificar si una tienda está abierta ese día
  const isStoreOpen = (date: Date) => {
    // Los domingos están cerrados
    if (isSunday(date)) return false
    return true
  }

  // Función para obtener el horario del día
  const getSchedule = (date: Date) => {
    if (!isStoreOpen(date)) return 'Cerrado'
    if (isWeekend(date) && !isSunday(date)) {
      return '08:30 - 13:00' // Sábado
    }
    return '08:30 - 19:00' // Lunes a Viernes
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Selecciona el Día
        </h3>
        <p className="text-gray-600">
          Elige el día que prefieras para tu turno
        </p>
      </div>

      <div className="space-y-3">
        {nextSevenDays.map((date) => {
          const dateString = format(date, 'yyyy-MM-dd')
          const isSelected = selectedDate === dateString
          const isOpen = isStoreOpen(date)
          const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

          return (
            <button
              key={dateString}
              onClick={() => isOpen && onSelect(dateString)}
              disabled={!isOpen}
              className={`
                w-full p-4 rounded-lg border-2 transition-all text-left
                ${isSelected
                  ? 'border-[#FEE004] bg-yellow-50 shadow-md'
                  : isOpen
                  ? 'border-gray-200 bg-white hover:border-[#FEE004] hover:shadow-sm'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                }
              `}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-start gap-4">
                  <div className={`
                    p-3 rounded-lg
                    ${isSelected
                      ? 'bg-yellow-100 text-black'
                      : isOpen
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-gray-50 text-gray-400'
                    }
                  `}>
                    <Calendar className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {format(date, 'EEEE', { locale: es })}
                      </h4>
                      {isToday && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          HOY
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">
                      {format(date, "d 'de' MMMM", { locale: es })}
                    </p>
                    <p className={`text-sm mt-1 ${isOpen ? 'text-gray-500' : 'text-red-500'}`}>
                      {isOpen ? `Horario: ${getSchedule(date)}` : 'Cerrado'}
                    </p>
                  </div>
                </div>

                {isOpen && (
                  <ChevronRight className={`
                    w-5 h-5 transition-colors
                    ${isSelected ? 'text-black' : 'text-gray-400'}
                  `} />
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Selecciona un día de lunes a sábado. Los domingos permanecemos cerrados.
        </p>
      </div>
    </div>
  )
}