# 🗺️ AGENT_TERRITORIES - Mapa de Territorios

> Referencia definitiva de qué agente tiene ownership de cada directorio/archivo.
> **Última actualización**: Febrero 2026

---

## 📊 Resumen Visual

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR 🧠                              │
│  Lee TODO el proyecto | Escribe: SPECS.md, TASKS.md, STATUS.md     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────┬───────────┴───────────┬─────────────┐
        ▼             ▼                       ▼             ▼
   ┌─────────┐   ┌─────────┐            ┌─────────┐   ┌─────────┐
   │ 🎨 UI   │   │📱 PAGES │            │🔧 ADMIN │   │ ⚙️ API  │
   │         │   │         │            │         │   │         │
   │components│   │app/*    │            │app/admin│   │app/api  │
   │ layout  │   │features │            │features/│   │lib/*    │
   │ home    │   │hooks    │            │ admin   │   │supabase │
   │marketing│   │         │            │ orders  │   │         │
   └────┬────┘   └────┬────┘            └────┬────┘   └────┬────┘
        │             │                      │             │
        └──────┬──────┴──────────────────────┴──────┬──────┘
               │                                    │
               ▼                                    ▼
        ┌─────────────┐                      ┌─────────────┐
        │ 🔌 SERVICES │                      │ ❌ NADIE    │
        │             │                      │             │
        │ lib/twilio  │                      │components/ui│
        │ lib/ai      │                      │types/db.ts  │
        │ lib/email   │                      │(auto-gen)   │
        └─────────────┘                      └─────────────┘
```

---

## 🎯 Territorios por Agente

### 🧠 ORCHESTRATOR
**Rol**: Coordinador central - NO escribe código

| Tipo | Paths | Permisos |
|------|-------|----------|
| 📖 Lee | `**/*` (todo el proyecto) | Solo lectura |
| ✏️ Escribe | `SPECS.md`, `TASKS.md`, `STATUS.md` | Escritura completa |

**Responsabilidades**:
- Recibir requerimientos del usuario
- Descomponer en tareas por agente
- Escribir especificaciones claras
- Monitorear progreso en STATUS.md
- Reportar al usuario

---

### 🎨 UI/DESIGN
**Rol**: Componentes visuales reutilizables

| Directorio | Descripción | Permisos |
|------------|-------------|----------|
| `src/components/layout/` | Header, Footer, Navbar | ✅ Owner |
| `src/components/home/` | Componentes del homepage | ✅ Owner |
| `src/components/marketing/` | Banners, promos, CTAs | ✅ Owner |
| `src/components/` (raíz) | Componentes compartidos | ✅ Owner |

**NO TOCAR**:
| Directorio | Razón |
|------------|-------|
| `src/components/ui/` | shadcn/ui autogenerado |
| `src/components/admin/` | Territorio de ADMIN |
| `src/app/**` | Territorio de PAGES/ADMIN |
| `src/features/**` | Territorio de PAGES/ADMIN |
| `src/lib/**` | Territorio de API/SERVICES |

---

### 📱 PAGES
**Rol**: Páginas públicas y features de usuario

| Directorio | Descripción | Permisos |
|------------|-------------|----------|
| `src/app/productos/` | Catálogo de productos | ✅ Owner |
| `src/app/carrito/` | Carrito de compras | ✅ Owner |
| `src/app/turnos/` | Reserva de citas | ✅ Owner |
| `src/app/checkout/` | Proceso de compra | ✅ Owner |
| `src/app/sucursales/` | Info de sucursales | ✅ Owner |
| `src/app/contacto/` | Página de contacto | ✅ Owner |
| `src/app/cotizador/` | Cotizador de servicios | ✅ Owner |
| `src/app/reviews/` | Sistema de reseñas | ✅ Owner |
| `src/app/agro-camiones/` | Sección agro/camiones | ✅ Owner |
| `src/app/auth/` | Login, registro | ✅ Owner |
| `src/app/page.tsx` | Homepage | ✅ Owner |
| `src/app/layout.tsx` | Root layout | ✅ Owner |
| `src/features/cart/` | Lógica de carrito | ✅ Owner |
| `src/features/products/` | Lógica de productos | ✅ Owner |
| `src/features/checkout/` | Lógica de checkout | ✅ Owner |
| `src/features/appointments/` | Lógica de citas | ✅ Owner |
| `src/features/quotation/` | Lógica de cotizador | ✅ Owner |
| `src/features/reviews/` | Lógica de reseñas | ✅ Owner |
| `src/features/auth/` | Lógica de auth (UI) | ✅ Owner |
| `src/hooks/` | Custom hooks | ✅ Owner |

**NO TOCAR**:
| Directorio | Razón |
|------------|-------|
| `src/app/api/**` | Territorio de API |
| `src/app/admin/**` | Territorio de ADMIN |
| `src/app/dashboard/**` | Territorio de ADMIN |
| `src/components/ui/` | Auto-generado |
| `src/lib/**` | Territorio de API/SERVICES |

---

### 🔧 ADMIN
**Rol**: Dashboard administrativo

| Directorio | Descripción | Permisos |
|------------|-------------|----------|
| `src/app/admin/**` | Todas las páginas admin | ✅ Owner |
| `src/app/dashboard/` | Dashboard principal | ✅ Owner |
| `src/components/admin/` | Componentes admin | ✅ Owner |
| `src/features/admin/` | Lógica admin | ✅ Owner |
| `src/features/orders/` | Gestión de órdenes | ✅ Owner |

**NO TOCAR**:
| Directorio | Razón |
|------------|-------|
| `src/app/(públicas)` | Territorio de PAGES |
| `src/app/api/**` | Territorio de API |
| `src/components/ui/` | Auto-generado |
| `src/lib/**` | Territorio de API/SERVICES |

**Puede consultar** (solo lectura):
- `src/app/api/**` - Para saber qué endpoints usar

---

### ⚙️ API
**Rol**: Endpoints, base de datos, validaciones

| Directorio | Descripción | Permisos |
|------------|-------------|----------|
| `src/app/api/**` | Todos los endpoints | ✅ Owner |
| `src/lib/supabase.ts` | Cliente Supabase | ✅ Owner |
| `src/lib/supabase-admin.ts` | Cliente admin | ✅ Owner |
| `src/lib/supabase-server.ts` | Cliente server | ✅ Owner |
| `src/lib/validations/` | Esquemas Zod | ✅ Owner |
| `src/lib/db/` | Helpers de DB | ✅ Owner |
| `src/lib/config/` | Configuraciones | ✅ Owner |
| `src/lib/constants/` | Constantes app | ✅ Owner |
| `src/lib/products/` | Lógica de productos | ✅ Owner |
| `src/lib/automations/` | Lógica de automations | ✅ Owner |
| `src/features/automations/` | Feature automations | ✅ Owner |
| `supabase/migrations/` | Migraciones DB | ✅ Owner |

**NO TOCAR**:
| Directorio | Razón |
|------------|-------|
| `src/components/**` | Territorio de UI/ADMIN |
| `src/app/(páginas)` | Territorio de PAGES |
| `src/app/admin/**` | Territorio de ADMIN |
| `src/lib/twilio/` | Territorio de SERVICES |
| `src/lib/ai/` | Territorio de SERVICES |
| `src/lib/whatsapp/` | Territorio de SERVICES |
| `src/lib/email.ts` | Territorio de SERVICES |
| `src/lib/resend.ts` | Territorio de SERVICES |

---

### 🔌 SERVICES
**Rol**: Integraciones externas (Twilio, AI, Email)

| Directorio | Descripción | Permisos |
|------------|-------------|----------|
| `src/lib/twilio/` | Integración Twilio | ✅ Owner |
| `src/lib/whatsapp/` | WhatsApp helpers | ✅ Owner |
| `src/lib/ai/` | Integración AI (OpenAI, Anthropic) | ✅ Owner |
| `src/lib/messaging/` | Sistema de mensajería | ✅ Owner |
| `src/lib/email.ts` | Email helpers | ✅ Owner |
| `src/lib/resend.ts` | Integración Resend | ✅ Owner |

**NO TOCAR**:
| Directorio | Razón |
|------------|-------|
| `src/app/api/**` | Territorio de API (aunque usa sus servicios) |
| `src/components/**` | Territorio de UI |
| `src/app/**` | Territorio de PAGES/ADMIN |

**Colaboración con API**:
- SERVICES provee funciones, API las consume en routes
- API importa de `lib/twilio/`, `lib/ai/`, etc.
- SERVICES NO crea routes, solo exports

---

## ❌ ARCHIVOS SIN OWNER (No tocar)

| Path | Razón |
|------|-------|
| `src/components/ui/**` | Auto-generado por shadcn/ui |
| `src/types/database.ts` | Auto-generado de Supabase |
| `node_modules/**` | Dependencias |
| `.next/**` | Build output |
| `*.lock` | Lock files |

---

## 🌍 ARCHIVOS COMPARTIDOS

Requieren coordinación antes de modificar:

| Path | Consultar a |
|------|-------------|
| `src/lib/utils.ts` | Todos los agentes |
| `tailwind.config.ts` | UI principalmente |
| `package.json` | ORCHESTRATOR decide |
| `tsconfig.json` | Todos los agentes |
| `.env.example` | API decide |

---

## 📁 Estructura Completa con Owners

```
src/
├── app/
│   ├── admin/              → 🔧 ADMIN
│   │   ├── automations/    → 🔧 ADMIN
│   │   ├── branches/       → 🔧 ADMIN
│   │   ├── chats/          → 🔧 ADMIN
│   │   ├── orders/         → 🔧 ADMIN
│   │   ├── products/       → 🔧 ADMIN
│   │   ├── promotions/     → 🔧 ADMIN
│   │   ├── reviews/        → 🔧 ADMIN
│   │   ├── settings/       → 🔧 ADMIN
│   │   ├── stock/          → 🔧 ADMIN
│   │   └── vouchers/       → 🔧 ADMIN
│   │
│   ├── api/                → ⚙️ API
│   │   ├── admin/          → ⚙️ API
│   │   ├── ai/             → ⚙️ API (usa 🔌 SERVICES)
│   │   ├── automations/    → ⚙️ API
│   │   ├── auth/           → ⚙️ API
│   │   ├── branches/       → ⚙️ API
│   │   ├── health/         → ⚙️ API
│   │   ├── orders/         → ⚙️ API
│   │   ├── products/       → ⚙️ API
│   │   └── twilio/         → ⚙️ API (usa 🔌 SERVICES)
│   │
│   ├── dashboard/          → 🔧 ADMIN
│   ├── sys/                → ⚙️ API (sistema)
│   │
│   ├── agro-camiones/      → 📱 PAGES
│   ├── auth/               → 📱 PAGES
│   ├── carrito/            → 📱 PAGES
│   ├── checkout/           → 📱 PAGES
│   ├── contacto/           → 📱 PAGES
│   ├── cotizador/          → 📱 PAGES
│   ├── productos/          → 📱 PAGES
│   ├── reviews/            → 📱 PAGES
│   ├── sucursales/         → 📱 PAGES
│   ├── turnos/             → 📱 PAGES
│   ├── page.tsx            → 📱 PAGES
│   └── layout.tsx          → 📱 PAGES
│
├── components/
│   ├── ui/                 → ❌ NADIE (shadcn)
│   ├── admin/              → 🔧 ADMIN
│   ├── layout/             → 🎨 UI
│   ├── home/               → 🎨 UI
│   ├── marketing/          → 🎨 UI
│   └── [otros]/            → 🎨 UI
│
├── features/
│   ├── admin/              → 🔧 ADMIN
│   ├── orders/             → 🔧 ADMIN
│   ├── automations/        → ⚙️ API
│   ├── cart/               → 📱 PAGES
│   ├── products/           → 📱 PAGES
│   ├── checkout/           → 📱 PAGES
│   ├── appointments/       → 📱 PAGES
│   ├── quotation/          → 📱 PAGES
│   ├── reviews/            → 📱 PAGES
│   └── auth/               → 📱 PAGES (UI) + ⚙️ API (lógica)
│
├── hooks/                  → 📱 PAGES
│
├── lib/
│   ├── supabase*.ts        → ⚙️ API
│   ├── validations/        → ⚙️ API
│   ├── db/                 → ⚙️ API
│   ├── config/             → ⚙️ API
│   ├── constants/          → ⚙️ API
│   ├── products/           → ⚙️ API
│   ├── automations/        → ⚙️ API
│   ├── twilio/             → 🔌 SERVICES
│   ├── whatsapp/           → 🔌 SERVICES
│   ├── ai/                 → 🔌 SERVICES
│   ├── messaging/          → 🔌 SERVICES
│   ├── email.ts            → 🔌 SERVICES
│   ├── resend.ts           → 🔌 SERVICES
│   └── utils.ts            → 🌍 COMPARTIDO
│
└── types/
    └── database.ts         → ❌ NADIE (auto-generado)
```

---

## 🔄 Reglas de Conflicto

### Si dos agentes necesitan el mismo archivo:

1. **Verificar owner en este documento**
2. **Si es compartido**: Coordinar via ORCHESTRATOR
3. **Si hay duda**: Preguntar en STATUS.md antes de editar

### Prioridad de ownership:

1. Owner explícito en este documento
2. ORCHESTRATOR decide en casos ambiguos
3. Último en llegar espera

---

## 📝 Notas de Implementación

### Auth Feature (caso especial)
- **UI del login/registro**: 📱 PAGES (`src/app/auth/`, `src/features/auth/components/`)
- **Lógica de autenticación**: ⚙️ API (`src/app/api/auth/`, `src/features/auth/api.ts`)
- **NextAuth config**: ⚙️ API

### Automations Feature (caso especial)
- **Dashboard UI**: 🔧 ADMIN (`src/app/admin/automations/`)
- **Lógica backend**: ⚙️ API (`src/features/automations/`, `src/lib/automations/`)
- **Integración Twilio/AI**: 🔌 SERVICES (provee funciones)
