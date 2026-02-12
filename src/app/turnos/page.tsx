// Appointments Page
import { Suspense } from 'react'
import { AppointmentWizard } from '@/features/appointments/components/AppointmentWizard'
import { Loader2 } from 'lucide-react'

function AppointmentLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando...</h2>
            <p className="text-gray-600">Un momento por favor</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<AppointmentLoading />}>
      <AppointmentWizard />
    </Suspense>
  )
}
