# 🚗 Neumáticos del Valle - Project Context

**Project Type**: E-commerce web application for tire sales and service center
**Business**: Neumáticos del Valle SRL, Argentina
**Status**: Production Ready ✅
**Port**: 6001 (development)

---

## ⚡ Quick Reference

### Comandos Esenciales
```bash
npm run dev          # Puerto 6001
npm run type-check   # SIEMPRE antes de commits
npm run build        # Verificar build OK
npm run lint         # Check linting
```

### Archivos Clave por Dominio
| Dominio | Archivos |
|---------|----------|
| Productos | `src/app/productos/`, `src/features/products/` |
| Carrito | `src/features/cart/hooks/useCart.ts` |
| Checkout | `src/features/checkout/`, `src/lib/whatsapp.ts` |
| Turnos | `src/app/turnos/`, `src/features/appointments/` |
| Admin | `src/app/admin/`, `src/features/admin/` |
| API | `src/app/api/**` |
| DB | `src/lib/supabase.ts`, `supabase/migrations/` |

### Reglas Críticas
```
✅ shadcn/ui SOLO (components/ui/ NO modificar)
✅ WhatsApp: usar NEXT_PUBLIC_WHATSAPP_NUMBER
✅ Mobile-first, loading states, error handling
✅ Type safety: npm run type-check antes de commit
❌ NO: any types, inline styles, hardcoded data
❌ NO: Modificar components/ui/ directamente
❌ NO: Commit .env files
```

---

## 🖥️ Multi-Terminal Workflow

### Layout de Terminales (2x2)
```
┌─────────────────┬─────────────────┐
│  🗄️ DATABASE    │  🔵 Terminal 2  │
│  (cálido)       │  (azul)         │
├─────────────────┼─────────────────┤
│  🟢 Terminal 3  │  🟣 Terminal 4  │
│  (verde)        │  (púrpura)      │
└─────────────────┴─────────────────┘
```

### 🗄️ Terminal DATABASE (Top-Left - Color Cálido)
**Rol**: Única terminal que modifica base de datos

**Territorio exclusivo**:
- `supabase/migrations/` - Migraciones SQL
- `src/lib/supabase*.ts` - Cliente Supabase
- `src/lib/db/` - Helpers de DB
- `src/types/database.ts` - Solo regenerar, no editar manual

**Workflow**:
1. Leer `DB_PENDING.md` para ver cambios pendientes
2. Implementar migraciones/cambios de schema
3. Ejecutar `npm run migrate` si aplica
4. Marcar como completado en `DB_PENDING.md`

### 🔵🟢🟣 Otras Terminales (App Code)
**Rol**: Desarrollo de features, UI, API, etc.

**Cuando necesiten cambios de BD**:
1. **NO modificar** archivos de database directamente
2. **Documentar** el cambio requerido en `DB_PENDING.md`
3. **Continuar** con el código que no depende de BD
4. **Avisar** al usuario para que vaya a la terminal DATABASE

### 📋 Archivo DB_PENDING.md
```markdown
# Database Changes Pending

## ⏳ Pendiente
- [ ] Agregar campo `x` a tabla `products` (solicitado por Terminal 2)
- [ ] Crear tabla `new_feature` (solicitado por Terminal 3)

## ✅ Completado
- [x] Migración añadida: 20260206_add_field_x.sql
```

**Ubicación**: `DB_PENDING.md` en la raíz del proyecto

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

**Data Fetching**
- Server Components: Direct Supabase queries
- Client Components: Custom hooks with Supabase client
- Realtime: Supabase subscriptions in `useEffect`
- Mutations: API routes or direct Supabase calls

---

## 🗃️ Database Schema

| Tabla | Propósito | Campos Clave |
|-------|-----------|--------------|
| `products` | Catálogo de neumáticos | marca, medida, precio, stock, tipo |
| `orders` | Pedidos de clientes | customer_*, items, total, status |
| `appointments` | Turnos de servicio | service_id, date, time, status |
| `reviews` | Reseñas de clientes | rating, comment, approved |
| `vouchers` | Cupones de descuento | code, discount_percent, used |
| `branches` | Sucursales | name, address, phone, whatsapp |
| `admin_users` | Usuarios admin | email, role, permissions |
| `chat_conversations` | Chat AI | messages, customer_phone, created_at |
| `services` | Servicios disponibles | name, description, price |

**Nota**: `src/types/database.ts` es AUTO-GENERADO desde Supabase, no modificar manualmente.

---

## 🧩 Code Patterns

### API Route Pattern (`src/app/api/`)
```typescript
// GET: Fetch data
export async function GET(request: Request) {
  const { data, error } = await supabase.from('table').select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST: Create with validation
export async function POST(request: Request) {
  const body = await request.json()
  const validated = schema.parse(body) // Zod validation
  const { data, error } = await supabase.from('table').insert(validated)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

### Feature Hook Pattern (`src/features/*/hooks/`)
```typescript
export function useFeatureData() {
  const [data, setData] = useState<DataType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('table').select()
      if (error) throw error
      setData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
```

### Component Pattern
```typescript
interface MyComponentProps {
  data: DataType
  onAction?: (id: string) => void
}

export function MyComponent({ data, onAction }: MyComponentProps) {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    try {
      // async operation
      onAction?.(data.id)
    } catch (error) {
      toast.error('Error message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      {loading ? <Skeleton /> : <Content />}
      <Button onClick={handleAction} disabled={loading}>
        {loading ? 'Loading...' : 'Action'}
      </Button>
    </Card>
  )
}
```

---

## 🎨 UI & Design System

### shadcn/ui Component Usage

**Installation**: `npx shadcn add [component-name]`

**Available Components** (see `components/ui/` for full list):
- `Button`, `Input`, `Select`, `Dialog`, `Dropdown`, `Tabs`
- `Card`, `Table`, `Toast`, `Tooltip`, `Alert`, `Badge`
- `Accordion`, `Avatar`, `Checkbox`, `Progress`, `Radio`, `Switch`

**Usage**:
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
```

### Styling Conventions
- Use Tailwind utility classes (primary approach)
- Use `cn()` helper from `lib/utils` for conditional classes
- Dark mode support via `next-themes` (already configured)
- Responsive design: mobile-first approach

---

## 🎯 Admin UI Standards (Dark Theme)

Todas las pantallas admin siguen el dark theme definido en `src/lib/constants/admin-theme.ts`. Referencia de implementacion: `src/app/admin/servicios/page.tsx` y `src/app/admin/configuracion/sucursales/page.tsx`.

### Colores Base
```
Background principal:  #30302e  (lo provee AdminLayout, NO usar en pages)
Cards/containers:      #262624
Inputs/fields:         #30302e
Bordes:                #3a3a38
Texto primario:        #fafafa
Texto secundario:      #888888
Placeholders:          #666666
Acento principal:      #d97757  (naranja — SIEMPRE, nunca verde)
```

### Fondo de Paginas Admin
```
❌ NUNCA: <main className="bg-[#30302e] ...">
✅ SIEMPRE: <main className="p-6 space-y-6 min-h-screen">
```
`AdminLayout` renderiza `AnimatedBackground` en `fixed inset-0 z-0`. Si la page tiene fondo opaco, tapa la grilla animada. Las pages deben tener fondo **transparente**.

### shadcn/ui Dark Theme Overrides

Los componentes de `components/ui/` tienen colores hardcodeados (ej: `text-gray-900`). Se necesitan overrides con `!important` via Tailwind `!` prefix.

**Input / Textarea**:
```tsx
className="bg-[#30302e] text-[#fafafa] placeholder:text-[#666666] h-12 border-[#3a3a38] focus:border-[#d97757] focus:ring-[#d97757]/20 focus-visible:border-[#d97757] focus-visible:ring-[#d97757]/20"
```
- shadcn Input usa `focus-visible:` NO `focus:` — hay que poner **ambos**
- Textarea: agregar `resize-none min-h-[100px]`

**Select (dark theme)**:
```tsx
// SelectTrigger
className="!bg-[#30302e] !text-[#fafafa] !border-[#3a3a38] h-12 focus:ring-[#d97757] [&>svg]:!text-[#888888] [&>span]:!text-[#fafafa]"

// SelectContent
className="!bg-[#262624] !border-[#3a3a38]"

// SelectItem
className="!text-[#fafafa] !bg-transparent hover:!bg-[#3a3a38] focus:!bg-[#3a3a38] focus:!text-[#fafafa] cursor-pointer [&>span>svg]:!text-[#fafafa]"
```
- El `select.tsx` base tiene `text-gray-900` hardcodeado, se necesita `!` en todo

**Card con Table**:
```tsx
// Card que envuelve una Table debe eliminar padding y gap defaults
<Card className="bg-[#262624] border-[#3a3a38] py-0 gap-0 overflow-hidden">
```
- Card tiene `py-6` y `gap-6` por defecto que generan espacio arriba del table header

**Input readonly (IDs auto-generados)**:
```tsx
<Input readOnly tabIndex={-1} className="... opacity-60 cursor-not-allowed" />
```
- `tabIndex={-1}` para que Tab lo saltee

### Precio Formateado (ARS)

```tsx
// Helpers
function formatPriceDisplay(value: number): string {
  if (value === 0) return ''
  return value.toLocaleString('es-AR')
}

function parsePriceInput(formatted: string): number {
  const cleaned = formatted.replace(/[$\s.]/g, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

// Render: Input con prefijo "$" absoluto
<div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-sm pointer-events-none">$</span>
  <Input
    type="text"
    inputMode="numeric"
    className="... pl-8"
    placeholder="0"
    value={priceDisplay}
    onFocus={() => { if (price === 0) setPriceDisplay('') }}
    onChange={(e) => {
      const parsed = parsePriceInput(e.target.value)
      setPrice(parsed)
      setPriceDisplay(parsed === 0 ? '' : formatPriceDisplay(parsed))
    }}
    onBlur={() => {
      setPriceDisplay(price === 0 ? '' : formatPriceDisplay(price))
    }}
  />
</div>
```

### Stepper Pattern (Dialogs Multi-Step)

Usar cuando el form tiene 2+ secciones logicas. Referencia: `sucursales/page.tsx`, `servicios/page.tsx`.

**Estructura del Dialog**:
```
DialogContent (p-0, max-h-[90vh], flex flex-col)
+-- Header (border-b, px-6 py-4, gradient bg)
|   +-- Titulo
|   +-- Progress bar animada (gradient naranja)
|   +-- Step indicators (circles con iconos)
+-- Content (p-6, min-h-[280px], flex-1, overflow-y-auto)
|   +-- AnimatePresence mode="wait"
|       +-- motion.div (key=step, fade + slide)
+-- Footer (p-6, border-t, shrink-0)
    +-- Left: Cancelar (step 0) / Anterior (step 1+)
    +-- Right: Siguiente (step N-1) / Accion Final (ultimo step)
```

**Steps definition**:
```tsx
const STEPS = [
  { id: 0, title: 'Informacion', description: 'Detalles basicos', icon: FileText },
  { id: 1, title: 'Configuracion', description: 'Opciones avanzadas', icon: Settings },
]
```

**Progress bar**:
```tsx
<div className="h-1 bg-[#3a3a38] rounded-full overflow-hidden">
  <motion.div
    className="h-full rounded-full"
    style={{ background: 'linear-gradient(90deg, #d97757, #e8956f)' }}
    initial={{ width: '0%' }}
    animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  />
</div>
```

**Step indicators (circles)**:
```tsx
{STEPS.map((s) => (
  <div key={s.id} className="flex items-center gap-2">
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
      step > s.id
        ? "bg-[#d97757] text-white"           // Completado = naranja
        : step === s.id
        ? "bg-[#d97757]/20 text-[#d97757] ring-2 ring-[#d97757]/50"  // Actual
        : "bg-[#3a3a38] text-[#666666]"       // Pendiente
    )}>
      {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
    </div>
    <span className={cn("text-xs hidden sm:block", step >= s.id ? "text-[#fafafa]" : "text-[#666666]")}>
      {s.title}
    </span>
  </div>
))}
```

**Colores de los steps: SIEMPRE naranja `#d97757`, NUNCA verde.**

**Validacion por step**:
```tsx
const validateStep = (step: number): boolean => {
  setStepError(null)
  switch (step) {
    case 0:
      if (!field.trim()) { setStepError('Campo requerido'); return false }
      return true
    // ...
  }
}

const handleNextStep = () => {
  if (validateStep(currentStep) && currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1)
}
const handlePrevStep = () => {
  if (currentStep > 0) { setStepError(null); setCurrentStep(prev => prev - 1) }
}
```

**Error display en step**:
```tsx
{stepError && (
  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription className="text-red-400">{stepError}</AlertDescription>
  </Alert>
)}
```

### Dialog Animation (Framer Motion)

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent
    className="p-0 bg-transparent border-none shadow-none max-w-lg [&>button]:hidden"
    data-overlay-translucent
  >
    <motion.div
      className="bg-[#262624] border border-[#3a3a38] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Custom X close button */}
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="absolute top-4 right-4 z-50 rounded-full p-1.5 text-[#888888] hover:text-[#fafafa] hover:bg-[#3a3a38] transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      {/* ... Header, Content, Footer ... */}
    </motion.div>
  </DialogContent>
</Dialog>
```

- `[&>button]:hidden` oculta el boton close nativo de Radix
- `data-overlay-translucent` activa overlay translucido (ver globals.css)
- Custom X button dentro del motion.div

**CSS para overlay translucido** (en `globals.css`):
```css
[data-slot="dialog-portal"]:has([data-overlay-translucent]) [data-slot="dialog-overlay"] {
  background: rgba(0, 0, 0, 0.25) !important;
  backdrop-filter: blur(2px);
}
```

### Reglas Criticas para Dialogs y Forms

```
✅ SIEMPRE type="button" en TODOS los botones del footer del Dialog
   (HTML buttons default a type="submit", cierra el dialog)
✅ SIEMPRE focus-visible: Y focus: en inputs (shadcn usa focus-visible:)
✅ SIEMPRE ! (important) en overrides de Select, SelectContent, SelectItem
✅ SIEMPRE resetear step, errors y display states en openDialog()
✅ SIEMPRE py-0 gap-0 overflow-hidden en Card que envuelve Table
✅ SIEMPRE fondo transparente en pages admin (no bg-[#30302e])
✅ SIEMPRE naranja #d97757 para acento (steps, botones primarios, focus rings)
❌ NUNCA verde para steps completados ni botones de accion
❌ NUNCA bg-[#30302e] en el root element de pages admin
❌ NUNCA focus: sin focus-visible: en inputs shadcn
❌ NUNCA olvidar type="button" en botones dentro de Dialog
```

### Duration Select (Servicios/Turnos)

```tsx
const DURATION_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '75', label: '1h 15min' },
  { value: '90', label: '1h 30min' },
  { value: '105', label: '1h 45min' },
  { value: '120', label: '2 horas' },
]
```
- Incrementos de 15 minutos
- Al editar, snap al multiplo de 15 mas cercano: `Math.round(duration / 15) * 15`

---

## 🔗 Key Integrations

### Supabase
**File**: `src/lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js"
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Realtime Subscriptions**:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('table_name')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, callback)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [])
```

### WhatsApp Integration
**File**: `src/lib/whatsapp.ts`

**CRITICAL**: Always use environment variable
```typescript
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
```

**Checkout Flow**:
1. User adds products to cart → 2. Click "Finalizar compra" → 3. Generate WhatsApp message → 4. Redirect to WhatsApp → 5. Customer confirms order

---

## 📊 Critical Business Flows

### 1. Product Purchase Flow
```
Browse Products → Add to Cart → Review Cart → WhatsApp Checkout → Order Created
```
- Cart stored in localStorage (client-side)
- Use `features/cart/hooks/useCart.ts`

### 2. Appointment Booking Flow
```
Select Service → Choose Date/Time → Fill Form → Submit → Admin Notification
```
- Appointments table in Supabase
- Real-time updates for admin dashboard

### 3. Review & Voucher Flow
```
Customer Submits Review → Admin Approves → Auto-generate Voucher → Apply at Checkout
```

---

## 🚀 Development Workflow

### Starting Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 6001)
npm run dev:clean    # Clean start (kills port first)
```

### Code Quality Checks
```bash
npm run type-check   # TypeScript validation
npm run lint         # Linting
npm run lint:fix     # Auto-fix lint issues
```

### Testing
```bash
npm test             # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
npm run test:smoke   # Smoke tests
```

### Building & Deployment
```bash
npm run build        # Production build
npm start            # Start production server
npm run deploy:check # Pre-deployment validation
```

---

## ⚠️ Archivos Grandes (>500 líneas)

| Archivo | Líneas | Notas |
|---------|--------|-------|
| ProductsClient.tsx | 1,605 | Commits pequeños |
| AgroCamionesClient.tsx | 1,431 | Commits pequeños |
| sucursales/page.tsx | 1,118 | Commits pequeños |
| twilio/webhook/route.ts | 984 | Commits pequeños |
| database.ts (types) | 958 | AUTO-GENERADO, no modificar |
| function-handler.ts | 916 | Commits pequeños |

**Archivos Protegidos**:
- `src/types/database.ts` - Auto-generado de Supabase
- `src/components/ui/` - shadcn/ui, regenerar via CLI

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

---

## ⚠️ Known Issues & Gotchas

| Issue | Solution |
|-------|----------|
| Port 6001 in use | `npm run dev:clean` or `node scripts/kill-port.js 6001` |
| Supabase RLS errors | Check Row Level Security policies in Supabase dashboard |
| WhatsApp number format | Use `549XXXXXXXXXX` (Argentina format) |
| Memory leaks from subscriptions | Always cleanup in useEffect return |
| Type errors after schema changes | Regenerate `src/types/database.ts` from Supabase |

---

**Last Updated**: February 2026
**Questions?**: Create a GitHub issue
