// Users Management Page - Exact Rapicompras Style
'use client'

import { useState, useEffect } from 'react'
import { Users, Shield, UserCog, Search, Plus, ChevronRight, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/features/admin/hooks/useAuth'
import { getUsers, updateUserRole, createUser } from '@/features/admin/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'

// Exact colors from rapicompras darkColors theme
const colors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  input: '#262626',
  secondary: '#262626',
}

interface User {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'vendedor'
  created_at: string
  last_sign_in_at: string | null
}

export default function UsersManagementPage() {
  const { session } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<'admin' | 'vendedor' | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // New user creation state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'vendedor' as 'admin' | 'vendedor'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const loadUsers = async () => {
    setIsLoading(true)
    const { data, error } = await getUsers()
    if (!error) {
      setUsers(data)
    }
    setIsLoading(false)
  }

  const filterUsers = () => {
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

    setFilteredUsers(filtered)
  }

  const handleRoleChange = (user: User, role: 'admin' | 'vendedor') => {
    setSelectedUser(user)
    setNewRole(role)
    setShowConfirmDialog(true)
  }

  const confirmRoleChange = async () => {
    if (!selectedUser || !newRole) return

    setIsUpdating(true)
    const { success, error } = await updateUserRole(selectedUser.id, newRole)

    if (success) {
      // Update local state
      setUsers(users.map(user =>
        user.id === selectedUser.id
          ? { ...user, role: newRole }
          : user
      ))
    } else {
      console.error('Error updating role:', error)
    }

    setIsUpdating(false)
    setShowConfirmDialog(false)
    setSelectedUser(null)
    setNewRole(null)
  }

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.fullName) {
      alert('Por favor completa todos los campos')
      return
    }

    setIsCreating(true)
    const { success, error, message } = await createUser(
      newUserData.email,
      newUserData.password,
      newUserData.fullName,
      newUserData.role
    )

    if (success) {
      alert(message || 'Usuario creado exitosamente')
      // Reload users
      await loadUsers()
      // Reset form
      setNewUserData({
        email: '',
        password: '',
        fullName: '',
        role: 'vendedor'
      })
      setShowCreateDialog(false)
    } else {
      alert(`Error: ${error}`)
    }

    setIsCreating(false)
  }

  const getRoleLabel = (role: 'admin' | 'vendedor' | null) => {
    if (role === 'admin') return 'Admin'
    if (role === 'vendedor') return 'Vendedor'
    return 'Vendedor'
  }

  const getRoleColor = (role: 'admin' | 'vendedor') => {
    return role === 'admin'
      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      : 'bg-green-500/10 text-green-600 border-green-500/20'
  }

  const getUserInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    vendedores: users.filter(u => u.role === 'vendedor').length,
  }

  if (isLoading) {
    return (
      <div>
        <TableSkeleton rows={6} columns={4} />
      </div>
    )
  }

  return (
    <main className="p-6 space-y-6">
      {/* Header Card */}
        <motion.div
          className="rounded-lg shadow-xl p-6"
          style={{
            backgroundColor: colors.card,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: colors.foreground }}>
                Gestión de Usuarios
              </h1>
              <p className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                {filteredUsers.length} de {users.length} usuarios
              </p>
            </div>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-all hover:opacity-90"
              style={{
                backgroundColor: colors.primary,
                color: '#ffffff'
              }}
            >
              <Plus className="w-5 h-5" />
              Nuevo Usuario
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Usuarios', value: stats.total, Icon: Users, color: colors.foreground },
            { label: 'Administradores', value: stats.admins, Icon: Shield, color: '#3b82f6' },
            { label: 'Vendedores', value: stats.vendedores, Icon: UserCog, color: '#10b981' }
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-6"
              style={{
                backgroundColor: colors.card,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: colors.mutedForeground }}>
                  {stat.label}
                </p>
                <stat.Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: colors.card,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg outline-none"
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground
                }}
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5" style={{ color: colors.mutedForeground }} />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg outline-none"
              style={{
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.foreground
              }}
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="vendedor">Vendedores</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: colors.card,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)'
          }}
        >
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 mb-3" style={{ color: colors.mutedForeground }} />
              <p style={{ color: colors.mutedForeground }}>No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: colors.border }}>
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 transition-all cursor-pointer"
                  style={{ borderBottom: `1px solid ${colors.border}` }}
                >
                      {/* Avatar */}
                      <Avatar className="h-11 w-11">
                        <AvatarFallback
                          className="font-bold text-sm"
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}40, ${colors.primary}20)`,
                            color: colors.primary
                          }}
                        >
                          {getUserInitials(user.full_name, user.email)}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate" style={{ color: colors.foreground }}>
                            {user.full_name || user.email}
                          </p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              user.role === 'admin'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                            }`}
                          >
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" style={{ color: colors.mutedForeground }} />
                          <p className="text-xs truncate" style={{ color: colors.mutedForeground }}>
                            {user.email}
                          </p>
                        </div>
                      </div>

                  {/* Role Selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value as 'admin' | 'vendedor')}
                      disabled={user.id === session?.user.id}
                      className="h-8 px-3 text-xs border rounded-lg transition-all outline-none"
                      style={{
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                        color: colors.foreground,
                        opacity: user.id === session?.user.id ? 0.5 : 1,
                        cursor: user.id === session?.user.id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="admin">Administrador</option>
                      <option value="vendedor">Vendedor</option>
                    </select>
                    <ChevronRight className="h-4 w-4" style={{ color: colors.mutedForeground }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note for current user */}
        <p className="text-xs text-center" style={{ color: colors.mutedForeground }}>
          No puedes cambiar tu propio rol de usuario
        </p>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-sm" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg" style={{ color: colors.foreground }}>
              Cambiar Rol
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm" style={{ color: colors.mutedForeground }}>
              ¿Cambiar el rol de <strong>{selectedUser?.full_name || selectedUser?.email}</strong> a{' '}
              <strong>{getRoleLabel(newRole)}</strong>?
              <br /><br />
              <span className="text-xs">Este cambio afectará los permisos del usuario.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <button
              onClick={() => setShowConfirmDialog(false)}
              disabled={isUpdating}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: colors.background,
                color: colors.foreground,
                border: `1px solid ${colors.border}`
              }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmRoleChange}
              disabled={isUpdating}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: colors.primary,
                color: '#ffffff'
              }}
            >
              {isUpdating ? 'Actualizando...' : 'Confirmar'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent className="max-w-md" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg" style={{ color: colors.foreground }}>
              Nuevo Usuario
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm" style={{ color: colors.mutedForeground }}>
              Completa los datos para crear una cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 py-4">
            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-xs font-medium" style={{ color: colors.mutedForeground }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="usuario@empresa.com"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                disabled={isCreating}
                className="h-10 px-3 text-sm border rounded-lg transition-all outline-none"
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="fullName" className="text-xs font-medium" style={{ color: colors.mutedForeground }}>
                Nombre Completo
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={newUserData.fullName}
                onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                disabled={isCreating}
                className="h-10 px-3 text-sm border rounded-lg transition-all outline-none"
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="password" className="text-xs font-medium" style={{ color: colors.mutedForeground }}>
                Contraseña Temporal
              </label>
              <input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                disabled={isCreating}
                className="h-10 px-3 text-sm border rounded-lg transition-all outline-none"
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground
                }}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="role" className="text-xs font-medium" style={{ color: colors.mutedForeground }}>
                Rol
              </label>
              <select
                id="role"
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as 'admin' | 'vendedor' })}
                disabled={isCreating}
                className="h-10 px-3 text-sm border rounded-lg transition-all outline-none"
                style={{
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground
                }}
              >
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <AlertDialogFooter>
            <button
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: colors.background,
                color: colors.foreground,
                border: `1px solid ${colors.border}`
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateUser}
              disabled={isCreating}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: colors.primary,
                color: '#ffffff'
              }}
            >
              {isCreating ? 'Creando...' : 'Crear'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
