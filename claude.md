# 🚗 Neumáticos del Valle - Project Context

**Project Type**: E-commerce web application for tire sales and service center
**Business**: Neumáticos del Valle SRL, Argentina
**Status**: Production Ready ✅
**Port**: 6001 (development)

---

## 📋 Project Overview

Modern e-commerce platform for tire sales with integrated appointment booking, WhatsApp checkout, AI-powered chat, and comprehensive admin dashboard. The application serves both B2C (retail customers) and B2B (agricultural/truck clients).

### Core Business Features
- **Product Catalog**: Tire inventory with search, filters, and equivalencies
- **WhatsApp Checkout**: Direct purchase flow via WhatsApp Business
- **Appointment Booking**: Online scheduling for services
- **AI Chat Assistant**: Customer support and product recommendations
- **Review System**: Customer feedback with voucher rewards
- **Multi-Branch**: Support for multiple physical locations
- **Admin Dashboard**: Comprehensive management interface

---

## 🛠️ Tech Stack

### Core Technologies
- **Framework**: Next.js 15.5.9 with App Router (React 19.1)
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: React hooks + Supabase realtime
- **Forms**: React controlled components with Zod validation
- **Testing**: Vitest (unit) + Playwright (E2E)

### Key Dependencies
- `@supabase/supabase-js` - Backend/Database
- `next-themes` - Dark mode support
- `framer-motion` - Animations
- `lucide-react` - Icons
- `sonner` & `react-hot-toast` - Notifications
- `@ai-sdk/openai` & `@anthropic-ai/sdk` - AI features
- `twilio` - WhatsApp integration
- `xlsx` - Excel import/export
- `jspdf` - PDF generation

### Development Tools
- Node.js ≥20.0.0
- npm ≥10.0.0
- TypeScript compiler
- ESLint + Prettier
- Turbopack (dev mode)

---

## 📁 Project Architecture

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (public routes)     # Customer-facing pages
│   ├── admin/             # Admin dashboard & management
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # Shared React components
│   ├── ui/               # shadcn/ui components (DO NOT EDIT)
│   ├── layout/           # Layout components (Navbar, Footer)
│   ├── home/             # Homepage-specific components
│   └── marketing/        # Marketing/promotional components
├── features/             # Feature-based modules (recommended)
│   ├── admin/           # Admin-specific logic
│   ├── cart/            # Shopping cart functionality
│   ├── orders/          # Order management
│   └── [feature]/       # Other features
├── lib/                 # Utilities and helpers
│   ├── supabase.ts     # Supabase client
│   ├── whatsapp.ts     # WhatsApp integration
│   └── constants/      # App constants
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions

supabase/
└── migrations/         # Database schema migrations

scripts/
├── migrate.js         # Database migration runner
├── kill-port.js       # Port cleanup utility
└── [other scripts]    # Testing & deployment scripts
```

### Architecture Patterns

**App Router (Next.js 15)**
- Use `page.tsx` for routes
- Use `layout.tsx` for nested layouts
- Server Components by default
- Add `"use client"` only when needed (state, effects, browser APIs)

**Feature-Based Organization** (Preferred for new code)
- Group related components, hooks, types by feature
- Example: `features/cart/` contains `hooks/`, `components/`, `types/`, `api.ts`
- Reduces coupling, improves maintainability

**Component Conventions**
- shadcn/ui components in `components/ui/` (DO NOT MODIFY directly)
- Feature components in `features/[feature]/components/`
- Shared components in `components/`
- Client components: `"use client"` directive at top

**Data Fetching**
- Server Components: Direct Supabase queries
- Client Components: Custom hooks with Supabase client
- Realtime: Supabase subscriptions in `useEffect`
- Mutations: API routes or direct Supabase calls

---

## 🎨 UI & Design System

### Design Theme: "rapicompras"
The project uses a custom design system inspired by modern e-commerce platforms. This theme is applied consistently across all components.

**CRITICAL**: DO NOT use other UI libraries or themes. Always use shadcn/ui with rapicompras styling.

### shadcn/ui Component Usage

**Installation**
```bash
npx shadcn add [component-name]
```

**Available Components**
All Radix UI primitives are available via shadcn/ui:
- `Button`, `Input`, `Select`, `Dialog`, `Dropdown`, `Tabs`
- `Card`, `Table`, `Toast`, `Tooltip`, `Alert`, `Badge`
- `Accordion`, `Avatar`, `Checkbox`, `Progress`, `Radio`, `Switch`
- See `components/ui/` for full list

**Usage Pattern**
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

### Styling Conventions
- Use Tailwind utility classes (primary approach)
- Use `cn()` helper from `lib/utils` for conditional classes
- Dark mode support via `next-themes` (already configured)
- Responsive design: mobile-first approach
- Color palette: Defined in `tailwind.config.js`

### Animation & Motion
- Use `framer-motion` for complex animations
- Use Tailwind's `animate-*` classes for simple animations
- Keep animations subtle and purposeful

---

## 🔧 Development Conventions

### TypeScript Standards
- Strict mode enabled
- Explicit return types for functions
- No `any` types (use `unknown` or proper typing)
- Use `interface` for object shapes, `type` for unions/intersections
- Import types with `import type { ... }`

### Code Quality Rules

**MUST Follow**
1. **Use existing patterns**: Follow established code structure
2. **Type safety**: No `any`, proper TypeScript usage
3. **shadcn/ui only**: No other UI libraries
4. **Mobile-first**: Responsive design required
5. **Error handling**: Try-catch blocks for async operations
6. **Loading states**: Show loading UI for async actions
7. **Accessibility**: Semantic HTML, ARIA labels where needed

**MUST NOT Do**
1. ❌ Modify `components/ui/` directly (regenerate via shadcn CLI)
2. ❌ Hardcode WhatsApp numbers (use `NEXT_PUBLIC_WHATSAPP_NUMBER`)
3. ❌ Hardcode branch data (use database)
4. ❌ Use inline styles (use Tailwind)
5. ❌ Commit `.env` files
6. ❌ Skip type checking before commits
7. ❌ Use deprecated Supabase methods

### Component Development Pattern

```typescript
// 1. Imports
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { Product } from "@/types/database"

// 2. Types/Interfaces
interface ProductCardProps {
  product: Product
  onSelect?: (id: string) => void
}

// 3. Component
export function ProductCard({ product, onSelect }: ProductCardProps) {
  // 4. Hooks
  const [loading, setLoading] = useState(false)

  // 5. Effects
  useEffect(() => {
    // ...
  }, [])

  // 6. Handlers
  const handleClick = async () => {
    setLoading(true)
    try {
      // ... async operation
      onSelect?.(product.id)
    } catch (error) {
      console.error(error)
      // Show toast notification
    } finally {
      setLoading(false)
    }
  }

  // 7. Render
  return (
    <Card>
      {/* ... */}
      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Loading..." : "Select"}
      </Button>
    </Card>
  )
}
```

---

## 🔗 Key Integrations

### Supabase
**File**: `src/lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js"

// Client-side
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Key Tables**
- `products` - Tire inventory (marca, medida, precio, stock)
- `services` - Available services
- `appointments` - Bookings (turnos)
- `orders` - Purchase orders
- `reviews` - Customer reviews
- `vouchers` - Discount vouchers
- `admin_users` - Admin accounts
- `branches` - Physical locations (sucursales)
- `chat_conversations` - AI chat history

**Realtime Subscriptions**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('orders')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders'
    }, (payload) => {
      // Handle change
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### WhatsApp Integration
**File**: `src/lib/whatsapp.ts`

**CRITICAL**: Always use environment variable
```typescript
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
```

**Checkout Flow**
1. User adds products to cart
2. Click "Finalizar compra"
3. Generate WhatsApp message with order details
4. Redirect to WhatsApp with pre-filled message
5. Customer sends message to confirm order

**Message Format**
```
¡Hola! Quiero comprar:

🛒 Producto 1 - Cantidad: X - $XXX
🛒 Producto 2 - Cantidad: X - $XXX

💰 Total: $X,XXX

[Datos del cliente si están disponibles]
```

### AI Chat Integration
- **OpenAI**: GPT-4 for complex queries
- **Anthropic**: Claude for structured responses
- **Use cases**: Product recommendations, technical support, appointment booking
- **Context**: Inject product catalog and business info into prompts

---

## 🚀 Development Workflow

### Starting Development
```bash
# Install dependencies
npm install

# Start dev server (port 6001)
npm run dev

# Alternative: clean start (kills port first)
npm run dev:clean
```

### Code Quality Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

### Testing
```bash
# Unit tests (Vitest)
npm test
npm run test:watch
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e

# Smoke tests
npm run test:smoke

# Specific system tests
npm run verify-cart
npm run verify-orders
npm run test:chats-e2e
```

### Database Operations
```bash
# Run migrations
npm run migrate

# Update stock from Excel
python scripts/update_stock_from_excel.py
```

### Building & Deployment
```bash
# Production build
npm run build
npm run build:prod

# Start production server
npm start

# Pre-deployment check
npm run deploy:check
```

---

## 📊 Critical Business Flows

### 1. Product Purchase Flow
```
Browse Products → Add to Cart → Review Cart →
WhatsApp Checkout → Customer Confirms → Order Created
```

**Implementation Notes**
- Cart stored in localStorage (client-side)
- Use `features/cart/hooks/useCart.ts`
- WhatsApp message generated with order summary
- Admin sees orders in dashboard

### 2. Appointment Booking Flow
```
Select Service → Choose Date/Time → Fill Form →
Submit → Confirmation → Admin Notification
```

**Implementation Notes**
- Appointments table in Supabase
- Real-time updates for admin dashboard
- Email/WhatsApp confirmation to customer
- Admin can approve/reject appointments

### 3. Review & Voucher Flow
```
Customer Submits Review → Admin Approves →
Auto-generate Voucher → Customer Receives Code →
Apply at Checkout
```

**Implementation Notes**
- Reviews require moderation (admin approval)
- Vouchers auto-generated on approval
- Voucher codes are unique UUIDs
- Validation on checkout

### 4. Stock Management Flow
```
Excel Import → Parse Data → Validate →
Update Database → Sync Products → Notify Changes
```

**Implementation Notes**
- Script: `scripts/update_stock_from_excel.py`
- Excel format: specific columns (marca, medida, precio, stock)
- Validation before import
- Audit trail for changes

### 5. Multi-Branch Support
```
Select Branch → Filter by Location →
Check Stock Availability → Display Branch Info →
Contact via Branch-Specific WhatsApp
```

**Implementation Notes**
- Branches table with images, hours, contact info
- Branch-specific product availability
- Branch selection affects cart/checkout
- Admin can manage branches via dashboard

---

## ⚠️ Known Issues & Gotchas

### Port Conflicts
**Issue**: Port 6001 may be in use
**Solution**: Run `npm run dev:clean` or `node scripts/kill-port.js 6001`

### Supabase RLS Policies
**Issue**: Permission errors on certain tables
**Solution**: Check Row Level Security policies in Supabase dashboard

### WhatsApp Number Format
**Issue**: Phone number format inconsistencies
**Solution**: Always use format `549XXXXXXXXXX` (Argentina country code + area + number)

### Image Uploads
**Issue**: Large images causing performance issues
**Solution**: Implement image optimization (next/image) and compression

### Realtime Subscriptions
**Issue**: Memory leaks from unclosed channels
**Solution**: Always cleanup subscriptions in useEffect return

### Type Errors After Schema Changes
**Issue**: TypeScript errors after database changes
**Solution**: Regenerate types: Update `src/types/database.ts` based on Supabase schema

---

## 🔐 Environment Variables

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx (server-only)

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://neumaticosdelvallesrl.com
NEXT_PUBLIC_WHATSAPP_NUMBER=549XXXXXXXXXX

# Authentication
NEXTAUTH_URL=http://localhost:6001
NEXTAUTH_SECRET=xxx

# AI Services (Optional)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Email (Optional)
RESEND_API_KEY=re_xxx
```

**Security Notes**
- Never commit `.env` files
- Use `.env.local` for development
- Set production variables in Railway/Vercel dashboard
- Rotate API keys regularly

---

## 📚 Resources & Documentation

### Internal Documentation
- `README.md` - Project overview
- `DEPLOYMENT.md` - Deployment guide
- `supabase/migrations/` - Database schema history
- `*.md` files in root - Various reports and documentation

### External Resources
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)

### Team Communication
- GitHub Issues for bug reports
- Pull Requests for code review
- Email: support@neumaticosdelvallesrl.com

---

## 🎯 Development Priorities

### Priority 1: User Experience
- Fast load times (<2s)
- Smooth interactions
- Clear error messages
- Mobile-first responsive design

### Priority 2: Code Quality
- Type safety
- Test coverage
- Code consistency
- Documentation

### Priority 3: Business Features
- WhatsApp integration reliability
- Stock accuracy
- Order processing
- Admin dashboard functionality

### Priority 4: Performance
- Bundle size optimization
- Image optimization
- Database query optimization
- Caching strategies

---

## 🤖 Claude Code Instructions

When working on this project:

1. **Always check**: package.json for available dependencies
2. **Always use**: shadcn/ui components (never modify `components/ui/`)
3. **Always reference**: WhatsApp number from env variable
4. **Always add**: Loading states for async operations
5. **Always implement**: Error handling with user-friendly messages
6. **Always consider**: Mobile responsiveness
7. **Always verify**: Type safety (run `npm run type-check`)
8. **Always test**: Changes with `npm test` before committing

### Preferred Tools & Patterns
- **State**: React hooks (useState, useEffect, useReducer)
- **Styling**: Tailwind utility classes
- **Components**: shadcn/ui + custom components
- **Data fetching**: Supabase client in hooks
- **Forms**: Controlled components + Zod validation
- **Routing**: Next.js App Router navigation
- **Testing**: Vitest for unit, Playwright for E2E

### Anti-Patterns to Avoid
- ❌ Global state libraries (Redux, Zustand) - use React context if needed
- ❌ CSS modules or styled-components - use Tailwind
- ❌ External UI libraries - use shadcn/ui only
- ❌ Direct DOM manipulation - use React state
- ❌ Inline SQL - use Supabase client methods
- ❌ Unhandled promises - always catch errors

---

**Last Updated**: January 2026
**Maintained By**: Development Team
**Questions?**: Create a GitHub issue or contact the team
