// User Management Types

export interface User {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'vendedor'
  created_at: string
  last_sign_in_at: string | null
}

export interface CreateUserData {
  email: string
  password: string
  fullName: string
  role: 'admin' | 'vendedor'
}

export interface UsersStats {
  total: number
  admins: number
  vendedores: number
}

export interface UserRowProps {
  user: User
  isCurrentUser: boolean
  onRoleChange: (newRole: 'admin' | 'vendedor') => void
}

export interface UsersHeaderProps {
  totalUsers: number
  filteredCount: number
  onCreateUser: () => void
  onReload: () => Promise<void>
  isLoading: boolean
}

export interface UsersStatsCardsProps {
  stats: UsersStats
}

export interface UsersFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  roleFilter: string
  onRoleFilterChange: (value: string) => void
}

export interface UsersTableProps {
  users: User[]
  currentUserId: string
  onRoleChange: (user: User, newRole: 'admin' | 'vendedor') => void
  isLoading: boolean
}

export interface UserRoleBadgeProps {
  role: 'admin' | 'vendedor'
}

export interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateUserData) => Promise<void>
  isCreating: boolean
}

export interface ChangeRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  newRole: 'admin' | 'vendedor' | null
  onConfirm: () => Promise<void>
  isUpdating: boolean
}

export interface UsersFooterProps {
  totalUsers: number
  stats: UsersStats
}
