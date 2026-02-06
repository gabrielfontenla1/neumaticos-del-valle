# Database Schemas

Este archivo es actualizado por el agente **DATA**.

Los otros agentes (BACKEND, FRONTEND, ADMIN) leen este archivo para conocer la estructura de datos.

---

## Tablas Existentes

Ver `src/types/database.ts` para tipos auto-generados de Supabase.

Tablas principales:
- `products` - Catálogo de neumáticos
- `orders` - Pedidos
- `appointments` - Turnos
- `branches` - Sucursales
- `reviews` - Reseñas
- `vouchers` - Cupones
- `chat_conversations` - Conversaciones AI
- `admin_users` - Usuarios admin

---

## Nuevos Schemas

---

## Tabla: admin_notifications (creada 2026-02-06)

Sistema de notificaciones para el panel de administración con triggers automáticos.

### SQL

```sql
-- Enums
CREATE TYPE notification_type AS ENUM (
  'new_order', 'new_appointment', 'new_review', 'low_stock',
  'new_quote', 'order_cancelled', 'appointment_cancelled',
  'voucher_redeemed', 'system'
);

CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Tabla
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority notification_priority DEFAULT 'medium',
  reference_type TEXT,          -- 'order', 'appointment', 'review', 'product', 'quote', 'voucher'
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES profiles(id),
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES profiles(id),
  action_url TEXT,
  action_taken BOOLEAN DEFAULT FALSE,
  action_taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

### Función: get_admin_dashboard_counts()

Retorna contadores para el dashboard de admin.

```sql
SELECT * FROM get_admin_dashboard_counts();
```

**Retorna:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| pending_orders | BIGINT | Pedidos con status='pending' |
| pending_appointments | BIGINT | Turnos con status='pending' |
| pending_reviews | BIGINT | Reviews con is_approved=false |
| pending_quotes | BIGINT | Cotizaciones con status='pending' |
| low_stock_products | BIGINT | Productos con stock <= min_stock_alert |
| unread_notifications | BIGINT | Notificaciones no leídas |
| active_vouchers | BIGINT | Vouchers con status='active' |
| today_appointments | BIGINT | Turnos de hoy |
| total_products | BIGINT | Productos activos |
| total_customers | BIGINT | Clientes únicos (por email) |

### Triggers Automáticos

| Trigger | Tabla | Evento | Notificación |
|---------|-------|--------|--------------|
| on_new_order | orders | INSERT | new_order (high) |
| on_new_appointment | appointments | INSERT | new_appointment (high) |
| on_new_review | reviews | INSERT | new_review (urgent si rating<=2) |
| on_new_quote | quotes | INSERT | new_quote (medium) |
| on_low_stock | products | UPDATE stock_quantity | low_stock (urgent si stock=0) |
| on_order_cancelled | orders | UPDATE status→cancelled | order_cancelled (medium) |
| on_voucher_redeemed | vouchers | UPDATE status→redeemed | voucher_redeemed (low) |

### Funciones Auxiliares

```sql
-- Marcar como leída
SELECT mark_notification_read('uuid-notif', 'uuid-user');

-- Marcar todas como leídas
SELECT mark_all_notifications_read('uuid-user');

-- Descartar
SELECT dismiss_notification('uuid-notif', 'uuid-user');

-- Limpiar antiguas (>30 días leídas)
SELECT clean_old_notifications();

-- Crear notificación manual
SELECT create_admin_notification(
  'system'::notification_type,
  'Título',
  'Mensaje',
  'order',        -- reference_type
  'uuid-orden',   -- reference_id
  'high'::notification_priority,
  '/admin/orders/uuid'  -- action_url
);
```

### Zod Schema

```typescript
import { z } from 'zod'

export const notificationTypeEnum = z.enum([
  'new_order', 'new_appointment', 'new_review', 'low_stock',
  'new_quote', 'order_cancelled', 'appointment_cancelled',
  'voucher_redeemed', 'system',
])

export const notificationPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])

export const adminNotificationSchema = z.object({
  id: z.string().uuid(),
  type: notificationTypeEnum,
  title: z.string(),
  message: z.string(),
  priority: notificationPriorityEnum,
  reference_type: z.string().nullable(),
  reference_id: z.string().uuid().nullable(),
  metadata: z.record(z.unknown()),
  is_read: z.boolean(),
  read_at: z.string().datetime().nullable(),
  action_url: z.string().nullable(),
  created_at: z.string().datetime(),
})

export const dashboardCountsSchema = z.object({
  pending_orders: z.number(),
  pending_appointments: z.number(),
  pending_reviews: z.number(),
  pending_quotes: z.number(),
  low_stock_products: z.number(),
  unread_notifications: z.number(),
  active_vouchers: z.number(),
  today_appointments: z.number(),
  total_products: z.number(),
  total_customers: z.number(),
})
```

**Ubicación**: `src/lib/validations/admin-notifications.ts`

### RLS Policies

- `Admins can view notifications`: SELECT para profiles con role='admin'|'vendedor'
- `Admins can update notifications`: UPDATE para profiles con role='admin'|'vendedor'
- `System can insert notifications`: INSERT permitido (triggers)

### Uso desde BACKEND

```typescript
// Obtener contadores
const { data } = await supabase.rpc('get_admin_dashboard_counts')

// Obtener notificaciones
const { data } = await supabase
  .from('admin_notifications')
  .select('*')
  .eq('is_read', false)
  .order('created_at', { ascending: false })
  .limit(20)

// Marcar como leída
await supabase.rpc('mark_notification_read', {
  p_notification_id: notifId,
  p_user_id: userId
})
```

---

<!-- DATA: Documentá aquí los schemas cuando crees tablas nuevas -->

---

## Tabla: profiles (verificada 2026-02-06)

### Estado Actual
- **Registros**: 11 usuarios (1 admin, 10 vendedores)
- **Acceso**: service_role ✅ | anon key ❓ (verificar RLS)

### Columnas Reales
```sql
id              UUID PRIMARY KEY
email           TEXT NOT NULL
full_name       TEXT
phone           TEXT
role            TEXT ('admin' | 'vendedor')
branch_id       UUID REFERENCES branches(id)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
last_sign_in_at TIMESTAMPTZ
```

### Datos de Ejemplo
```
admin@neumaticosdelvalleocr.cl | Administrador Sistema | admin
diaz.anahi@neumaticosdelvalle.com | Díaz Anahí | vendedor
camus.luis@neumaticosdelvalle.com | Camus Luis | vendedor
... (9 más)
```

### RLS Policies (actualizado 2026-02-06)

**Policy activa**:
```sql
CREATE POLICY "Allow public read on profiles"
  ON public.profiles FOR SELECT USING (true);
```

**Acceso verificado**:
- ✅ service_role: lee 11 registros
- ✅ anon key: lee 11 registros (fix aplicado)

**Método de fix**: node-postgres con `ssl: { rejectUnauthorized: false }`

### Template:

```markdown
## Tabla: [nombre]

### SQL
\`\`\`sql
CREATE TABLE [nombre] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- campos
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Zod Schema
\`\`\`typescript
export const [nombre]Schema = z.object({
  // campos
});
\`\`\`

### RLS Policies
- [descripción de políticas]
```
