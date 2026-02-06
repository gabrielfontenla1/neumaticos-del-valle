# 📍 PROJECT MAP - Inventario de Archivos por Agente

> Este archivo define qué archivos y carpetas pertenecen a cada agente.
> ORCHESTRATOR debe consultarlo para asignar tareas correctamente.

---

## 🗄️ DATA - Especialista en Base de Datos

### Territorio Exclusivo
```
supabase/migrations/           # Migraciones SQL (CREATE, ALTER, etc.)
src/lib/validations/           # Schemas Zod para validación
src/lib/db/                    # Helpers de base de datos (si existe)
```

### Solo Lectura (Referencia)
```
src/types/database.ts          # Tipos generados de Supabase (NO MODIFICAR)
```

### Archivos Clave
| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `supabase/migrations/*.sql` | Cambios de schema | Variable |
| `src/lib/validations/index.ts` | Schemas Zod principales | ~200 |
| `src/lib/validations/admin-notifications.ts` | Schemas específicos | ~50 |

### NO TOCAR
- `src/app/api/` (es de BACKEND)
- `src/components/` (es de FRONTEND/ADMIN)
- `src/features/*/components/` (es de FRONTEND/ADMIN)

---

## ⚙️ BACKEND - Especialista en API

### Territorio Exclusivo
```
src/app/api/**                 # Todos los endpoints (37 rutas)
src/lib/whatsapp/              # Integración WhatsApp
src/lib/twilio/                # Integración Twilio
src/lib/ai/                    # Integración AI (OpenAI, Anthropic)
src/lib/messaging/             # Sistema de mensajería
src/lib/email.ts               # Helper de email
src/lib/resend.ts              # Integración Resend
```

### Archivos Clave
| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `src/app/api/chat/route.ts` | Chat AI endpoint | ~300 |
| `src/app/api/twilio/webhook/route.ts` | Webhook Twilio | 984 ⚠️ |
| `src/lib/ai/function-handler.ts` | Handler funciones AI | 916 ⚠️ |
| `src/app/api/admin/*/route.ts` | Endpoints admin | Variable |

### Documenta En
- `INTERFACES.md` - Contratos de API para FRONTEND/ADMIN
- `SCHEMAS.md` - Consume schemas de DATA

### NO TOCAR
- `src/lib/supabase*.ts` (es de DATA)
- `src/lib/db/` (es de DATA)
- `src/lib/validations/` (es de DATA)
- `src/components/` (es de FRONTEND/ADMIN)
- `src/app/(páginas)/` (es de FRONTEND)

---

## 🎨 FRONTEND - Especialista en UI Pública

### Territorio Exclusivo
```
src/app/                       # Páginas públicas (excepto /admin y /api)
├── page.tsx                   # Homepage
├── productos/                 # Catálogo de productos
├── carrito/                   # Carrito de compras
├── turnos/                    # Reserva de turnos
├── aceites/                   # Página de aceites
├── sucursales/                # Sucursales
├── checkout/                  # Proceso de compra
└── ...

src/components/                # Componentes compartidos (excepto /admin, /ui)
├── layout/                    # Navbar, Footer
├── home/                      # Componentes de home
├── marketing/                 # Promociones, banners
└── ...

src/features/                  # Features públicas
├── cart/                      # Lógica de carrito
├── products/                  # Lógica de productos
├── checkout/                  # Lógica de checkout
├── appointments/              # Lógica de turnos
├── quotation/                 # Cotizaciones
└── reviews/                   # Reseñas

src/hooks/                     # Custom hooks
```

### Archivos Clave
| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `src/app/productos/ProductsClient.tsx` | Catálogo productos | 1,605 ⚠️ |
| `src/app/agro-camiones/AgroCamionesClient.tsx` | Productos agro | 1,431 ⚠️ |
| `src/app/sucursales/page.tsx` | Página sucursales | 1,118 ⚠️ |
| `src/features/cart/hooks/useCart.ts` | Hook carrito | ~200 |

### Consume
- `INTERFACES.md` - Contratos de API de BACKEND

### NO TOCAR
- `src/app/api/` (es de BACKEND)
- `src/app/admin/` (es de ADMIN)
- `src/lib/` (excepto utils.ts)
- `src/components/ui/` (shadcn, no modificar)
- `src/components/admin/` (es de ADMIN)

---

## 🛠️ ADMIN - Especialista en Dashboard

### Territorio Exclusivo
```
src/app/admin/**               # Todas las páginas admin
├── page.tsx                   # Dashboard principal
├── orders/                    # Gestión de pedidos
├── products/                  # Gestión de productos
├── appointments/              # Gestión de turnos
├── chats/                     # Gestión de chats
├── reviews/                   # Gestión de reseñas
├── settings/                  # Configuración
└── ...

src/components/admin/          # Componentes admin
src/features/admin/            # Lógica admin
src/features/orders/           # Gestión de órdenes
src/features/automations/      # Automatizaciones
```

### Archivos Clave
| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `src/features/admin/components/AdminLayout.tsx` | Layout dashboard | ~400 |
| `src/app/admin/chats/page.tsx` | Panel de chats | ~500 |
| `src/app/admin/orders/page.tsx` | Panel de órdenes | ~400 |

### Consume
- `INTERFACES.md` - Contratos de API de BACKEND

### NO TOCAR
- `src/app/(páginas públicas)/` (es de FRONTEND)
- `src/app/api/` (es de BACKEND - solo consumir)
- `src/components/ui/` (shadcn, no modificar)
- `src/lib/` (es de DATA/BACKEND)

---

## 🧪 QA - Especialista en Testing

### Territorio Exclusivo
```
tests/**                       # Tests E2E y de integración
src/**/*.test.ts               # Tests unitarios
playwright.config.ts           # Config Playwright
vitest.config.ts               # Config Vitest
scripts/                       # Scripts de testing
```

### Comandos Que Ejecuta
```bash
npm run type-check             # TypeScript
npm run lint                   # ESLint
npm run build                  # Build de producción
npm test                       # Tests unitarios
npm run test:e2e               # Tests E2E
```

### Reporta En
- `ISSUES.md` - Bugs encontrados

### NO TOCAR
- Código de producción (solo tests)

---

## 🚫 ARCHIVOS COMPARTIDOS - COORDINAR ANTES DE MODIFICAR

| Archivo | Owner | Notas |
|---------|-------|-------|
| `src/types/database.ts` | ❌ NADIE | Auto-generado de Supabase |
| `src/components/ui/*` | ❌ NADIE | shadcn/ui, no modificar |
| `src/lib/utils.ts` | 🌍 TODOS | Coordinar antes de cambiar |
| `src/lib/constants/*` | 🌍 TODOS | Coordinar antes de cambiar |
| `tailwind.config.ts` | 🎨 FRONTEND | Coordinar antes de cambiar |
| `package.json` | 🎯 ORCHESTRATOR | Solo ORCHESTRATOR decide deps |
| `.env*` | ❌ NADIE | No commitear nunca |

---

## ⚠️ ARCHIVOS GRANDES - MODIFICAR CON CUIDADO

> Archivos con más de 500 líneas. Commits pequeños, un cambio a la vez.

| Archivo | Líneas | Owner |
|---------|--------|-------|
| `src/app/productos/ProductsClient.tsx` | 1,605 | 🎨 FRONTEND |
| `src/app/agro-camiones/AgroCamionesClient.tsx` | 1,431 | 🎨 FRONTEND |
| `src/app/sucursales/page.tsx` | 1,118 | 🎨 FRONTEND |
| `src/app/api/twilio/webhook/route.ts` | 984 | ⚙️ BACKEND |
| `src/types/database.ts` | 958 | ❌ AUTO-GENERADO |
| `src/lib/ai/function-handler.ts` | 916 | ⚙️ BACKEND |

---

## 📊 ESTADÍSTICAS DEL PROYECTO

| Métrica | Valor |
|---------|-------|
| Rutas API | ~37 |
| Páginas públicas | ~15 |
| Páginas admin | ~10 |
| Componentes UI | ~50 |
| Features modules | 8 |
| Tablas DB | ~15 |

---

## 🔍 CÓMO USAR ESTE MAPA

### Para ORCHESTRATOR

1. **Antes de asignar tarea**: Verificar qué agente es dueño del archivo
2. **Si hay conflicto**: Dividir tarea en múltiples steps
3. **Si archivo es grande**: Advertir al agente que tenga cuidado

### Ejemplo de Uso

```
Usuario pide: "Agregar filtro de precio al catálogo"

Verificación:
- Catálogo está en src/app/productos/ProductsClient.tsx
- Ese archivo es de FRONTEND
- Es un archivo grande (1,605 líneas) ⚠️

Decisión:
- Asignar a FRONTEND
- Incluir advertencia: "Archivo grande, cambios mínimos"
- Si necesita API nueva: BACKEND primero
```

---

*Última actualización: Febrero 2026*
