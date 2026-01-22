# Arquitectura Completa - Neumáticos del Valle

**Versión**: 0.1.0
**Fecha**: 2026-01-21
**Stack Principal**: Next.js 15.5.9 + TypeScript + Supabase

---

## 📋 Tabla de Contenidos

1. [Stack Tecnológico](#-stack-tecnológico)
2. [Arquitectura General](#-arquitectura-general)
3. [Estructura de Carpetas](#-estructura-de-carpetas)
4. [Base de Datos](#-base-de-datos)
5. [Módulos Principales](#-módulos-principales)
6. [Integraciones Externas](#-integraciones-externas)
7. [Flujos de Negocio](#-flujos-de-negocio)
8. [Seguridad](#-seguridad)
9. [Performance](#-performance)
10. [Testing](#-testing)

---

## 🛠 Stack Tecnológico

### Frontend
- **Framework**: Next.js 15.5.9 (App Router)
- **UI**: React 19.1.0
- **TypeScript**: 5.x
- **Styling**: Tailwind CSS 3.4.1
- **Componentes UI**: shadcn/ui + Radix UI
- **Animaciones**: Framer Motion 12.23
- **Icons**: Lucide React
- **Themes**: next-themes (dark/light mode)

### Backend & API
- **Runtime**: Node.js >=20.0.0
- **API Routes**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma 6.18.0
- **Auth**: NextAuth 5.0 (beta) + Supabase Auth
- **Validaciones**: Zod 4.1.13

### AI & Messaging
- **OpenAI**: GPT-4o-mini, GPT-3.5-turbo
- **Anthropic**: Claude SDK (chat admin)
- **Vercel AI SDK**: 5.0.89
- **Twilio**: WhatsApp Business API
- **Email**: Resend (react-email)

### Storage & Files
- **Supabase Storage**: Imágenes de productos, documentos
- **PDF Generation**: jsPDF 3.0.3
- **QR Codes**: qrcode 1.5.4
- **Excel**: xlsx 0.18.5

### Development & Testing
- **Testing**: Vitest 4.0.14, Playwright 1.56
- **Linting**: ESLint 9.39.1
- **Formatting**: Prettier 3.6.2
- **Type Checking**: TypeScript strict mode

---

## 🏗 Arquitectura General

### Patrón Arquitectónico: Feature-Sliced Design + Service Layer

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                      │
│  Next.js App Router + React Server Components (RSC)        │
├─────────────────────────────────────────────────────────────┤
│                     FEATURE MODULES                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Products  │ │ Orders   │ │   Cart   │ │Appointments│     │
│  │          │ │          │ │          │ │          │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Auth    │ │   AI     │ │WhatsApp  │ │Automations│     │
│  │          │ │          │ │          │ │          │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│                     SERVICE LAYER                           │
│  /src/lib/* - Business Logic, AI, Messaging, Validations   │
├─────────────────────────────────────────────────────────────┤
│                     DATA ACCESS LAYER                       │
│  Supabase Client + Prisma ORM + PostgreSQL                 │
├─────────────────────────────────────────────────────────────┤
│                  EXTERNAL INTEGRATIONS                      │
│  OpenAI │ Twilio │ Resend │ Supabase Storage              │
└─────────────────────────────────────────────────────────────┘
```

### Principios de Diseño

1. **Server-First Architecture**: React Server Components por defecto
2. **Feature Isolation**: Cada feature es auto-contenido
3. **Type Safety**: TypeScript strict + Zod validations
4. **Performance**: Static generation + ISR + Edge caching
5. **Progressive Enhancement**: Funcionalidad básica sin JS

---

## 📁 Estructura de Carpetas

```
neumaticos-del-valle/
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (public)/                 # Rutas públicas
│   │   │   ├── page.tsx              # Homepage
│   │   │   ├── productos/            # Catálogo de productos
│   │   │   ├── turnos/               # Sistema de turnos
│   │   │   ├── servicios/            # Servicios de taller
│   │   │   ├── carrito/              # Carrito de compras
│   │   │   └── checkout/             # Proceso de compra
│   │   │
│   │   ├── admin/                    # Panel administrativo
│   │   │   ├── login/                # Login admin
│   │   │   ├── products/             # CRUD productos
│   │   │   ├── stock/                # Gestión de inventario
│   │   │   ├── orders/               # Gestión de pedidos
│   │   │   ├── appointments/         # Gestión de turnos
│   │   │   ├── chats/                # Inbox de conversaciones
│   │   │   ├── usuarios/             # Gestión de usuarios
│   │   │   ├── vouchers/             # Cupones y descuentos
│   │   │   └── configuracion/        # Settings generales
│   │   │
│   │   └── api/                      # API Routes
│   │       ├── auth/                 # Autenticación
│   │       ├── products/             # API productos
│   │       ├── orders/               # API pedidos
│   │       ├── twilio/               # Webhook WhatsApp
│   │       ├── ai/                   # API AI (chat)
│   │       └── health/               # Health checks
│   │
│   ├── components/                   # React Components
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── admin/                    # Admin-specific components
│   │   ├── layout/                   # Layout components
│   │   ├── home/                     # Homepage components
│   │   └── marketing/                # Marketing components
│   │
│   ├── features/                     # Feature Modules (FSD)
│   │   ├── products/                 # Feature: Productos
│   │   │   ├── components/           # UI específico de productos
│   │   │   ├── hooks/                # Custom hooks
│   │   │   └── catalog/              # Lógica de catálogo
│   │   │
│   │   ├── cart/                     # Feature: Carrito
│   │   │   ├── components/           # UI carrito
│   │   │   └── hooks/                # useCart, etc.
│   │   │
│   │   ├── orders/                   # Feature: Pedidos
│   │   │   ├── components/           # Order UI
│   │   │   └── hooks/                # useOrders
│   │   │
│   │   ├── appointments/             # Feature: Turnos
│   │   │   ├── components/           # Appointment UI
│   │   │   └── hooks/                # useAppointments
│   │   │
│   │   ├── auth/                     # Feature: Autenticación
│   │   │   └── components/           # Login, Register
│   │   │
│   │   └── automations/              # Feature: Automatizaciones
│   │       ├── components/           # Automation UI
│   │       ├── definitions/          # Automation configs
│   │       └── hooks/                # useAutomations
│   │
│   ├── lib/                          # Business Logic Layer
│   │   ├── ai/                       # AI & LLM Logic
│   │   │   ├── agents/               # AI agents
│   │   │   ├── prompts/              # System prompts
│   │   │   └── context/              # Context builders
│   │   │
│   │   ├── whatsapp/                 # WhatsApp Logic
│   │   │   ├── ai/                   # AI para WhatsApp
│   │   │   ├── handlers/             # Message handlers
│   │   │   ├── services/             # WhatsApp services
│   │   │   └── templates/            # Message templates
│   │   │
│   │   ├── twilio/                   # Twilio Integration
│   │   │   └── client.ts             # Twilio SDK wrapper
│   │   │
│   │   ├── db/                       # Database Access
│   │   │   └── supabase.ts           # Supabase client
│   │   │
│   │   ├── auth/                     # Auth Logic
│   │   │   └── nextauth.ts           # NextAuth config
│   │   │
│   │   ├── products/                 # Product Logic
│   │   │   └── search.ts             # Product search
│   │   │
│   │   ├── automations/              # Automation Engine
│   │   │   └── engine.ts             # Automation runner
│   │   │
│   │   ├── messaging/                # Messaging Logic
│   │   │   └── templates.ts          # Email/SMS templates
│   │   │
│   │   ├── validations/              # Zod Schemas
│   │   │   └── schemas.ts            # Validation schemas
│   │   │
│   │   ├── config/                   # App Configuration
│   │   │   └── constants.ts          # App constants
│   │   │
│   │   └── constants/                # Business Constants
│   │       └── index.ts              # Constantes globales
│   │
│   ├── types/                        # TypeScript Types
│   │   ├── database.ts               # Supabase types
│   │   └── globals.d.ts              # Global types
│   │
│   ├── config/                       # Configuration Files
│   │   └── site.ts                   # Site metadata
│   │
│   └── data/                         # Static Data
│       └── products.json             # Product seed data
│
├── supabase/                         # Supabase Configuration
│   └── migrations/                   # SQL migrations
│       ├── 20260121_ai_config_settings.sql
│       ├── 20260121_branches_storage.sql
│       └── [other migrations]
│
├── scripts/                          # Build & Utility Scripts
│   ├── kill-port.js                  # Kill port 6001
│   ├── start-server.js               # Production server
│   ├── migrate.js                    # Run migrations
│   └── deploy-check.js               # Pre-deployment checks
│
├── tests/                            # Tests
│   └── chats-overflow-test.spec.ts   # Playwright E2E
│
├── public/                           # Static Assets
│   ├── images/                       # Imágenes públicas
│   └── fonts/                        # Fuentes
│
├── .env.local                        # Environment variables (local)
├── .env.production                   # Environment variables (prod)
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies
└── DATABASE_AUDIT_REPORT.md          # DB documentation
```

---

## 🗄 Base de Datos

### Supabase PostgreSQL - Schema Completo

#### Tablas Core (18 tablas)

##### 1. **profiles** - Usuarios del sistema
```sql
- id: UUID (FK → auth.users.id)
- email: VARCHAR
- full_name: VARCHAR
- role: user_role ENUM (admin, vendedor)
- branch_id: UUID (FK → branches.id)
- phone: VARCHAR
- last_sign_in_at: TIMESTAMP
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (5 policies)
```

##### 2. **products** - Catálogo de productos
```sql
- id: UUID
- name: VARCHAR NOT NULL
- brand: VARCHAR NOT NULL
- model: VARCHAR
- category: VARCHAR NOT NULL
- size: VARCHAR
- width, profile, diameter: INTEGER
- load_index: VARCHAR
- speed_rating: VARCHAR
- description: TEXT
- price: DECIMAL(10,2)
- stock: INTEGER DEFAULT 0
- image_url: TEXT
- features: JSONB
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (2 policies)
- INDEXES: 10 (brand, category, size, search)
```

##### 3. **branches** - Sucursales
```sql
- id: UUID
- name: VARCHAR NOT NULL
- address: VARCHAR
- phone: VARCHAR NOT NULL
- email: VARCHAR NOT NULL
- is_active: BOOLEAN DEFAULT true
- is_main: BOOLEAN DEFAULT false
- latitude, longitude: DECIMAL(10,8)
- working_hours: JSONB
- capacity: INTEGER
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (4 policies)
- CONSTRAINT: Solo 1 sucursal can be is_main
```

##### 4. **branch_stock** - Inventario por sucursal
```sql
- id: UUID
- branch_id: UUID (FK → branches.id)
- product_id: UUID (FK → products.id)
- quantity: INTEGER DEFAULT 0
- min_quantity: INTEGER DEFAULT 0
- last_updated: TIMESTAMP
- updated_by: UUID (FK → profiles.id)
- RLS: ENABLED (2 policies)
- INDEXES: 6 (branch_id, product_id, quantity)
```

##### 5. **appointments** - Sistema de turnos
```sql
- id: UUID
- customer_name: VARCHAR NOT NULL
- customer_email: VARCHAR
- customer_phone: VARCHAR NOT NULL
- service_type: VARCHAR
- appointment_date: DATE NOT NULL
- appointment_time: TIME NOT NULL
- status: appointment_status ENUM
  (pending, confirmed, completed, cancelled, no_show)
- branch: VARCHAR
- store_id: UUID (FK → stores.id)
- service_id: UUID (FK → appointment_services.id)
- vehicle_info: JSONB
- notes: TEXT
- source: TEXT DEFAULT 'web'
- user_id: UUID (FK → profiles.id)
- kommo_conversation_id: UUID (FK → kommo_conversations.id)
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (3 policies)
- INDEXES: 8 (date, status, phone)
- TRIGGERS: 2 (availability check, updated_at)
```

##### 6. **appointment_services** - Servicios disponibles
```sql
- id: UUID
- name: VARCHAR NOT NULL
- description: TEXT
- duration: INTEGER (minutos)
- price: DECIMAL(10,2)
- is_active: BOOLEAN DEFAULT true
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (2 policies)
```

##### 7. **orders** - Pedidos de clientes
```sql
- id: UUID
- customer_name: VARCHAR NOT NULL
- customer_email: VARCHAR
- customer_phone: VARCHAR NOT NULL
- status: order_status ENUM
  (pending, processing, shipped, delivered, cancelled, refunded)
- payment_status: payment_status ENUM
  (pending, paid, failed, refunded, partially_paid)
- payment_method: payment_method ENUM
  (cash, credit_card, debit_card, transfer, mercadopago, other)
- source: order_source ENUM
  (website, whatsapp, phone, walk_in, app, admin)
- total_amount: DECIMAL(10,2)
- items: JSONB (array de productos)
- delivery_address: TEXT
- delivery_date: DATE
- notes: TEXT
- store_id: UUID (FK → stores.id)
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (3 policies - solo staff)
- INDEXES: 12 (status, customer_email, phone)
- TRIGGERS: 3 (status_change, payment_change, updated_at)
```

##### 8. **order_history** - Historial de cambios de pedidos
```sql
- id: UUID
- order_id: UUID (FK → orders.id)
- action: VARCHAR
- description: TEXT
- previous_status: VARCHAR
- new_status: VARCHAR
- user_id: UUID (FK → auth.users.id)
- created_at: TIMESTAMP
- RLS: ENABLED (2 policies - solo staff)
- INDEXES: 4 (order_id, created_at)
```

##### 9. **stores** - Puntos de venta
```sql
- id: UUID
- name: VARCHAR NOT NULL
- address: TEXT
- phone: VARCHAR NOT NULL
- email: VARCHAR
- is_main: BOOLEAN DEFAULT false
- working_hours: JSONB
- latitude, longitude: DECIMAL(10,8)
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (2 policies)
- TRIGGER: ensure_single_main_branch
```

##### 10. **whatsapp_conversations** - Conversaciones WhatsApp
```sql
- id: UUID
- phone: VARCHAR NOT NULL
- contact_name: VARCHAR NOT NULL
- status: conversation_status ENUM
  (active, resolved, archived, escalated)
- conversation_state: conversation_state ENUM
  (idle, waiting_user, processing, waiting_appointment,
   waiting_product_info, completed)
- message_count: INTEGER DEFAULT 0
- last_message_at: TIMESTAMP
- is_paused: BOOLEAN DEFAULT false
- pause_reason: VARCHAR
- preferred_branch_id: UUID (FK → branches.id)
- pending_appointment: JSONB
- user_city: VARCHAR
- metadata: JSONB
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (3 policies)
- INDEXES: 10 (phone, status, conversation_state)
```

##### 11. **whatsapp_messages** - Mensajes WhatsApp
```sql
- id: UUID
- conversation_id: UUID (FK → whatsapp_conversations.id)
- role: message_role ENUM (user, assistant, system)
- content: TEXT NOT NULL
- intent: VARCHAR
- metadata: JSONB
- sent_by_user_id: TEXT
- sent_by_human: BOOLEAN DEFAULT false
- created_at: TIMESTAMP
- RLS: ENABLED (3 policies)
- INDEXES: 3 (conversation_id, role, created_at)
- TRIGGER: update_conversation_stats
```

##### 12. **kommo_conversations** - Conversaciones Kommo CRM
```sql
- id: UUID
- kommo_chat_id: VARCHAR
- kommo_contact_id: VARCHAR
- kommo_lead_id: VARCHAR
- phone: VARCHAR
- contact_name: VARCHAR
- contact_email: VARCHAR
- status: conversation_status ENUM
- channel: channel_type ENUM
  (whatsapp, telegram, instagram, facebook, email, sms)
- message_count, bot_message_count, user_message_count: INTEGER
- last_message_at, last_bot_response_at: TIMESTAMP
- escalated_at, resolved_at: TIMESTAMP
- escalation_reason: VARCHAR
- assigned_to: VARCHAR
- provider: TEXT NOT NULL
- metadata: JSONB
- tags: TEXT[]
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (2 policies)
- INDEXES: 13 (phone, status, channel, provider)
- TRIGGER: update_updated_at
```

##### 13. **kommo_messages** - Mensajes Kommo
```sql
- id: UUID
- conversation_id: UUID (FK → kommo_conversations.id)
- kommo_message_id: VARCHAR
- role: message_role ENUM
- content: TEXT NOT NULL
- content_type: content_type ENUM
  (text, image, video, audio, document, location, sticker)
- intent: VARCHAR
- sentiment: VARCHAR
- ai_model: VARCHAR
- provider: TEXT NOT NULL
- metadata: JSONB
- created_at: TIMESTAMP
- RLS: ENABLED (2 policies)
- INDEXES: 7 (conversation_id, role, content_type)
- TRIGGERS: 2 (update_message_counts, update_last_user_message)
```

##### 14. **vouchers** - Cupones de descuento
```sql
- id: UUID
- code: VARCHAR UNIQUE NOT NULL
- discount_percentage: DECIMAL(5,2)
- max_uses: INTEGER
- current_uses: INTEGER DEFAULT 0
- valid_from: TIMESTAMP
- valid_until: TIMESTAMP
- is_active: BOOLEAN DEFAULT true
- branch_id: UUID (FK → branches.id)
- product_id: UUID (FK → products.id)
- created_by: UUID (FK → profiles.id)
- used_by: UUID (FK → profiles.id)
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (3 policies)
- INDEXES: 7 (code, is_active, valid_until)
```

##### 15. **service_vouchers** - Bonos de servicio
```sql
- id: UUID
- code: VARCHAR UNIQUE NOT NULL
- service_type: service_type ENUM
  (inspection, rotation, balancing, alignment)
- status: service_voucher_status ENUM
  (pending, active, redeemed, expired)
- valid_from, valid_until: TIMESTAMP
- redeemed_at: TIMESTAMP
- redeemed_by: UUID (FK → profiles.id)
- store_id: UUID (FK → stores.id)
- notes: TEXT
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (3 policies)
- INDEXES: 7 (code, status, service_type)
- TRIGGER: update_updated_at
```

##### 16. **app_settings** - Configuración de la aplicación
```sql
- id: UUID
- key: VARCHAR(100) UNIQUE NOT NULL
- value: JSONB NOT NULL
- description: VARCHAR(500)
- is_public: BOOLEAN DEFAULT false
- created_at, updated_at: TIMESTAMP
- RLS: ENABLED (1 policy - admin only)
- INDEXES: 3 (key, is_public)
- TRIGGER: update_updated_at
```

**Keys importantes**:
- `twilio_config`: Configuración de Twilio
- `ai_models_config`: Modelos de IA
- `whatsapp_bot_config`: Configuración bot WhatsApp
- `whatsapp_system_prompt`: System prompt principal
- `whatsapp_function_tools`: Function calling definitions
- `ai_prompts_config`: Prompts de IA
- `services_config`: Servicios disponibles

##### 17. **config_audit_log** - Auditoría de cambios de configuración
```sql
- id: UUID
- key: VARCHAR NOT NULL
- old_value: JSONB
- new_value: JSONB
- changed_by: UUID (FK → auth.users.id)
- changed_at: TIMESTAMP DEFAULT NOW()
- RLS: ENABLED (2 policies - admin only)
- INDEXES: 4 (key, changed_by, changed_at)
```

##### 18. **config_backups** - Backups de configuración
```sql
- id: UUID
- key: VARCHAR NOT NULL
- value: JSONB NOT NULL
- created_by: UUID (FK → auth.users.id)
- created_at: TIMESTAMP DEFAULT NOW()
- RLS: ENABLED (2 policies - admin only)
- INDEXES: 3 (key, created_at)
```

#### Views (6 views)

1. **available_products**: Productos con stock > 0
2. **today_appointments**: Turnos del día (excluyendo cancelados)
3. **whatsapp_appointments**: Turnos desde WhatsApp con detalles
4. **active_conversations_by_provider**: Stats por proveedor
5. **kommo_active_conversations**: Conversaciones activas con último mensaje
6. **kommo_conversation_stats**: Estadísticas por día/canal/status

#### ENUM Types (13 tipos)

1. **user_role**: admin, vendedor
2. **appointment_status**: pending, confirmed, completed, cancelled, no_show
3. **order_status**: pending, processing, shipped, delivered, cancelled, refunded
4. **payment_status**: pending, paid, failed, refunded, partially_paid
5. **payment_method**: cash, credit_card, debit_card, transfer, mercadopago, other
6. **order_source**: website, whatsapp, phone, walk_in, app, admin
7. **conversation_status**: active, resolved, archived, escalated
8. **conversation_state**: idle, waiting_user, processing, waiting_appointment, waiting_product_info, completed
9. **message_role**: user, assistant, system
10. **content_type**: text, image, video, audio, document, location, sticker
11. **channel_type**: whatsapp, telegram, instagram, facebook, email, sms
12. **service_type**: inspection, rotation, balancing, alignment
13. **service_voucher_status**: pending, active, redeemed, expired

#### Seguridad (RLS)

- ✅ **18/18 tablas** con RLS habilitado (100%)
- ✅ **41 policies** activas
- ✅ Políticas restrictivas por rol (admin, vendedor, public)

#### Performance

- ✅ **106 indexes** totales
- ✅ **pg_trgm** habilitado para búsqueda fuzzy
- ✅ Partial indexes para queries frecuentes
- ✅ GIN indexes para JSONB y arrays

---

## 🎯 Módulos Principales

### 1. E-commerce & Catálogo

**Ubicación**: `/src/features/products`, `/src/app/productos`

**Funcionalidades**:
- Catálogo de neumáticos con filtros avanzados
- Búsqueda por dimensiones (ancho, perfil, diámetro)
- Búsqueda fuzzy con pg_trgm
- Filtros por marca, categoría, precio
- Comparador de productos
- Sistema de equivalencias
- Carrito de compras con persistencia

**Componentes Clave**:
- `ProductGrid`: Grid de productos con infinite scroll
- `ProductCard`: Tarjeta de producto
- `ProductFilters`: Filtros dinámicos
- `ProductSearch`: Buscador con autocompletado
- `ProductComparison`: Comparador

**API Routes**:
- `GET /api/products`: Listado de productos
- `GET /api/products/[id]`: Detalle de producto
- `GET /api/products/search`: Búsqueda

### 2. Sistema de Turnos (Appointments)

**Ubicación**: `/src/features/appointments`, `/src/app/turnos`

**Funcionalidades**:
- Reserva de turnos online
- Calendario interactivo con disponibilidad
- Múltiples servicios (inspección, rotación, balanceo, alineación)
- Verificación de disponibilidad en tiempo real
- Confirmación por email
- Integración con WhatsApp
- Panel admin para gestión de turnos

**Componentes Clave**:
- `AppointmentCalendar`: Calendario de turnos
- `ServiceSelector`: Selector de servicios
- `TimeSlotPicker`: Selector de horarios
- `AppointmentForm`: Formulario de reserva
- `AppointmentConfirmation`: Confirmación

**Lógica de Negocio**:
- Máximo 2 turnos por slot de 30 minutos
- Verificación de disponibilidad con trigger SQL
- Estados: pending → confirmed → completed/cancelled/no_show
- Notificaciones automáticas

**API Routes**:
- `POST /api/appointments`: Crear turno
- `GET /api/appointments`: Listar turnos
- `PATCH /api/appointments/[id]`: Actualizar estado

### 3. Gestión de Pedidos (Orders)

**Ubicación**: `/src/features/orders`, `/src/app/admin/orders`

**Funcionalidades**:
- Gestión completa de pedidos
- Dashboard de pedidos con filtros
- Tracking de estado
- Historial de cambios
- Múltiples métodos de pago
- Integración con WhatsApp
- Generación de PDF de orden
- Sistema de reembolsos

**Estados del Pedido**:
```
pending → processing → shipped → delivered
         ↓
    cancelled / refunded
```

**Componentes Clave**:
- `OrderDashboard`: Dashboard principal
- `OrderTable`: Tabla de pedidos
- `OrderDetail`: Detalle de pedido
- `OrderStatusBadge`: Badge de estado
- `OrderHistory`: Historial de cambios

**API Routes**:
- `POST /api/orders`: Crear pedido
- `GET /api/orders`: Listar pedidos (admin)
- `PATCH /api/orders/[id]`: Actualizar pedido
- `GET /api/orders/[id]/pdf`: Generar PDF

### 4. Carrito de Compras

**Ubicación**: `/src/features/cart`, `/src/app/carrito`

**Funcionalidades**:
- Persistencia en localStorage
- Actualización en tiempo real
- Validación de stock
- Cálculo de totales
- Aplicación de cupones
- Mini cart en header

**Hooks Principales**:
- `useCart`: Gestión del carrito
- `useCartValidation`: Validación de stock
- `useCartPersistence`: Persistencia

**Componentes Clave**:
- `CartProvider`: Context provider
- `CartDrawer`: Drawer del carrito
- `CartItem`: Item del carrito
- `CartSummary`: Resumen de totales

### 5. Sistema de IA & Chat

**Ubicación**: `/src/lib/ai`, `/src/app/admin/chats`

**Funcionalidades IA**:
- Chat admin con Claude (Anthropic)
- Bot WhatsApp con GPT-4o-mini
- Function calling (7 funciones)
- Context-aware responses
- Conversational memory
- Intent detection
- Sentiment analysis

**Function Calling Tools (WhatsApp)**:
1. `book_appointment`: Reservar turnos
2. `confirm_appointment`: Confirmar turno
3. `check_stock`: Consultar stock
4. `cancel_operation`: Cancelar flujo
5. `go_back`: Retroceder paso
6. `show_help`: Mostrar ayuda
7. `request_human`: Pedir humano

**Prompts System**:
- System prompts configurables desde DB
- Prompts especializados:
  - `system`: Base prompt
  - `product`: Consultas de productos
  - `sales`: Asistencia de ventas
  - `technical`: Consultas técnicas
  - `faq`: Preguntas frecuentes

**Componentes Admin Chat**:
- `AIConfigPanel`: Panel de configuración IA
- `ChatInbox`: Inbox de conversaciones
- `ConversationView`: Vista de conversación
- `MessageList`: Lista de mensajes

**API Routes**:
- `POST /api/ai/chat`: Chat endpoint
- `GET /api/admin/settings/ai/*`: Configuración IA

### 6. WhatsApp Business Integration

**Ubicación**: `/src/lib/whatsapp`, `/src/app/api/twilio`

**Funcionalidades**:
- Webhook de Twilio para WhatsApp
- Procesamiento de mensajes
- AI-powered responses
- Conversational flows:
  - Consulta de productos
  - Reserva de turnos
  - Información de servicios
  - Ubicación de sucursales
- Estados de conversación
- Escalamiento a humano

**Message Handlers**:
- `handleIncomingMessage`: Procesar mensaje entrante
- `processUserIntent`: Detectar intención
- `generateAIResponse`: Generar respuesta con IA
- `handleFunctionCall`: Ejecutar function calling

**Conversational State Machine**:
```
idle → waiting_user → processing → waiting_appointment
                                 → waiting_product_info
                                 → completed
```

**API Routes**:
- `POST /api/twilio/webhook`: Webhook de Twilio

### 7. Gestión de Inventario

**Ubicación**: `/src/app/admin/stock`

**Funcionalidades**:
- Stock multi-sucursal
- Alertas de stock mínimo
- Transferencias entre sucursales
- Historial de movimientos
- Actualización masiva
- Exportación a Excel

**Componentes Clave**:
- `StockDashboard`: Dashboard de stock
- `StockTable`: Tabla de inventario
- `StockEditor`: Editor de stock
- `StockTransfer`: Transferencias

**API Routes**:
- `GET /api/admin/stock`: Listar stock
- `PUT /api/update-stock`: Actualizar stock

### 8. Panel Administrativo

**Ubicación**: `/src/app/admin`, `/src/features/admin`

**Funcionalidades**:
- Dashboard con métricas
- CRUD de productos
- Gestión de pedidos
- Gestión de turnos
- Gestión de usuarios
- Configuración del sistema
- Inbox de chats
- Reportes y estadísticas

**Roles y Permisos**:
- **admin**: Acceso total
- **vendedor**: Acceso limitado (no usuarios, no config)

**Componentes Layout**:
- `AdminLayout`: Layout principal
- `AdminSidebar`: Sidebar con navegación
- `AdminHeader`: Header con user menu

### 9. Sistema de Automatizaciones

**Ubicación**: `/src/features/automations`

**Funcionalidades**:
- Automatizaciones configurables
- Triggers basados en eventos
- Acciones personalizables
- Editor visual de flujos
- Logs de ejecución

**Triggers Soportados**:
- Order created
- Appointment confirmed
- Stock low
- Customer inactive

**Acciones Soportadas**:
- Send email
- Send WhatsApp
- Update status
- Create task

---

## 🔌 Integraciones Externas

### 1. Supabase

**Uso**: Database + Auth + Storage

**Servicios Utilizados**:
- **PostgreSQL**: Base de datos principal
- **Authentication**: Sistema de autenticación
- **Storage**: Almacenamiento de imágenes
- **Realtime**: Subscripciones en tiempo real (no actualmente usado)

**Configuración**:
```typescript
// src/lib/db/supabase.ts
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 2. Twilio (WhatsApp Business)

**Uso**: Mensajería WhatsApp

**Funcionalidades**:
- Recepción de mensajes (webhook)
- Envío de mensajes
- Multimedia (imágenes, documentos)
- Estados de entrega

**Configuración**:
```typescript
// src/lib/twilio/client.ts
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
```

**Webhook**: `POST /api/twilio/webhook`

### 3. OpenAI

**Uso**: Chat AI para WhatsApp

**Modelos**:
- **GPT-4o-mini**: Chat principal (rápido y económico)
- **GPT-3.5-turbo**: Fallback

**Funcionalidades**:
- Chat completions
- Function calling (7 funciones)
- Streaming responses (no usado actualmente)

**Configuración**:
```typescript
// src/lib/ai/openai.ts
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### 4. Anthropic (Claude)

**Uso**: Chat admin panel

**Modelo**: Claude Sonnet 4.5

**Funcionalidades**:
- Asistente admin
- Análisis de datos
- Generación de reportes

### 5. Resend

**Uso**: Envío de emails transaccionales

**Emails**:
- Confirmación de turnos
- Confirmación de pedidos
- Recuperación de contraseña
- Notificaciones admin

**Templates**: React Email

### 6. Vercel (Hosting)

**Uso**: Deployment y hosting

**Features Utilizadas**:
- Edge Network
- Serverless Functions
- Analytics
- Image Optimization

---

## 📊 Flujos de Negocio

### Flujo 1: Compra de Neumáticos

```
1. Cliente navega catálogo
   ↓
2. Aplica filtros (marca, tamaño, precio)
   ↓
3. Agrega productos al carrito
   ↓
4. Revisa carrito
   ↓
5. Aplica cupón (opcional)
   ↓
6. Checkout → Completa datos
   ↓
7. Selecciona método de pago
   ↓
8. Confirma pedido
   ↓
9. Email de confirmación
   ↓
10. Admin procesa pedido
    ↓
11. Actualiza estado (processing → shipped → delivered)
```

**Validaciones**:
- Stock disponible
- Cupón válido
- Datos de cliente completos
- Método de pago válido

### Flujo 2: Reserva de Turno (Web)

```
1. Cliente selecciona servicio
   ↓
2. Selecciona fecha
   ↓
3. Sistema muestra slots disponibles
   ↓
4. Cliente selecciona horario
   ↓
5. Completa datos (nombre, teléfono, vehículo)
   ↓
6. Confirma reserva
   ↓
7. Trigger SQL verifica disponibilidad
   ↓
8. Crea appointment (status: pending)
   ↓
9. Email de confirmación
   ↓
10. Admin confirma (status: confirmed)
    ↓
11. Cliente recibe confirmación
```

**Lógica de Slots**:
- Slots de 30 minutos
- Máximo 2 turnos por slot
- Verificación en tiempo real
- Horarios: Lun-Vie 9:00-18:00, Sáb 9:00-13:00

### Flujo 3: Conversación WhatsApp con Bot

```
1. Cliente envía mensaje WhatsApp
   ↓
2. Twilio recibe mensaje → Webhook
   ↓
3. Sistema crea/actualiza conversación
   ↓
4. Detecta intención con IA
   ↓
5. Determina si requiere function calling
   ↓ YES
6. Ejecuta función (book_appointment, check_stock, etc.)
   ↓
7. Genera respuesta contextual
   ↓
8. Envía respuesta por WhatsApp
   ↓
9. Actualiza estado de conversación
   ↓
10. Si requiere escalamiento → marca para humano
```

**Intenciones Detectadas**:
- greeting: Saludo
- product_inquiry: Consulta de productos
- price_inquiry: Consulta de precios
- availability_inquiry: Consulta de stock
- appointment: Reserva de turno
- faq: Preguntas frecuentes
- escalation: Requiere humano

### Flujo 4: Gestión de Pedido (Admin)

```
1. Admin recibe notificación de pedido
   ↓
2. Revisa detalles del pedido
   ↓
3. Verifica stock disponible
   ↓
4. Actualiza estado a "processing"
   ↓ [Trigger SQL registra cambio en order_history]
   ↓
5. Prepara productos
   ↓
6. Actualiza estado a "shipped"
   ↓
7. Cliente recibe notificación
   ↓
8. Entrega productos
   ↓
9. Actualiza estado a "delivered"
   ↓
10. Sistema actualiza stock
```

**Auditoría**:
- Todos los cambios de estado se registran en `order_history`
- Triggers automáticos para logging
- Timestamps de cada cambio

---

## 🔒 Seguridad

### Autenticación

**NextAuth 5.0 + Supabase Auth**:
- JWT tokens
- Session management
- Secure cookies
- CSRF protection

**Flujo de Login**:
```
1. Usuario ingresa credenciales
   ↓
2. NextAuth valida con Supabase
   ↓
3. Supabase retorna JWT
   ↓
4. NextAuth crea sesión
   ↓
5. Cookie segura con httpOnly
```

### Autorización

**Row Level Security (RLS)**:
- 18/18 tablas con RLS habilitado
- 41 policies activas
- Políticas por rol (admin, vendedor, public)

**Ejemplos de Policies**:
```sql
-- Users can read own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Only staff can view orders
CREATE POLICY "Staff can view all orders"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'vendedor')
  )
);
```

### Headers de Seguridad

**next.config.ts**:
```typescript
headers: [
  'X-XSS-Protection: 1; mode=block',
  'X-Frame-Options: SAMEORIGIN',
  'X-Content-Type-Options: nosniff',
  'Referrer-Policy: origin-when-cross-origin',
  'Permissions-Policy: camera=(), microphone=(), geolocation=()'
]
```

### Validación de Datos

**Zod Schemas**:
- Validación en backend
- Type-safe
- Error messages claros

**Ejemplo**:
```typescript
const orderSchema = z.object({
  customer_name: z.string().min(2),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().min(10),
  items: z.array(orderItemSchema).min(1),
  total_amount: z.number().positive(),
});
```

### Sanitización

- HTML escaping automático (React)
- SQL injection prevention (Supabase parameterized queries)
- XSS prevention (CSP headers)

### Rate Limiting

**Implementado en API Routes**:
- Límite por IP
- Límite por usuario
- Throttling en webhooks

### Secrets Management

**Variables de Entorno**:
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= # Server-side only
DATABASE_URL=
OPENAI_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
RESEND_API_KEY=
NEXTAUTH_SECRET=
```

---

## ⚡ Performance

### Optimizaciones Next.js

1. **Static Site Generation (SSG)**:
   - Homepage
   - Páginas de productos estáticas
   - Páginas de servicios

2. **Incremental Static Regeneration (ISR)**:
   - Catálogo de productos (revalidate: 3600)
   - Páginas de detalles de productos

3. **React Server Components**:
   - Componentes por defecto
   - Fetch de datos en servidor
   - Reducción de JS bundle

4. **Code Splitting**:
   - Dynamic imports
   - Route-based splitting
   - Component-level splitting

5. **Image Optimization**:
   - Next.js Image component
   - AVIF + WebP formats
   - Lazy loading
   - Blur placeholders

### Optimizaciones de Base de Datos

1. **Indexes**: 106 indexes totales
2. **Partial Indexes**: Para queries frecuentes
3. **GIN Indexes**: Para JSONB y búsqueda full-text
4. **pg_trgm**: Búsqueda fuzzy
5. **Connection Pooling**: Supabase pooler

### Caching Estratégico

1. **Browser Cache**:
   - Static assets: 1 año
   - Images: 30 días
   - API responses: varía por endpoint

2. **CDN Cache** (Vercel Edge):
   - Static pages: cache indefinido
   - ISR pages: cache con revalidación
   - API routes: cache selectivo

3. **Application Cache**:
   - AI config cache (TTL: 30s-10min)
   - Product catalog cache

### Bundle Optimization

**Current Bundles**:
- First Load JS: ~150KB
- Route chunks: 20-50KB cada uno

**Optimizaciones**:
- Tree shaking
- Remove console.logs in production
- Minification
- Compression (gzip + brotli)

### Lighthouse Scores (Target)

- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >95

---

## 🧪 Testing

### Test Stack

- **Unit Tests**: Vitest 4.0.14
- **E2E Tests**: Playwright 1.56
- **Component Tests**: @testing-library/react 16.3

### Test Scripts

```bash
npm run test           # Run all tests
npm run test:run       # Run once
npm run test:watch     # Watch mode
npm run test:ui        # Vitest UI
npm run test:coverage  # Coverage report
npm run test:e2e       # Playwright E2E
```

### Testing Strategy

1. **Unit Tests**: Business logic en `/src/lib`
2. **Component Tests**: Componentes UI críticos
3. **Integration Tests**: API routes
4. **E2E Tests**: Flujos completos de usuario

### Coverage Goals

- Unit tests: >80%
- Integration tests: >70%
- E2E tests: Critical paths

---

## 🚀 Deployment

### Hosting: Vercel

**Features**:
- Automatic deployments (main branch)
- Preview deployments (PR)
- Edge Network
- Serverless Functions
- Analytics

### Environment Variables

**Production**:
- Todas las variables en Vercel Dashboard
- Secrets encrypted
- No commit de .env

### Build Process

```bash
1. npm run build        # Next.js build
2. Type checking        # tsc --noEmit
3. Linting (optional)   # eslint
4. Tests (opcional)     # vitest run
5. Deploy to Vercel
```

### Monitoring

- Vercel Analytics
- Supabase Metrics
- Error tracking (considerar Sentry)

---

## 📈 Roadmap & Próximas Features

### En Desarrollo
- [ ] Panel de configuración IA (80% completo)
- [ ] Migración completa a ENUM types
- [ ] Sistema de reseñas de productos

### Planificado Q1 2026
- [ ] App móvil (React Native)
- [ ] Sistema de fidelización
- [ ] Programa de referidos
- [ ] Chat en vivo (admin)

### Planificado Q2 2026
- [ ] Integración con MercadoPago
- [ ] Sistema de envíos
- [ ] Tracking en tiempo real
- [ ] Notificaciones push

---

## 📚 Documentación Adicional

- `DATABASE_AUDIT_REPORT.md`: Auditoría completa de BD
- `DATABASE_MIGRATION_SUMMARY.md`: Resumen de migraciones
- `README.md`: Guía de inicio rápido
- `/docs`: Documentación técnica adicional

---

## 🤝 Contribución

### Estándares de Código

- **TypeScript**: Strict mode
- **ESLint**: Configuración custom
- **Prettier**: Formateo automático
- **Naming**: camelCase para funciones, PascalCase para componentes

### Git Workflow

1. Feature branch desde `main`
2. Commits semánticos
3. PR con descripción detallada
4. Code review requerido
5. Merge a `main`

### Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

---

## 📞 Soporte

**Equipo de Desarrollo**:
- Full-stack development
- Database management
- AI/ML integration
- DevOps & deployment

**Contacto**:
- Email: dev@neumaticos-del-valle.com (ficticio)
- Slack: #neumaticos-dev
- Jira: NDV Project Board

---

**Última Actualización**: 2026-01-21
**Versión del Documento**: 1.0.0
