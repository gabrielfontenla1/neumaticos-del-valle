// Admin Layout Component - Exact Rapicompras Style with Dynamic Theming
'use client'

import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { memo, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Calendar,
  LogOut,
  User,
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
  Wrench,
  Store,
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

// Theme definitions
const themes = {
  // Default orange theme (Rapicompras style)
  orange: {
    background: '#30302e',
    foreground: '#fafafa',
    card: '#262624',
    primary: '#d97757',
    primaryGradient: 'linear-gradient(135deg, #FF8A1D 0%, #FFA758 100%)',
    primaryHover: 'rgba(255, 138, 29, 0.1)',
    mutedForeground: '#a1a1aa',
    border: '#262626',
    secondary: '#262626',
    badgeBg: '#d97757',
  },
  // WhatsApp/Chat blue-green theme
  chat: {
    background: '#0b141a',
    foreground: '#e9edef',
    card: '#111b21',
    primary: '#00a884',
    primaryGradient: 'linear-gradient(135deg, #00a884 0%, #25d366 100%)',
    primaryHover: 'rgba(0, 168, 132, 0.15)',
    mutedForeground: '#8696a0',
    border: '#2a3942',
    secondary: '#202c33',
    badgeBg: '#00a884',
  },
}

type ThemeType = keyof typeof themes

// Helper to get current theme based on pathname
const getThemeForPath = (pathname: string): ThemeType => {
  if (pathname === '/admin/chats' || pathname.startsWith('/admin/chats/')) {
    return 'chat'
  }
  return 'orange'
}

// Transition settings for ultra-smooth color changes
const colorTransition = {
  duration: 0.8,
  ease: [0.25, 0.1, 0.25, 1] as const, // Smooth cubic-bezier for elegant feel
}

// Slightly faster transition for smaller elements
const quickColorTransition = {
  duration: 0.6,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

// Legacy colors export for backward compatibility
const colors = themes.orange


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
  { href: '/admin/servicios', label: 'Servicios', Icon: Wrench },
  { href: '/admin/vouchers', label: 'Vouchers', Icon: Ticket },
  { href: '/admin/usuarios', label: 'Usuarios', Icon: Users },
  { href: '/admin/ia', label: 'Asistente IA', Icon: Bot },
  { href: '/admin/ia/automatizaciones', label: 'Flujos IA', Icon: GitBranch },
  { href: '/admin/stock/update', label: 'Actualizar Stock', Icon: RefreshCw },
  { href: '/admin/configuracion', label: 'Configuración', Icon: Settings },
  { href: '/admin/configuracion/sucursales', label: 'Sucursales', Icon: Store },
]

// Memoized navigation component to prevent re-renders
const NavigationMenu = memo(({ pathname, menuItems, theme }: { pathname: string, menuItems: MenuItem[], theme: typeof themes.orange }) => (
  <nav
    className="space-y-2 overflow-y-auto flex-1 pr-2 admin-scrollbar"
    style={{ maxHeight: 'calc(100vh - 180px)' }}
  >
    {menuItems.map((item) => {
      const isActive = pathname === item.href
      return (
        <Link
          key={item.href}
          href={item.href}
          prefetch={true}
          className="flex items-center px-3 py-3 rounded-xl cursor-pointer group hover:scale-105 hover:shadow-lg"
          style={{
            background: isActive ? theme.primaryGradient : 'transparent',
            color: isActive ? '#ffffff' : theme.mutedForeground,
            transition: 'transform 0.3s, box-shadow 0.3s',
          }}
          onMouseEnter={(e) => {
            if (!isActive) {
              e.currentTarget.style.background = theme.primaryHover
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
              color: isActive ? '#ffffff' : theme.mutedForeground
            }}
          />
          <span className="font-medium ml-3">{item.label}</span>
          <ChevronRight
            className="w-5 h-5 opacity-70 ml-auto flex-shrink-0"
            style={{
              color: isActive ? '#ffffff' : theme.mutedForeground
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

  // Get current theme based on pathname
  const currentTheme = useMemo(() => getThemeForPath(pathname), [pathname])
  const theme = themes[currentTheme]

  const getUserInitials = () => {
    const email = session?.user?.email || ''
    const name = email.split('@')[0]
    return name.substring(0, 2).toUpperCase()
  }

  if (!session) return null

  return (
    <motion.div
      className="h-screen overflow-hidden relative"
      animate={{ backgroundColor: theme.background }}
      transition={colorTransition}
    >
      {/* Animated Background - Always present, key ensures it never remounts */}
      <div className="fixed inset-0 z-0" key="admin-background">
        <AnimatedBackground />
      </div>

      {/* Top Navigation Bar */}
      <motion.header
        className="fixed top-0 right-0 h-20 z-30 flex items-center justify-between px-6"
        style={{ left: '286px' }}
        animate={{
          backgroundColor: theme.card,
          borderBottom: `1px solid ${theme.border}`,
        }}
        transition={colorTransition}
      >
        {/* Center Section - Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <motion.div
              className="absolute left-3 top-1/2 -translate-y-1/2"
              animate={{ color: theme.mutedForeground }}
              transition={quickColorTransition}
            >
              <Search className="w-5 h-5" />
            </motion.div>
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
                <motion.div animate={{ color: theme.mutedForeground }} transition={quickColorTransition}>
                  <Bell className="w-5 h-5" />
                </motion.div>
                <motion.div
                  className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs font-medium text-white rounded-full"
                  animate={{ backgroundColor: theme.primary }}
                  transition={quickColorTransition}
                >
                  3
                </motion.div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
              <DropdownMenuLabel style={{ color: theme.foreground }}>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: theme.border }} />
              <div className="p-2 space-y-2">
                <div className="p-3 rounded hover:bg-white/5 cursor-pointer">
                  <p className="text-sm" style={{ color: theme.foreground }}>Nuevo pedido recibido</p>
                  <p className="text-xs mt-1" style={{ color: theme.mutedForeground }}>Hace 5 minutos</p>
                </div>
                <div className="p-3 rounded hover:bg-white/5 cursor-pointer">
                  <p className="text-sm" style={{ color: theme.foreground }}>Stock bajo en neumáticos</p>
                  <p className="text-xs mt-1" style={{ color: theme.mutedForeground }}>Hace 1 hora</p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Messages */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                <motion.div animate={{ color: theme.mutedForeground }} transition={quickColorTransition}>
                  <Mail className="w-5 h-5" />
                </motion.div>
                <motion.div
                  className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs font-medium text-white rounded-full"
                  animate={{ backgroundColor: theme.primary }}
                  transition={quickColorTransition}
                >
                  2
                </motion.div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
              <DropdownMenuLabel style={{ color: theme.foreground }}>Mensajes</DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: theme.border }} />
              <div className="p-2 space-y-2">
                <div className="p-3 rounded hover:bg-white/5 cursor-pointer">
                  <p className="text-sm font-medium" style={{ color: theme.foreground }}>Juan Pérez</p>
                  <p className="text-xs mt-1" style={{ color: theme.mutedForeground }}>Consulta sobre pedido #1234</p>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                <Avatar className="size-9">
                  <motion.div
                    className="w-full h-full rounded-full flex items-center justify-center font-semibold text-sm text-white"
                    animate={{ backgroundColor: theme.primary }}
                    transition={quickColorTransition}
                  >
                    {getUserInitials()}
                  </motion.div>
                </Avatar>
                <div className="text-left">
                  <motion.p
                    className="text-sm font-medium"
                    animate={{ color: theme.foreground }}
                    transition={quickColorTransition}
                  >
                    {session.user.email.split('@')[0]}
                  </motion.p>
                  <motion.p
                    className="text-xs capitalize"
                    animate={{ color: theme.mutedForeground }}
                    transition={quickColorTransition}
                  >
                    {session.user.role || 'admin'}
                  </motion.p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
              <DropdownMenuLabel style={{ color: theme.foreground }}>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: theme.border }} />
              <DropdownMenuItem className="cursor-pointer" style={{ color: theme.foreground }}>
                <User className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: theme.border }} />
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
            <motion.div animate={{ color: theme.mutedForeground }} transition={quickColorTransition}>
              {isDarkTheme ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.div>
          </button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <motion.div animate={{ color: theme.mutedForeground }} transition={quickColorTransition}>
                  <Globe className="w-5 h-5" />
                </motion.div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
              <DropdownMenuItem className="cursor-pointer" style={{ color: theme.foreground }}>
                🇨🇱 Español
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" style={{ color: theme.foreground }}>
                🇺🇸 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>

      {/* Fixed Sidebar */}
      <motion.aside
        className="fixed left-0 top-0 h-full p-4 z-50"
        style={{ width: '286px' }}
        animate={{
          backgroundColor: theme.card,
          borderRight: `1px solid ${theme.border}`,
        }}
        transition={colorTransition}
      >
        {/* Logo Section */}
        <motion.div
          className="mb-6 pt-4 pb-6"
          animate={{ borderBottom: `1px solid ${theme.border}` }}
          transition={colorTransition}
        >
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
        </motion.div>

        {/* Menu Title */}
        <div className="px-4 mb-4">
          <motion.h3
            className="text-xs font-bold tracking-wider uppercase"
            animate={{ color: theme.mutedForeground }}
            transition={quickColorTransition}
          >
            MENÚ
          </motion.h3>
        </div>

        <NavigationMenu pathname={pathname} menuItems={menuItems} theme={theme} />
      </motion.aside>

      {/* Main Content */}
      <main
        className="mt-20 relative z-10 h-[calc(100vh-80px)] overflow-hidden"
        style={{ marginLeft: '286px' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  )
}

// Export without memo for now to diagnose grid issue
export default AdminLayout
