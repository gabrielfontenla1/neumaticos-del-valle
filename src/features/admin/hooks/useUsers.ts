'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { getUsers, createUser as apiCreateUser, updateUserRole as apiUpdateUserRole } from '@/features/admin/api'
import type { User, CreateUserData, UsersStats } from '@/features/admin/types/user'

export interface UseUsersReturn {
  // Data
  users: User[]
  filteredUsers: User[]
  isLoading: boolean
  error: string | null

  // Filters
  searchTerm: string
  setSearchTerm: (value: string) => void
  roleFilter: string
  setRoleFilter: (value: string) => void

  // Stats
  stats: UsersStats

  // Actions
  loadUsers: () => Promise<void>
  createUser: (data: CreateUserData) => Promise<{ success: boolean; error?: string }>
  updateRole: (userId: string, newRole: 'admin' | 'vendedor') => Promise<{ success: boolean; error?: string }>

  // Dialog state
  selectedUser: User | null
  setSelectedUser: (user: User | null) => void
  pendingRole: 'admin' | 'vendedor' | null
  setPendingRole: (role: 'admin' | 'vendedor' | null) => void
}

export function useUsers(): UseUsersReturn {
  // State
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [pendingRole, setPendingRole] = useState<'admin' | 'vendedor' | null>(null)

  // Load users on mount
  useEffect(() => {
    loadUsers()
  }, [])

  // Load users function
  const loadUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { data, error: fetchError } = await getUsers()

      if (fetchError) {
        setError(fetchError)
        toast.error('Error al cargar usuarios')
      } else {
        setUsers(data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast.error('Error al cargar usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtered users (memoized)
  const filteredUsers = useMemo(() => {
    let filtered = users

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    return filtered
  }, [users, searchTerm, roleFilter])

  // Stats (memoized)
  const stats = useMemo<UsersStats>(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    vendedores: users.filter(u => u.role === 'vendedor').length,
  }), [users])

  // Create user
  const createUser = async (data: CreateUserData): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validation
      if (!data.email || !data.password || !data.fullName) {
        toast.error('Por favor completa todos los campos')
        return { success: false, error: 'Campos incompletos' }
      }

      if (data.password.length < 8) {
        toast.error('La contraseña debe tener al menos 8 caracteres')
        return { success: false, error: 'Contraseña muy corta' }
      }

      const { success, error: apiError, message } = await apiCreateUser(
        data.email,
        data.password,
        data.fullName,
        data.role
      )

      if (success) {
        toast.success(message || 'Usuario creado exitosamente')
        await loadUsers()
        return { success: true }
      } else {
        toast.error(`Error: ${apiError}`)
        return { success: false, error: apiError || undefined }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al crear usuario: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  // Update user role
  const updateRole = async (userId: string, newRole: 'admin' | 'vendedor'): Promise<{ success: boolean; error?: string }> => {
    try {
      const { success, error: apiError } = await apiUpdateUserRole(userId, newRole)

      if (success) {
        toast.success('Rol actualizado correctamente')
        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        )
        return { success: true }
      } else {
        toast.error(`Error al actualizar rol: ${apiError}`)
        return { success: false, error: apiError || undefined }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al actualizar rol: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  return {
    // Data
    users,
    filteredUsers,
    isLoading,
    error,

    // Filters
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,

    // Stats
    stats,

    // Actions
    loadUsers,
    createUser,
    updateRole,

    // Dialog state
    selectedUser,
    setSelectedUser,
    pendingRole,
    setPendingRole,
  }
}
