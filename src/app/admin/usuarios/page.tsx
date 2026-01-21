'use client'

import { useState } from 'react'
import { useAuth } from '@/features/admin/hooks/useAuth'
import { useUsers } from '@/features/admin/hooks/useUsers'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import {
  UsersHeader,
  UsersStatsCards,
  UsersFilters,
  UsersTable,
  UsersFooter,
  CreateUserDialog,
  ChangeRoleDialog
} from '@/features/admin/components/users'

export default function UsersManagementPage() {
  const { session } = useAuth()
  const {
    filteredUsers,
    isLoading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    stats,
    loadUsers,
    createUser,
    updateRole,
    selectedUser,
    setSelectedUser,
    pendingRole,
    setPendingRole
  } = useUsers()

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Handlers
  const handleCreateUser = () => {
    setShowCreateDialog(true)
  }

  const handleSubmitCreateUser = async (data: { email: string; password: string; fullName: string; role: 'admin' | 'vendedor' }) => {
    setIsCreating(true)
    const result = await createUser(data)
    setIsCreating(false)

    if (result.success) {
      setShowCreateDialog(false)
    }
  }

  const handleRoleChange = (user: typeof selectedUser, newRole: 'admin' | 'vendedor') => {
    setSelectedUser(user)
    setPendingRole(newRole)
    setShowChangeRoleDialog(true)
  }

  const handleConfirmRoleChange = async () => {
    if (!selectedUser || !pendingRole) return

    setIsUpdating(true)
    await updateRole(selectedUser.id, pendingRole)
    setIsUpdating(false)

    setShowChangeRoleDialog(false)
    setSelectedUser(null)
    setPendingRole(null)
  }

  // Loading state
  if (isLoading && filteredUsers.length === 0) {
    return (
      <div className="p-6">
        <TableSkeleton rows={8} columns={5} />
      </div>
    )
  }

  return (
    <main className="p-6 space-y-6 bg-[#30302e] min-h-screen">
      {/* Header */}
      <UsersHeader
        totalUsers={stats.total}
        filteredCount={filteredUsers.length}
        onCreateUser={handleCreateUser}
        onReload={loadUsers}
        isLoading={isLoading}
      />

      {/* Stats Cards */}
      <UsersStatsCards stats={stats} />

      {/* Filters */}
      <UsersFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      {/* Users Table */}
      <UsersTable
        users={filteredUsers}
        currentUserId={session?.user?.id || ''}
        onRoleChange={handleRoleChange}
        isLoading={isLoading}
      />

      {/* Footer */}
      <UsersFooter totalUsers={stats.total} stats={stats} />

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleSubmitCreateUser}
        isCreating={isCreating}
      />

      {/* Change Role Dialog */}
      <ChangeRoleDialog
        open={showChangeRoleDialog}
        onOpenChange={setShowChangeRoleDialog}
        user={selectedUser}
        newRole={pendingRole}
        onConfirm={handleConfirmRoleChange}
        isUpdating={isUpdating}
      />
    </main>
  )
}
