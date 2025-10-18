# FASE 4: Sistema de Turnos - Neumáticos del Valle

## 📅 Resumen

Sistema completo de reserva de turnos online integrado con el sistema de vouchers existente. Permite a los clientes agendar servicios en diferentes sucursales con selección de fecha y hora.

## ✨ Características Implementadas

### Cliente
- **Selección de Sucursal**: Visualización de múltiples sucursales con información completa
- **Catálogo de Servicios**: 5 tipos de servicios con precios y duración
- **Calendario Inteligente**: Selección de fecha y hora con disponibilidad en tiempo real
- **Integración con Vouchers**: Redención automática de vouchers para servicios elegibles
- **Formulario de Contacto**: Captura de datos del cliente y vehículo
- **Confirmación Inmediata**: Pantalla de éxito con opciones para agregar al calendario

### Administración
- **Panel de Gestión**: Vista completa de todos los turnos
- **Filtros Avanzados**: Por estado, fecha y sucursal
- **Gestión de Estados**: Pendiente → Confirmado → Completado
- **Estadísticas Rápidas**: Turnos del día, pendientes, tasa de completados

## 🛠 Arquitectura

### Estructura de Archivos
```
/src/features/appointments/
├── api.ts                    # Llamadas a Supabase
├── types.ts                  # TypeScript interfaces
├── hooks/
│   └── useAppointment.ts     # Hook principal con lógica
└── components/
    ├── AppointmentWizard.tsx # Wizard principal
    ├── BranchSelector.tsx    # Selector de sucursales
    ├── ServiceSelector.tsx   # Selector de servicios
    ├── DateTimeSelector.tsx  # Calendario y horarios
    ├── ContactForm.tsx       # Formulario de datos
    ├── AppointmentSummary.tsx# Resumen del turno
    ├── AppointmentSuccess.tsx# Pantalla de éxito
    └── AppointmentList.tsx   # Lista admin
```

### Base de Datos

#### Tabla: stores (sucursales)
- `id`: UUID
- `name`: Nombre de la sucursal
- `address`: Dirección
- `phone`: Teléfono
- `opening_hours`: Horarios (JSONB)
- `is_main`: Sucursal principal
- `active`: Estado activo

#### Tabla: appointments (turnos)
- `id`: UUID
- `customer_*`: Datos del cliente
- `vehicle_*`: Datos del vehículo
- `service_type`: Tipo de servicio
- `preferred_date/time`: Fecha y hora
- `store_id`: Sucursal
- `status`: Estado del turno
- `voucher_id`: Voucher aplicado (opcional)

## 🚀 Instalación y Configuración

### 1. Configurar Base de Datos

Ejecuta el script SQL en Supabase:
```sql
-- Archivo: scripts/create-stores-table.sql
-- Crea las tablas y datos iniciales
```

### 2. Variables de Entorno

Asegúrate de tener en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

### 3. Iniciar Desarrollo

```bash
npm install
npm run dev
```

## 📱 Rutas Disponibles

- `/` - Página principal con accesos directos
- `/appointments` - Wizard de reserva de turnos
- `/admin/appointments` - Panel de administración
- `/quotation` - Sistema de cotización (FASE 1)
- `/vouchers` - Sistema de vouchers (FASE 3)

## 🎯 Servicios Disponibles

1. **Alineación y Balanceo** - 60 min - $45k
2. **Cambio de Aceite** - 30 min - $35k
3. **Rotación de Neumáticos** - 45 min - $25k
4. **Inspección General** - 30 min - GRATIS con voucher
5. **Montaje de Neumáticos** - 45 min - $20k

## 💡 Características Técnicas

### Mobile-First Design
- Interfaz totalmente responsiva
- Optimizada para dispositivos móviles
- Touch-friendly en todos los controles

### Performance
- SessionStorage para persistencia temporal
- Carga lazy de componentes
- Validación en tiempo real
- Sin librerías pesadas de calendario

### UX/UI
- Wizard paso a paso con progreso visual
- Validación inline de formularios
- Mensajes de error claros
- Confirmación visual de selecciones

### Integración con Vouchers
- Validación automática de códigos
- Pre-llenado de datos del cliente
- Servicios gratuitos con voucher
- Redención automática al confirmar

## 🔄 Flujo del Usuario

1. **Selección de Sucursal** → Elige entre 3 sucursales
2. **Selección de Servicio** → 5 tipos de servicios
3. **Fecha y Hora** → Calendario con slots disponibles
4. **Datos de Contacto** → Información personal y vehículo
5. **Resumen** → Revisión completa antes de confirmar
6. **Confirmación** → Éxito con opciones de calendario

## 📊 Panel de Administración

### Funcionalidades
- Vista de todos los turnos
- Filtros por estado y fecha
- Cambio rápido de estados
- Estadísticas en tiempo real

### Estados de Turnos
- 🟡 **Pendiente**: Esperando confirmación
- 🔵 **Confirmado**: Turno confirmado
- 🟢 **Completado**: Servicio realizado
- 🔴 **Cancelado**: Turno cancelado

## 🎨 Diseño y Estilo

- **Colores**: Negro, rojo (#DC2626), grises
- **Tipografía**: System fonts para performance
- **Iconos**: Lucide React (lightweight)
- **Animaciones**: CSS nativo y Tailwind
- **Layout**: Grid responsivo con Tailwind

## 📈 Mejoras Futuras

- [ ] Notificaciones por email/SMS
- [ ] Recordatorios automáticos 24h antes
- [ ] Calendario de técnicos
- [ ] Integración con Google Calendar
- [ ] Sistema de calificación post-servicio
- [ ] Dashboard con métricas avanzadas
- [ ] Gestión de capacidad por sucursal
- [ ] Historial de servicios por cliente

## 🤝 Integración con Otras Fases

- **FASE 1**: Sistema de cotización
- **FASE 2**: Catálogo de productos
- **FASE 3**: Sistema de vouchers (integrado)
- **FASE 5**: Reviews y testimonios (próximo)

## 🔒 Seguridad

- Validación de datos en frontend y backend
- Sanitización de inputs
- Protección contra duplicados
- Límite de turnos por slot de tiempo

## 📝 Notas de Implementación

- Sistema ultra-simple sin dependencias complejas
- SessionStorage para datos temporales
- HTML5 date/time inputs nativos
- Sin bibliotecas de calendario externas
- Queries directas a Supabase
- Componentes funcionales con hooks

---

**Desarrollado para Neumáticos del Valle** | FASE 4 Completada ✅