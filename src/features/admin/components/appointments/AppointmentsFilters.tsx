'use client'

import { Search, Clock, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AppointmentStatus, DateFilter, Branch } from '@/features/admin/types/appointment'

interface AppointmentsFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: AppointmentStatus | 'all'
  onStatusFilterChange: (value: AppointmentStatus | 'all') => void
  dateFilter: DateFilter
  onDateFilterChange: (value: DateFilter) => void
  branchFilter: string
  onBranchFilterChange: (value: string) => void
  branches: Branch[]
}

export function AppointmentsFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  branchFilter,
  onBranchFilterChange,
  branches,
}: AppointmentsFiltersProps) {
  const dateFilterOptions = [
    { value: 'all', label: 'Todos', icon: null },
    { value: 'today', label: 'Hoy', icon: Clock },
    { value: 'tomorrow', label: 'Mañana', icon: Calendar },
    { value: 'week', label: 'Esta Semana', icon: Calendar },
  ] as const

  return (
    <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20 p-4">
      <div className="space-y-4">
        {/* Date Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {dateFilterOptions.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              onClick={() => onDateFilterChange(value)}
              variant={dateFilter === value ? 'default' : 'secondary'}
              size="sm"
              className={
                dateFilter === value
                  ? 'bg-[#d97757] hover:bg-[#c56647] text-white border-[#d97757]'
                  : 'bg-[#3a3a38] hover:bg-[#444442] text-[#fafafa] border-[#444442]'
              }
            >
              {Icon && <Icon className="w-4 h-4 mr-2" />}
              {label}
            </Button>
          ))}
        </div>

        {/* Search and Filters Row */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888888]" />
            <Input
              type="text"
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-[#1e1e1c] border-[#3a3a38] text-[#fafafa] placeholder-[#666666]"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full md:w-[200px] bg-[#1e1e1c] border-[#3a3a38] text-[#fafafa]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-[#262624] border-[#3a3a38]">
              <SelectItem value="all" className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa]">
                Todos los estados
              </SelectItem>
              <SelectItem value="pending" className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa]">
                Pendiente
              </SelectItem>
              <SelectItem value="confirmed" className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa]">
                Confirmado
              </SelectItem>
              <SelectItem value="completed" className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa]">
                Completado
              </SelectItem>
              <SelectItem value="cancelled" className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa]">
                Cancelado
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Branch Filter */}
          <Select value={branchFilter} onValueChange={onBranchFilterChange}>
            <SelectTrigger className="w-full md:w-[250px] bg-[#1e1e1c] border-[#3a3a38] text-[#fafafa]">
              <SelectValue placeholder="Sucursal" />
            </SelectTrigger>
            <SelectContent className="bg-[#262624] border-[#3a3a38]">
              <SelectItem value="all" className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa]">
                Todas las sucursales
              </SelectItem>
              {branches.map((branch) => (
                <SelectItem
                  key={branch.id}
                  value={branch.id}
                  className="text-[#fafafa] focus:bg-[#3a3a38] focus:text-[#fafafa]"
                >
                  {branch.name} - {branch.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  )
}
