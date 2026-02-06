# 🔌 INTERFACES - Contratos API y Componentes

> **⚙️ API** documenta endpoints. **🎨 UI** documenta componentes.
> Otros agentes consultan antes de usar.
> **Última actualización**: Febrero 2026

---

## 📡 Endpoints Disponibles

### Productos

#### GET /api/products
Lista productos con filtros opcionales.

```typescript
// Query params
interface ProductsQuery {
  search?: string      // Búsqueda por texto
  brand?: string       // Filtro por marca
  category?: string    // Filtro por categoría
  minPrice?: number    // Precio mínimo
  maxPrice?: number    // Precio máximo
  inStock?: boolean    // Solo con stock
  limit?: number       // Límite de resultados (default: 50)
  offset?: number      // Offset para paginación
}

// Response
interface ProductsResponse {
  data: Product[]
  total: number
  hasMore: boolean
}
```

#### GET /api/products/[id]
Detalle de un producto específico.

```typescript
// Response
interface ProductDetailResponse {
  data: Product | null
  error?: string
}
```

---

### Órdenes

#### GET /api/orders
Lista órdenes (requiere autenticación).

```typescript
// Response
interface OrdersResponse {
  data: Order[]
  total: number
}
```

#### POST /api/orders
Crear nueva orden.

```typescript
// Body
interface CreateOrderBody {
  items: {
    productId: string
    quantity: number
  }[]
  customerInfo: {
    name: string
    phone: string
    email?: string
  }
  branchId?: string
  notes?: string
}

// Response
interface CreateOrderResponse {
  success: boolean
  orderId?: string
  error?: string
}
```

---

### Sucursales (Branches)

#### GET /api/branches
Lista todas las sucursales.

```typescript
// Response
interface BranchesResponse {
  data: Branch[]
}
```

---

### Turnos (Appointments)

#### POST /api/appointments
Crear nuevo turno con notificación automática al admin.

```typescript
// Body
interface CreateAppointmentBody {
  customer_name: string          // Requerido
  customer_email?: string
  customer_phone?: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  service_type?: string
  selectedServices?: string[]    // Array de service IDs
  branch_id: string              // Requerido
  preferred_date: string         // Requerido, formato: "YYYY-MM-DD"
  preferred_time: string         // Requerido, formato: "HH:MM"
  notes?: string
  voucher_code?: string
  user_id?: string
}

// Response
interface CreateAppointmentResponse {
  success: boolean
  data?: Appointment
  error?: string
  details?: string
}
```

**Comportamiento**:
- Crea el turno en la tabla `appointments`
- Envía email de notificación al admin (no bloquea si falla)
- Si se provee `voucher_code`, lo valida y marca como canjeado
- Retorna el turno creado

**Creado por**: ⚙️ API
**Fecha**: 2026-02-05

---

#### GET /api/appointments
Lista turnos con filtros opcionales.

```typescript
// Query params
interface AppointmentsQuery {
  branch_id?: string    // Filtrar por sucursal
  date?: string         // Filtrar por fecha (YYYY-MM-DD)
}

// Response
interface AppointmentsResponse {
  data: Appointment[]
}
```

---

### Servicios de Citas (Appointment Services)

#### GET /api/appointment-services
Lista servicios disponibles para citas.

```typescript
// Response
interface AppointmentServicesResponse {
  data: AppointmentService[]
}
```

#### GET /api/appointment-services/generate-id
Genera ID único para nueva cita.

```typescript
// Response
{ id: string }
```

---

### Administración

#### GET /api/admin/orders
Lista órdenes para admin (requiere auth admin).

```typescript
// Query params
interface AdminOrdersQuery {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  startDate?: string
  endDate?: string
}

// Response
interface AdminOrdersResponse {
  data: Order[]
  stats: {
    total: number
    pending: number
    confirmed: number
    completed: number
  }
}
```

#### GET /api/admin/orders/[id]
Detalle de orden para admin.

#### PATCH /api/admin/orders/[id]
Actualizar estado de orden.

```typescript
// Body
interface UpdateOrderBody {
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
}
```

#### GET /api/admin/branches
Lista sucursales para admin.

#### POST /api/admin/branches/upload-image
Subir imagen de sucursal.

```typescript
// Body: FormData con campo 'image'
// Response
{ url: string }
```

---

### Stock

#### POST /api/update-stock
Actualizar stock de productos (admin).

```typescript
// Body
interface UpdateStockBody {
  products: {
    id: string
    stock: number
  }[]
}
```

#### POST /api/admin/stock/update
Actualización masiva de stock desde Excel.

```typescript
// Body: FormData con archivo Excel
```

---

### Importación de Productos

#### POST /api/admin/import-products
Importar productos desde archivo.

```typescript
// Body: FormData con archivo
// Response
{
  success: boolean
  imported: number
  errors: string[]
}
```

#### POST /api/admin/update-pirelli
Actualizar productos Pirelli específicamente.

#### POST /api/admin/migrate-brands
Migrar marcas a nuevo formato.

#### POST /api/admin/migrate-dimensions
Migrar dimensiones a nuevo formato.

---

### WhatsApp / Twilio

#### POST /api/twilio/webhook
Webhook para mensajes entrantes de Twilio.

```typescript
// Body: Twilio webhook payload
// Response: TwiML response
```

#### GET /api/admin/whatsapp/conversations
Lista conversaciones de WhatsApp.

```typescript
// Response
interface ConversationsResponse {
  data: Conversation[]
  total: number
}
```

#### GET /api/admin/whatsapp/conversations/[id]
Detalle de conversación.

#### POST /api/admin/whatsapp/conversations/[id]/send
Enviar mensaje en conversación.

```typescript
// Body
{ message: string }
```

#### POST /api/admin/whatsapp/conversations/[id]/pause
Pausar/reanudar bot en conversación.

```typescript
// Body
{ paused: boolean }
```

---

### AI Chat

#### POST /api/ai/chat
Chat con asistente AI.

```typescript
// Body
interface ChatBody {
  message: string
  conversationId?: string
  context?: {
    products?: Product[]
    currentPage?: string
  }
}

// Response
interface ChatResponse {
  message: string
  conversationId: string
  suggestions?: string[]
}
```

---

### Automatizaciones

#### GET /api/automations/events
Lista eventos de automatización.

#### POST /api/automations/simulate
Simular ejecución de automatización.

#### GET /api/automations/history
Historial de ejecuciones.

---

### Notificaciones Admin

#### GET /api/admin/notifications
Lista notificaciones del panel de admin con filtros y paginación.

```typescript
// Query params
interface NotificationsQuery {
  type?: 'new_order' | 'new_appointment' | 'new_review' | 'low_stock' | 'new_quote' | 'order_cancelled' | 'appointment_cancelled' | 'voucher_redeemed' | 'system'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  is_read?: 'true' | 'false'
  limit?: number    // default: 20, max: 100
  offset?: number   // default: 0
}

// Response
interface NotificationListResponse {
  notifications: AdminNotification[]
  total: number
  unread_count: number
}
```

**Creado por**: ⚙️ BACKEND
**Fecha**: 2026-02-06

---

#### POST /api/admin/notifications
Crear notificación manual (tipo: system).

```typescript
// Body
interface CreateNotificationBody {
  type: 'new_order' | 'new_appointment' | 'new_review' | 'low_stock' | 'new_quote' | 'order_cancelled' | 'appointment_cancelled' | 'voucher_redeemed' | 'system'
  title: string          // max 255 chars
  message: string        // max 1000 chars
  priority?: 'low' | 'medium' | 'high' | 'urgent'  // default: 'medium'
  reference_type?: string
  reference_id?: string  // UUID
  action_url?: string    // URL válida
  metadata?: Record<string, unknown>
  expires_at?: string    // ISO datetime
}

// Response 201
interface CreateNotificationResponse {
  success: true
  notification: AdminNotification
}
```

**Creado por**: ⚙️ BACKEND
**Fecha**: 2026-02-06

---

#### GET /api/admin/notifications/[id]
Obtener una notificación específica.

```typescript
// Response
{ notification: AdminNotification }

// Response 404
{ error: 'Notification not found' }
```

---

#### PATCH /api/admin/notifications/[id]
Marcar notificación como leída o acción tomada.

```typescript
// Body
interface UpdateNotificationBody {
  is_read?: true        // marca como leída
  action_taken?: true   // marca acción tomada
}

// Response
{ success: true, notification: AdminNotification }
```

---

#### DELETE /api/admin/notifications/[id]
Descartar (soft delete) una notificación.

```typescript
// Response
{ success: true }
```

---

#### POST /api/admin/notifications/read-all
Marcar todas las notificaciones no leídas como leídas.

```typescript
// Response
{ success: true, marked_count: number }
```

---

#### GET /api/admin/notifications/counts
Obtener contadores del dashboard.

```typescript
// Response
interface DashboardCounts {
  pending_orders: number
  pending_appointments: number
  pending_reviews: number
  pending_quotes: number
  low_stock_products: number
  unread_notifications: number
  active_vouchers: number
  today_appointments: number
  total_products: number
  total_customers: number
}
```

**Creado por**: ⚙️ BACKEND
**Fecha**: 2026-02-06

---

### Mensajes Admin (Broadcast)

#### GET /api/admin/messages
Lista mensajes del sistema / anuncios para admins.

```typescript
// Query params
interface MessagesQuery {
  limit?: number   // default: 20
  offset?: number  // default: 0
}

// Response
interface MessagesResponse {
  messages: AdminNotification[]  // type: 'system'
  total: number
}
```

---

#### POST /api/admin/messages
Crear mensaje broadcast / anuncio del sistema.

```typescript
// Body
interface CreateMessageBody {
  title: string           // max 255 chars
  content: string         // max 5000 chars
  priority?: 'low' | 'medium' | 'high' | 'urgent'  // default: 'medium'
  target_roles?: ('admin' | 'vendedor')[]          // default: ['admin', 'vendedor']
  expires_at?: string     // ISO datetime
}

// Response 201
interface CreateMessageResponse {
  success: true
  message: AdminNotification
}
```

**Creado por**: ⚙️ BACKEND
**Fecha**: 2026-02-06

---

### Configuración AI (Admin)

#### GET /api/admin/settings/ai/prompts
Lista prompts configurados.

#### POST /api/admin/settings/ai/prompts
Actualizar prompts.

#### POST /api/admin/settings/ai/prompts/test
Probar prompt.

#### GET /api/admin/settings/ai/models
Lista modelos AI disponibles.

#### GET /api/admin/settings/ai/health
Estado de salud de servicios AI.

#### POST /api/admin/settings/ai/invalidate
Invalidar caché de AI.

#### GET /api/admin/settings/ai/function-tools
Lista function tools configuradas.

#### POST /api/admin/settings/ai/function-tools/test
Probar function tool.

#### GET /api/admin/settings/ai/whatsapp-bot
Configuración del bot de WhatsApp.

#### POST /api/admin/settings/ai/whatsapp-bot
Actualizar configuración del bot.

---

### Configuración Twilio (Admin)

#### GET /api/admin/settings/twilio
Configuración de Twilio.

#### POST /api/admin/settings/twilio
Actualizar configuración de Twilio.

---

### Otros

#### GET /api/health
Health check del servidor.

```typescript
// Response
{ status: 'ok', timestamp: string }
```

#### POST /api/send-appointment-email
Enviar email de confirmación de cita.

```typescript
// Body
interface AppointmentEmailBody {
  appointmentId: string
  to: string
  type: 'confirmation' | 'reminder' | 'cancellation'
}
```

#### GET /api/auth/[...nextauth]
Endpoints de NextAuth para autenticación.

---

## 🧩 Componentes Disponibles

### shadcn/ui (No modificar)

Ubicación: `src/components/ui/`

Componentes disponibles:
- `Button`, `Input`, `Textarea`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`
- `Table`, `TableHeader`, `TableRow`, `TableCell`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Badge`, `Alert`, `AlertDialog`
- `Dropdown`, `DropdownMenu`, `DropdownMenuItem`
- `Toast`, `Toaster`, `useToast`
- `Tooltip`, `TooltipTrigger`, `TooltipContent`
- `Checkbox`, `Radio`, `Switch`
- `Progress`, `Skeleton`
- `Avatar`, `AvatarImage`, `AvatarFallback`
- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- `Sheet`, `SheetTrigger`, `SheetContent`
- `Popover`, `PopoverTrigger`, `PopoverContent`
- `Command`, `CommandInput`, `CommandList`, `CommandItem`
- `Calendar`, `DatePicker`
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`
- `Separator`, `ScrollArea`

**Uso**:
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
```

---

### Componentes Personalizados

---

#### OilWizard

**Ubicación**: `src/components/marketing/OilWizard.tsx`
**Creado por**: 🎨 UI
**Fecha**: 2026-02-05

Asistente de 3 pasos para recomendar aceite según tipo de motor y uso del vehículo.

**Props**:
```typescript
interface OilWizardProps {
  onRecommendation?: (oilId: string) => void  // Callback cuando recomienda un aceite
}
```

**Lógica de recomendación**:
- Gasolina + Ciudad/Mixto → HX7 10W-40
- Gasolina + Ruta → HX8 5W-30
- Diésel + Cualquiera → HX8 5W-40
- Trabajo pesado → Ultra 5W-40
- Híbrido → Ultra X 5W-30

**Uso**:
```tsx
import { OilWizard } from "@/components/marketing/OilWizard"

<OilWizard onRecommendation={(oilId) => scrollToProduct(oilId)} />
```

---

#### OilProductCard

**Ubicación**: `src/components/marketing/OilProductCard.tsx`
**Creado por**: 🎨 UI
**Fecha**: 2026-02-05

Card visual de producto de aceite con checkbox para comparar y botón de consulta WhatsApp.

**Props**:
```typescript
interface OilProductCardProps {
  oil: OilProduct              // tipo de shellHelixOils.ts
  isSelected?: boolean         // si está seleccionado para comparar
  onToggleCompare?: (oilId: string) => void
  onConsult?: (oil: OilProduct) => void  // default: abre WhatsApp
}
```

**Uso**:
```tsx
import { OilProductCard } from "@/components/marketing/OilProductCard"

<OilProductCard
  oil={oilData}
  isSelected={compareIds.includes(oilData.id)}
  onToggleCompare={handleToggle}
/>
```

---

#### OilFilters

**Ubicación**: `src/components/marketing/OilFilters.tsx`
**Creado por**: 🎨 UI
**Fecha**: 2026-02-05

Barra de filtros horizontal con tabs de categoría y select de viscosidad.

**Props**:
```typescript
interface OilFiltersProps {
  selectedCategory: string     // 'all' | 'Premium' | 'Sintético' | 'Semi-Sintético' | 'Mineral'
  selectedViscosity: string    // 'all' | '5W-30' | '5W-40' | '10W-40' | '15W-40' | '20W-50'
  onCategoryChange: (category: string) => void
  onViscosityChange: (viscosity: string) => void
}
```

**Uso**:
```tsx
import { OilFilters } from "@/components/marketing/OilFilters"

<OilFilters
  selectedCategory={category}
  selectedViscosity={viscosity}
  onCategoryChange={setCategory}
  onViscosityChange={setViscosity}
/>
```

---

#### OilCompareModal

**Ubicación**: `src/components/marketing/OilCompareModal.tsx`
**Creado por**: 🎨 UI
**Fecha**: 2026-02-05

Modal para comparar hasta 3 aceites lado a lado en tabla comparativa.

**Props**:
```typescript
interface OilCompareModalProps {
  oils: OilProduct[]   // máximo 3 productos
  isOpen: boolean
  onClose: () => void
}
```

**Filas de comparación**: Categoría, Viscosidad, Especificaciones, Características, Tamaños, Aplicaciones

**Uso**:
```tsx
import { OilCompareModal } from "@/components/marketing/OilCompareModal"

<OilCompareModal
  oils={selectedOils}
  isOpen={isCompareOpen}
  onClose={() => setIsCompareOpen(false)}
/>
```

---

#### OilFAQ

**Ubicación**: `src/components/marketing/OilFAQ.tsx`
**Creado por**: 🎨 UI
**Fecha**: 2026-02-05

Accordion con 5 preguntas frecuentes sobre aceites. No requiere props.

**Preguntas incluidas**:
1. ¿Cada cuánto debo cambiar el aceite?
2. ¿Cuál es la diferencia entre sintético y mineral?
3. ¿Qué significa la viscosidad 5W-30?
4. ¿Puedo mezclar aceites de diferente viscosidad?
5. ¿Qué aceite es mejor para mi auto con alto kilometraje?

**Uso**:
```tsx
import { OilFAQ } from "@/components/marketing/OilFAQ"

<OilFAQ />
```

---

*(Documentar aquí cuando 🎨 UI cree componentes nuevos)*

**Template para documentar**:
```markdown
#### ComponentName

**Ubicación**: `src/components/[categoria]/ComponentName.tsx`
**Creado por**: 🎨 UI
**Fecha**: YYYY-MM-DD

**Props**:
```typescript
interface ComponentNameProps {
  prop1: string
  prop2?: number
  onAction?: () => void
}
```

**Uso**:
```tsx
import { ComponentName } from "@/components/[categoria]/ComponentName"

<ComponentName prop1="valor" onAction={handleAction} />
```
```

---

## 🪝 Hooks Disponibles

### useCart
**Ubicación**: `src/features/cart/hooks/useCart.ts`

```typescript
interface UseCartReturn {
  items: CartItem[]
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}
```

### useProducts
**Ubicación**: `src/hooks/useProducts.ts`

```typescript
interface UseProductsReturn {
  products: Product[]
  loading: boolean
  error: Error | null
  refetch: () => void
  filters: ProductFilters
  setFilters: (filters: ProductFilters) => void
}
```

*(Documentar más hooks según se creen)*

---

## 📦 Tipos Compartidos

**Ubicación**: `src/types/database.ts` (auto-generado de Supabase)

Tipos principales disponibles:
- `Product`
- `Order`
- `Branch`
- `AppointmentService`
- `Review`
- `Voucher`
- `Conversation`
- `Message`

**Uso**:
```typescript
import type { Product, Order } from "@/types/database"
```

---

## 📧 Servicios de Email

### sendAppointmentNotificationEmail

**Ubicación**: `src/lib/resend.ts`
**Creado por**: 🔌 SERVICES
**Fecha**: 2026-02-05

Envía notificación al admin cuando un cliente reserva un turno.
**No bloquea** el flujo si falla (retorna error en lugar de throw).

**Requiere**: Variable de entorno `ADMIN_EMAIL`

**Interface**:
```typescript
interface AppointmentEmailData {
  customerName: string
  customerEmail: string
  customerPhone: string
  service: string
  date: string        // formato legible: "Lunes 10 de Febrero"
  time: string        // formato: "14:30"
  branch: string      // nombre de sucursal
}

function sendAppointmentNotificationEmail(
  data: AppointmentEmailData
): Promise<{ success: boolean; error?: string }>
```

**Uso**:
```typescript
import { sendAppointmentNotificationEmail } from '@/lib/resend'

// Después de crear turno en DB
const result = await sendAppointmentNotificationEmail({
  customerName: 'Juan Pérez',
  customerEmail: 'juan@email.com',
  customerPhone: '3814567890',
  service: 'Cambio de cubiertas',
  date: 'Lunes 10 de Febrero',
  time: '14:30',
  branch: 'Sucursal Centro'
})

if (!result.success) {
  console.error('Email failed:', result.error)
  // El turno ya se creó, no bloquear
}
```

---

## 📝 Log de Cambios

| Fecha | Agente | Cambio |
|-------|--------|--------|
| 2026-02-06 | ⚙️ BACKEND | APIs de notificaciones: GET/POST /api/admin/notifications, [id], /read-all, /counts |
| 2026-02-06 | ⚙️ BACKEND | API de mensajes broadcast: GET/POST /api/admin/messages |
| 2026-02-05 | ⚙️ API | Nuevo endpoint `POST /api/appointments` con notificación al admin |
| 2026-02-05 | 🔌 SERVICES | Agregado `sendAppointmentNotificationEmail` para notificar turnos |
| 2026-02-05 | ⚙️ API | Documentación inicial de todos los endpoints |
| 2026-02-05 | 🎨 UI | Componentes aceites: OilWizard, OilProductCard, OilFilters, OilCompareModal, OilFAQ |

---

## 🔔 Convenciones

### Al agregar endpoint nuevo:
1. Documentar con TypeScript interfaces
2. Incluir ejemplos de request/response
3. Indicar si requiere autenticación
4. Agregar entrada al Log de Cambios

### Al agregar componente nuevo:
1. Documentar props con interface
2. Incluir ejemplo de uso
3. Indicar dependencias (otros componentes, hooks)
4. Agregar entrada al Log de Cambios

### Al deprecar algo:
1. Marcar con `[DEPRECATED]` en el título
2. Indicar fecha de remoción planeada
3. Sugerir alternativa
