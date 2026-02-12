/**
 * Centralized Admin Theme Constants
 *
 * Rapicompras dark theme colors used consistently across all admin pages
 * (usuarios, products, orders, turnos, servicios)
 */

export const ADMIN_COLORS = {
  // Backgrounds
  background: {
    main: '#30302e',           // Main page background
    card: '#262624',           // Card/container background
    cardHover: '#2a2a28',      // Card hover state
    subtle: '#1e1e1c',         // Subtle background for nested elements
  },

  // Borders
  border: {
    default: '#3a3a38',        // Default border color
    light: '#444442',          // Lighter border
    dark: '#2a2a28',           // Darker border
  },

  // Text Colors
  text: {
    primary: '#fafafa',        // Primary text (headings, important content)
    secondary: '#888888',      // Secondary text (descriptions, labels)
    muted: '#666666',          // Muted text (disabled, placeholders)
    inverse: '#1a1a1a',        // For light backgrounds
  },

  // Accent Colors (consistent with rapicompras branding)
  accent: {
    primary: '#d97757',        // Primary orange accent
    primaryDim: 'rgba(217, 119, 87, 0.2)',  // 20% opacity
    primaryBorder: 'rgba(217, 119, 87, 0.3)', // 30% opacity
  },

  // Status Colors (for badges, alerts, notifications)
  status: {
    // Success
    success: {
      bg: '#10b981',
      text: '#ecfdf5',
      bgDim: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.2)',
    },
    // Warning
    warning: {
      bg: '#f59e0b',
      text: '#fffbeb',
      bgDim: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.2)',
    },
    // Error/Danger
    error: {
      bg: '#ef4444',
      text: '#fef2f2',
      bgDim: 'rgba(239, 68, 68, 0.1)',
      border: 'rgba(239, 68, 68, 0.2)',
    },
    // Info/Primary
    info: {
      bg: '#3b82f6',
      text: '#eff6ff',
      bgDim: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.2)',
    },
    // Neutral/Pending
    neutral: {
      bg: '#6b7280',
      text: '#f9fafb',
      bgDim: 'rgba(107, 114, 128, 0.1)',
      border: 'rgba(107, 114, 128, 0.2)',
    },
  },

  // Interactive Elements
  interactive: {
    hover: 'rgba(255, 255, 255, 0.05)',
    active: 'rgba(255, 255, 255, 0.1)',
    focus: 'rgba(217, 119, 87, 0.5)',
  },

  // Shadows
  shadow: {
    sm: 'rgba(0, 0, 0, 0.1)',
    md: 'rgba(0, 0, 0, 0.2)',
    lg: 'rgba(0, 0, 0, 0.3)',
  },
} as const

/**
 * Flat admin color palette used by page-level components.
 * Replaces the duplicated `const colors = {...}` across admin pages.
 */
export const adminColors = {
  background: '#30302e',
  foreground: '#fafafa',
  card: '#262624',
  primary: '#d97757',
  mutedForeground: '#a1a1aa',
  border: '#262626',
  input: '#262626',
  secondary: '#262626',
} as const

/**
 * Common Tailwind classes for admin pages
 */
export const ADMIN_CLASSES = {
  // Page layouts
  page: 'p-6 space-y-6 min-h-screen',

  // Cards
  card: 'bg-[#262624] border-[#3a3a38] shadow-lg shadow-black/20',
  cardHeader: 'p-6',
  cardContent: 'px-6 pb-6',

  // Tables
  table: {
    wrapper: 'overflow-x-auto',
    table: 'w-full',
    thead: 'border-b border-[#3a3a38]',
    th: 'px-4 py-3 text-left text-xs font-medium text-[#888888] uppercase tracking-wider',
    tbody: 'divide-y divide-[#3a3a38]',
    td: 'px-4 py-4 text-sm text-[#fafafa]',
    row: 'hover:bg-[#2a2a28] transition-colors',
  },

  // Buttons
  button: {
    primary: 'bg-[#d97757] hover:bg-[#c56647] text-white font-medium px-4 py-2 rounded-md transition-colors',
    secondary: 'bg-[#3a3a38] hover:bg-[#444442] text-[#fafafa] font-medium px-4 py-2 rounded-md transition-colors',
    ghost: 'hover:bg-[#2a2a28] text-[#fafafa] font-medium px-4 py-2 rounded-md transition-colors',
    destructive: 'bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition-colors',
  },

  // Inputs
  input: 'bg-[#1e1e1c] border border-[#3a3a38] text-[#fafafa] placeholder-[#666666] rounded-md focus:ring-2 focus:ring-[#d97757] focus:border-transparent',

  // Text styles
  heading: {
    h1: 'text-2xl font-bold text-[#fafafa]',
    h2: 'text-xl font-semibold text-[#fafafa]',
    h3: 'text-lg font-medium text-[#fafafa]',
  },
  description: 'text-sm text-[#888888]',
  label: 'text-xs font-medium text-[#888888] uppercase',

  // Badges
  badge: {
    success: 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20',
    warning: 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20',
    error: 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20',
    info: 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20',
    neutral: 'bg-[#6b7280]/10 text-[#888888] border border-[#6b7280]/20',
  },
} as const

/**
 * Order status specific styles (for Orders page)
 */
export const ORDER_STATUS_STYLES = {
  pending: {
    badge: 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20',
    dot: 'bg-[#f59e0b]',
  },
  confirmed: {
    badge: 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20',
    dot: 'bg-[#3b82f6]',
  },
  processing: {
    badge: 'bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20',
    dot: 'bg-[#8b5cf6]',
  },
  shipped: {
    badge: 'bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20',
    dot: 'bg-[#6366f1]',
  },
  delivered: {
    badge: 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20',
    dot: 'bg-[#10b981]',
  },
  cancelled: {
    badge: 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20',
    dot: 'bg-[#ef4444]',
  },
} as const

/**
 * Appointment status specific styles (for Turnos page)
 */
export const APPOINTMENT_STATUS_STYLES = {
  pending: {
    badge: 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20',
    dot: 'bg-[#f59e0b]',
  },
  confirmed: {
    badge: 'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20',
    dot: 'bg-[#3b82f6]',
  },
  completed: {
    badge: 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20',
    dot: 'bg-[#10b981]',
  },
  cancelled: {
    badge: 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20',
    dot: 'bg-[#ef4444]',
  },
  'no-show': {
    badge: 'bg-[#6b7280]/10 text-[#888888] border border-[#6b7280]/20',
    dot: 'bg-[#6b7280]',
  },
} as const

/**
 * Product stock status specific styles (for Products page)
 */
export const STOCK_STATUS_STYLES = {
  in_stock: {
    badge: 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20',
    dot: 'bg-[#10b981]',
  },
  low_stock: {
    badge: 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20',
    dot: 'bg-[#f59e0b]',
  },
  out_of_stock: {
    badge: 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20',
    dot: 'bg-[#ef4444]',
  },
  discontinued: {
    badge: 'bg-[#6b7280]/10 text-[#888888] border border-[#6b7280]/20',
    dot: 'bg-[#6b7280]',
  },
} as const
