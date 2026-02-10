# Database Changes Pending

Archivo de coordinación para cambios de base de datos entre terminales.

---

## ⏳ Pendiente

- [ ] **Recalcular stock sumando SANTIAGO** (solicitado por Terminal App Code)
  - Contexto: La columna SANTIAGO del Excel no se leía durante la importación. 151 productos tienen stock en Santiago (1200 unidades totales). 33 productos figuran como stock=0 pero tienen unidades en Santiago.
  - El fix en código ya está aplicado (`importHelpers.ts` ahora incluye SANTIAGO). Pero los 741 productos ya importados necesitan recalcular su stock desde `features.stock_por_sucursal` + la data de SANTIAGO del Excel.
  - Opción 1: Re-importar el Excel (recomendado, usa el código ya corregido)
  - Opción 2: SQL manual basado en features.stock_por_sucursal (no tiene SANTIAGO, habría que parsearlo del Excel)
  - **Recomendación**: Re-importar el Excel `stock12.xlsx` desde el admin panel para que el código corregido calcule todo bien

---

## 🔄 En Progreso

<!-- La terminal DATABASE mueve aquí lo que está implementando -->

---

## ✅ Completado

<!-- Cambios ya implementados con referencia a la migración -->

### 2026-02-10 - Sync stock_quantity desde stock

- [x] **20260210_sync_stock_quantity.sql** - Sync stock_quantity = stock
  - UPDATE: 84 productos actualizados
  - Corrige: 84 productos con stock_quantity stale, 5 con ghost stock (stock=0, stock_quantity>0)
  - Verificación: 0 desync restantes
  - Solicitado por: Terminal App Code
  - ✅ Aplicada en producción

### 2026-02-10 - Sync price_list desde features

- [x] **20260210_sync_price_list_from_features.sql** - Sync columna price_list desde JSONB features
  - UPDATE: 741 productos actualizados
  - Corrige: `products.price_list` calculado con `price * 1.25` (incorrecto) → usa `features->>'price_list'` del Excel (correcto)
  - Ejemplo fix: PIRELLI P400EV 175/70R14 mostraba 37% OFF vs 25% OFF por inconsistencia
  - Solicitado por: Terminal App Code
  - ✅ Aplicada en producción

### 2026-02-09 - WhatsApp Source Field

- [x] **20260209_add_whatsapp_source.sql** - Campo source para proveedores WhatsApp
  - Añade: columna `source` a `whatsapp_conversations` y `whatsapp_messages`
  - Valores: 'twilio' (default) | 'baileys'
  - Índices: `idx_whatsapp_conversations_source`, `idx_whatsapp_messages_source`
  - Propósito: Distinguir mensajes de Twilio Business API vs Baileys Web
  - ✅ Aplicada en producción

### 2026-02-09 - WhatsApp Checkout & Order Triggers Fix

- [x] **20260209_add_pending_payment_method.sql** - Enum payment_method extendido
  - Añade: valor `'pending'` al enum `payment_method`
  - Propósito: Soporte para checkout WhatsApp donde el método de pago se define después
  - Código actualizado: `src/features/cart/components/CartDrawer.tsx`

- [x] **20260209_fix_order_triggers.sql** - 🔴 CRÍTICO - Fix triggers de órdenes
  - Corrige: `trigger_notify_new_order` y `trigger_notify_order_cancelled`
  - Error: Usaban `NEW.total` pero la columna correcta es `total_amount`
  - Impacto: Desbloqueadas TODAS las órdenes nuevas

### 2026-02-06 - Migraciones Aplicadas en Producción

- [x] **Extensión pgvector** habilitada (v0.8.0)
  - Necesaria para embeddings de productos y búsqueda semántica

- [x] **20260206_create_embeddings_fixed.sql** - Sistema AI embeddings (corregido para UUID)
  - Crea: `product_embeddings`, `faq_items`, función `match_embeddings`
  - Corrige: FK de BIGINT a UUID para compatibilidad con products.id
  - Usado por: `src/lib/ai/embeddings.ts`

- [x] **20240115_seed_faq_data.sql** - FAQs para chat AI
  - Insertadas: 19 FAQs en 7 categorías
  - Categorías: General (3), Técnico (4), Servicios (2), Compras (3), Mantenimiento (3), Marcas (2), Estacional (2)

- [x] **20250128_create_vehicle_tables.sql** - Vehículos para cotizaciones
  - Crea: `vehicle_brands` (7 marcas), `vehicle_models` (42 modelos)
  - Marcas: Volkswagen, Ford, Chevrolet, Toyota, Renault, Peugeot, Fiat

- [x] **20250128_create_quotation_services.sql** - Servicios de cotización
  - Crea: `quotation_services` (3 servicios)
  - Servicios: Instalación ($2500/neumático), Alineación ($8000), Delivery ($3500)

- [x] **20260206_fix_review_images_rls.sql** - RLS en review_images
  - Habilita RLS
  - Políticas: vista pública de imágenes aprobadas, gestión admin

- [x] **src/types/database.ts** actualizado
  - Añadidas 11 tablas nuevas: product_embeddings, faq_items, vehicle_brands, vehicle_models, quotation_services, admin_notifications, app_settings, whatsapp_conversations, whatsapp_messages, appointment_services
  - Añadidas funciones: match_embeddings, get_admin_dashboard_counts
  - Type-check: ✅ Pasa

### 2026-02-06 - Auditoría de Migraciones

- [x] **Archivadas 8 migraciones redundantes** a `supabase/migrations/_archived/`
  - `001_products.sql` - Superada por 001_initial_schema
  - `003_seed_admin_user.sql` - Solo seed data
  - `008_fix_profiles_rls.sql` - Superada por 010
  - `009_fix_rls_recursion_correct.sql` - Superada por 010
  - `COMBINED_RUN_THIS.sql` - Consolidación obsoleta
  - `create_stores_table.sql` - Superada por 001_initial_schema
  - `fix-products-rls.sql` - Fix parcial aplicado
  - `fix-profiles-recursion-v2.sql` - Superada por 010

- [x] **Creado supabase/MIGRATIONS_README.md** - Documentación completa de migraciones

### 2026-02-06 (Terminal DATABASE)

- [x] **Tabla `reviews`** - Sistema de reseñas de productos
  - Campos: rating, comment, customer_name, is_approved, etc.
  - Índices de performance incluidos
  - migración: `20260206_prerequisites_admin_notifications.sql`

- [x] **Tabla `review_images`** - Imágenes para reseñas
  - migración: `20260206_prerequisites_admin_notifications.sql`

- [x] **Tabla `quotes`** - Cotizaciones de clientes
  - Campos: customer_name, customer_phone, items (JSONB), total, status
  - Status: pending, sent, accepted, rejected, expired
  - migración: `20260206_prerequisites_admin_notifications.sql`

- [x] **Columnas agregadas a `products`**:
  - `stock_quantity` (copia de `stock` para compatibilidad)
  - `min_stock_alert` (umbral para notificaciones, default: 5)
  - `status` (active/inactive, default: 'active')
  - migración: `20260206_prerequisites_admin_notifications.sql`

- [x] **Sistema de notificaciones admin** (URGENTE - solicitado)
  - Tabla `admin_notifications` (19 columnas)
  - ENUMs: `notification_type`, `notification_priority`
  - Función `get_admin_dashboard_counts()` - contadores para dashboard
  - Función `create_admin_notification()` - helper para crear notificaciones
  - **9 Triggers automáticos**:
    - `on_new_order` → orders
    - `on_order_cancelled` → orders
    - `on_new_appointment` → appointments
    - `on_new_review` → reviews
    - `on_new_quote` → quotes
    - `on_low_stock` → products
    - `on_voucher_redeemed` → vouchers
  - Funciones utilitarias: mark_read, mark_all_read, dismiss, clean_old
  - Políticas RLS para admins y vendedores
  - migración: `20260206_admin_notifications.sql`

---

## 📊 Estado de Producción (2026-02-06 actualizado)

### Tablas en Supabase (27 tablas)
| Tabla | Filas | Estado |
|-------|------:|--------|
| products | 741 | ✅ OK |
| branch_stock | 4,446 | ✅ OK |
| whatsapp_messages | 1,060 | ✅ OK |
| whatsapp_conversations | 104 | ✅ OK |
| vehicle_models | 42 | ✅ Nueva |
| appointments | 39 | ✅ OK |
| kommo_messages | 20 | ✅ OK |
| faq_items | 19 | ✅ Nueva |
| profiles | 11 | ✅ OK |
| branches | 8 | ✅ OK |
| vehicle_brands | 7 | ✅ Nueva |
| kommo_conversations | 7 | ✅ OK |
| appointment_services | 6 | ✅ OK |
| app_settings | 5 | ✅ OK |
| stores | 5 | ✅ OK |
| quotation_services | 3 | ✅ Nueva |
| admin_notifications | 0 | ✅ OK |
| product_embeddings | 0 | ✅ Nueva |
| quotes | 0 | ✅ OK |
| reviews | 0 | ✅ OK |
| review_images | 0 | ✅ RLS OK |
| orders | 0 | ✅ OK |
| order_history | 0 | ✅ OK |
| service_vouchers | 0 | ✅ OK |
| vouchers | 0 | ✅ OK |
| config_audit_log | 0 | ✅ OK |
| config_backups | 0 | ✅ OK |

### Extensiones
- ✅ pgvector v0.8.0 (habilitada)

### Dashboard Stats
```
pending_orders: 0
pending_appointments: 39
pending_reviews: 0
pending_quotes: 0
low_stock_products: 581 ⚠️
total_products: 741
faq_items: 19 (7 categorías)
vehicle_brands: 7
vehicle_models: 42
quotation_services: 3
```

---

## 📝 Notas

- Solo la **Terminal DATABASE** (top-left, color cálido) implementa cambios de BD
- Las otras terminales documentan aquí lo que necesitan
- Incluir contexto suficiente para implementar el cambio
- Ver `supabase/MIGRATIONS_README.md` para documentación completa
