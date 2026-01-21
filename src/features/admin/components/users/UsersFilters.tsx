import { Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UsersFiltersProps } from '@/features/admin/types/user'

export function UsersFilters({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange
}: UsersFiltersProps) {
  return (
    <Card className="bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20">
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-[#a1a1aa]" />
            <Input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757] placeholder:text-[#666666]"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={onRoleFilterChange}>
            <SelectTrigger className="w-full md:w-[200px] bg-[#262626] border-[#3a3a38] text-[#fafafa] focus:border-[#d97757]">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent className="bg-[#262626] border-[#3a3a38] text-[#fafafa]">
              <SelectItem value="all" className="focus:bg-[#3a3a38] focus:text-[#fafafa]">
                Todos los roles
              </SelectItem>
              <SelectItem value="admin" className="focus:bg-[#3a3a38] focus:text-[#fafafa]">
                Administradores
              </SelectItem>
              <SelectItem value="vendedor" className="focus:bg-[#3a3a38] focus:text-[#fafafa]">
                Vendedores
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  )
}
