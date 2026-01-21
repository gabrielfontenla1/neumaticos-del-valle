'use client'

import { useState } from 'react'
import { useAppointments } from '@/features/admin/hooks/useAppointments'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import {
  AppointmentsHeader,
  AppointmentsStatsCards,
  AppointmentsFilters,
  AppointmentsTable,
  AppointmentsFooter,
  ViewAppointmentDialog,
  ConfirmAppointmentDialog,
  CancelAppointmentDialog,
  CompleteAppointmentDialog,
} from '@/features/admin/components/appointments'
import type { Appointment } from '@/features/admin/types/appointment'

export default function TurnosPage() {
  const {
    filteredAppointments,
    branches,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    branchFilter,
    setBranchFilter,
    sortBy,
    sortOrder,
    toggleSort,
    stats,
    loadAppointments,
    confirmAppointment,
    cancelAppointment,
    completeAppointment,
  } = useAppointments()

  // Dialog states
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  // Dialog handlers
  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowViewDialog(true)
  }

  const handleConfirmClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowConfirmDialog(true)
  }

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowCancelDialog(true)
  }

  const handleCompleteClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowCompleteDialog(true)
  }

  const handleConfirmAppointment = async (id: string, data: any) => {
    setIsConfirming(true)
    const result = await confirmAppointment(id, data)
    setIsConfirming(false)
    return result
  }

  const handleCancelAppointment = async (id: string, reason?: string) => {
    setIsCancelling(true)
    const result = await cancelAppointment(id, reason)
    setIsCancelling(false)
    return result
  }

  const handleCompleteAppointment = async (id: string, notes?: string) => {
    setIsCompleting(true)
    const result = await completeAppointment(id, notes)
    setIsCompleting(false)
    return result
  }

  // Loading state
  if (isLoading && filteredAppointments.length === 0) {
    return (
      <div className="p-6 bg-[#30302e] min-h-screen">
        <TableSkeleton rows={8} columns={7} />
      </div>
    )
  }

  return (
    <main className="p-6 space-y-6 bg-[#30302e] min-h-screen">
      {/* Header */}
      <AppointmentsHeader
        totalAppointments={stats.total}
        filteredCount={filteredAppointments.length}
        onReload={loadAppointments}
        isLoading={isLoading}
      />

      {/* Stats Cards */}
      <AppointmentsStatsCards stats={stats} />

      {/* Filters */}
      <AppointmentsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        branchFilter={branchFilter}
        onBranchFilterChange={setBranchFilter}
        branches={branches}
      />

      {/* Appointments Table */}
      <AppointmentsTable
        appointments={filteredAppointments}
        isLoading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onToggleSort={toggleSort}
        onViewAppointment={handleViewAppointment}
        onConfirmAppointment={handleConfirmClick}
        onCancelAppointment={handleCancelClick}
        onCompleteAppointment={handleCompleteClick}
      />

      {/* Footer */}
      <AppointmentsFooter totalAppointments={stats.total} stats={stats} />

      {/* Dialogs */}
      <ViewAppointmentDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        appointment={selectedAppointment}
      />

      <ConfirmAppointmentDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        appointment={selectedAppointment}
        onConfirm={handleConfirmAppointment}
        isConfirming={isConfirming}
      />

      <CancelAppointmentDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        appointment={selectedAppointment}
        onCancel={handleCancelAppointment}
        isCancelling={isCancelling}
      />

      <CompleteAppointmentDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        appointment={selectedAppointment}
        onComplete={handleCompleteAppointment}
        isCompleting={isCompleting}
      />
    </main>
  )
}
