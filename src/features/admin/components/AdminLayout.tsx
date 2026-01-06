// Admin Layout Component - Exact Rapicompras Style
'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calendar,
  LogOut,
  User,
  Import,
  Ticket,
  Users,
  Search,
  Bell,
  Mail,
  ArrowLeft,
  Sun,
  Moon,
  Globe,
  type LucideIcon,
  ChevronRight,
  Bot,
  RefreshCw,
  MessageCircle,
  Settings,
  GitBranch,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import dynamic from 'next/dynamic'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

// Dynamic import to avoid SSR hydration issues with PIXI.js
const AnimatedBackground = dynamic(() => import('@/components/effects/AnimatedBackground'), {
  ssr: false
})

// Exact colors from rapicompras darkColors theme
const colors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  secondary: '#262626',
}

interface AdminLayoutProps {
  children: React.ReactNode
}

type MenuItem = {
  href: string
  label: string
  Icon: LucideIcon
}

const menuItems: MenuItem[] = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/chats', label: 'Chats WhatsApp', Icon: MessageCircle },
  { href: '/admin/products', label: 'Productos', Icon: Package },
  { href: '/admin/orders', label: 'Pedidos', Icon: ShoppingCart },
  { href: '/admin/turnos', label: 'Turnos', Icon: Calendar },
  { href: '/admin/vouchers', label: 'Vouchers', Icon: Ticket },
  { href: '/admin/usuarios', label: 'Usuarios', Icon: Users },
  { href: '/admin/ia', label: 'Asistente IA', Icon: Bot },
  { href: '/admin/ia/automatizaciones', label: 'Flujos IA', Icon: GitBranch },
  { href: '/admin/stock/import', label: 'Importar Stock', Icon: Import },
  { href: '/admin/stock/update', label: 'Actualizar Stock', Icon: RefreshCw },
  { href: '/admin/configuracion', label: 'Configuración', Icon: Settings },
]

// Memoized navigation component to prevent re-renders
const NavigationMenu = memo(({ pathname, menuItems }: { pathname: string, menuItems: MenuItem[] }) => (
  <nav className="space-y-2">
    {menuItems.map((item) => {
      const isActive = pathname === item.href
      return (
        <Link
          key={item.href}
          href={item.href}
          prefetch={true}
          className="flex items-center px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer group hover:scale-105 hover:shadow-lg"
          style={{
            background: isActive
              ? 'linear-gradient(135deg, #FF8A1D 0%, #FFA758 100%)'
              : 'transparent',
            color: isActive ? '#ffffff' : colors.mutedForeground,
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'rgba(255, 138, 29, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          <item.Icon
            className="w-5 h-5 flex-shrink-0"
            style={{
              color: isActive ? '#ffffff' : colors.mutedForeground
            }}
          />
          <span className="font-medium ml-3">{item.label}</span>
          <ChevronRight
            className="w-5 h-5 opacity-70 ml-auto flex-shrink-0"
            style={{
              color: isActive ? '#ffffff' : colors.mutedForeground
            }}
          />
        </Link>
      )
    })}
  </nav>
))

NavigationMenu.displayName = 'NavigationMenu'

function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const { session, logout } = useAuth()
  const [isDarkTheme, setIsDarkTheme] = useState(true)

  const getUserInitials = () => {
    const email = session?.user?.email || ''
    const name = email.split('@')[0]
    return name.substring(0, 2).toUpperCase()
  }

  if (!session) return null

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: colors.background }}>
      {/* Animated Background - Always present, key ensures it never remounts */}
      <div className="fixed inset-0 z-0" key="admin-background">
        <AnimatedBackground />
      </div>

      {/* Top Navigation Bar */}
      <header
        className="fixed top-0 right-0 h-20 z-30 flex items-center justify-between px-6"
        style={{
          left: '286px',
          backgroundColor: colors.card,
          borderBottom: `1px solid ${colors.border}`
        }}
      >
        {/* Center Section - Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.mutedForeground }} />
            <Input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-11 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:bg-white/10 rounded-lg"
            />
          </div>
        </div>

        {/* Right Section - Actions and Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5" style={{ color: colors.mutedForeground }} />
                <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1" style={{ backgroundColor: colors.primary, color: 'white' }}>
                  3
                </Badge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <DropdownMenuLabel style={{ color: colors.foreground }}>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: colors.border }} />
              <div className="p-2 space-y-2">
                <div className="p-3 rounded hover:bg-white/5 cursor-pointer">
                  <p className="text-sm" style={{ color: colors.foreground }}>Nuevo pedido recibido</p>
                  <p className="text-xs mt-1" style={{ color: colors.mutedForeground }}>Hace 5 minutos</p>
                </div>
                <div className="p-3 rounded hover:bg-white/5 cursor-pointer">
                  <p className="text-sm" style={{ color: colors.foreground }}>Stock bajo en neumáticos</p>
                  <p className="text-xs mt-1" style={{ color: colors.mutedForeground }}>Hace 1 hora</p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Messages */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Mail className="w-5 h-5" style={{ color: colors.mutedForeground }} />
                <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1" style={{ backgroundColor: colors.primary, color: 'white' }}>
                  2
                </Badge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <DropdownMenuLabel style={{ color: colors.foreground }}>Mensajes</DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: colors.border }} />
              <div className="p-2 space-y-2">
                <div className="p-3 rounded hover:bg-white/5 cursor-pointer">
                  <p className="text-sm font-medium" style={{ color: colors.foreground }}>Juan Pérez</p>
                  <p className="text-xs mt-1" style={{ color: colors.mutedForeground }}>Consulta sobre pedido #1234</p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                <Avatar className="size-9">
                  <AvatarFallback
                    className="font-semibold text-sm"
                    style={{ backgroundColor: colors.primary, color: 'white' }}
                  >
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: colors.foreground }}>
                    {session.user.email.split('@')[0]}
                  </p>
                  <p className="text-xs capitalize" style={{ color: colors.mutedForeground }}>
                    {session.user.role || 'admin'}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <DropdownMenuLabel style={{ color: colors.foreground }}>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: colors.border }} />
              <DropdownMenuItem className="cursor-pointer" style={{ color: colors.foreground }}>
                <User className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: colors.border }} />
              <DropdownMenuItem
                onClick={logout}
                variant="destructive"
                className="cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isDarkTheme ? (
              <Sun className="w-5 h-5" style={{ color: colors.mutedForeground }} />
            ) : (
              <Moon className="w-5 h-5" style={{ color: colors.mutedForeground }} />
            )}
          </button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Globe className="w-5 h-5" style={{ color: colors.mutedForeground }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <DropdownMenuItem className="cursor-pointer" style={{ color: colors.foreground }}>
                🇨🇱 Español
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" style={{ color: colors.foreground }}>
                🇺🇸 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Fixed Sidebar */}
      <aside
        className="fixed left-0 top-0 h-full p-4 z-50"
        style={{
          width: '286px',
          backgroundColor: colors.card,
          borderRight: `1px solid ${colors.border}`,
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Logo Section */}
        <div className="mb-6 pt-4 pb-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="h-12 w-full flex items-center justify-center px-2">
            <Image
              src="/NDV_Logo_Negro.svg"
              alt="Neumáticos del Valle"
              width={200}
              height={48}
              className="h-full w-auto brightness-0 invert"
              priority
            />
          </div>
        </div>

        {/* Menu Title */}
        <div className="px-4 mb-4">
          <h3 className="text-xs font-bold tracking-wider uppercase" style={{ color: colors.mutedForeground }}>
            MENÚ
          </h3>
        </div>

        <NavigationMenu pathname={pathname} menuItems={menuItems} />
      </aside>

      {/* Main Content */}
      <main className="mt-20 relative z-10" style={{ marginLeft: '286px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// Export without memo for now to diagnose grid issue
export default AdminLayout
