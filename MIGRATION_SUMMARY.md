# 🚀 Migration Summary - Phase 2: Hardcoded Data to Database

## ✅ Completado (Phase 2.1)

### 1. Migraciones SQL Creadas
📁 Ubicación: `supabase/migrations/`

#### A. `20250128_create_appointment_services.sql`
- Tabla: `appointment_services`
- Registros insertados: **8 servicios de turnos**
- Campos: id, name, description, duration, price, requires_vehicle, icon

#### B. `20250128_create_quotation_services.sql`
- Tabla: `quotation_services`
- Registros insertados: **3 servicios de cotización**
- Campos: id, name, description, price, price_type, icon

#### C. `20250128_create_vehicle_tables.sql`
- Tabla: `vehicle_brands` - **7 marcas**
- Tabla: `vehicle_models` - **42 modelos** distribuidos en 7 marcas
- Relación: vehicle_models.brand_id → vehicle_brands.id (CASCADE)

### 2. Funciones API Creadas

#### A. Appointments API (`src/features/appointments/api.ts`)
```typescript
✅ getAppointmentServices() - Obtiene servicios desde BD
```

#### B. Quotation API (`src/features/quotation/api.ts`)
```typescript
✅ getQuotationServices() - Obtiene servicios de cotización
✅ getVehicleBrands() - Obtiene marcas de vehículos
✅ getVehicleModelsByBrand(brandName) - Obtiene modelos por marca
✅ getAllVehicleModels() - Obtiene todos los modelos agrupados por marca
```

**Características**:
- Consultas optimizadas con índices
- Manejo de errores con fallback a datos hardcoded
- Tipos TypeScript correctos
- Mapeo automático de snake_case → camelCase

## 📋 Pendiente - Siguiente Paso

### 🎯 Paso Actual: Ejecutar Migraciones en Supabase

**Opción 1: Supabase Dashboard** (Recomendado)
1. Ir a: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Crear nueva query
3. Copiar y pegar contenido de cada archivo SQL (en orden):
   - `20250128_create_appointment_services.sql`
   - `20250128_create_quotation_services.sql`
   - `20250128_create_vehicle_tables.sql`
4. Ejecutar cada query con el botón "Run"
5. Verificar en "Table Editor" que las tablas tienen datos

**Verificación**:
```sql
-- Verificar datos insertados
SELECT COUNT(*) FROM appointment_services; -- Debe ser 8
SELECT COUNT(*) FROM quotation_services;   -- Debe ser 3
SELECT COUNT(*) FROM vehicle_brands;       -- Debe ser 7
SELECT COUNT(*) FROM vehicle_models;       -- Debe ser 42
```

### Luego: Actualizar Componentes

#### A. QuotationWizard (`src/features/quotation/components/QuotationWizard.tsx`)
**Cambiar**:
```typescript
// ❌ ANTES
import { availableServices, vehicleBrands, vehicleModels } from '../api'

// ✅ DESPUÉS
import { getQuotationServices, getVehicleBrands, getAllVehicleModels } from '../api'

// En el componente, usar useEffect para cargar:
useEffect(() => {
  const loadData = async () => {
    const services = await getQuotationServices()
    const brands = await getVehicleBrands()
    const models = await getAllVehicleModels()
    // actualizar estado
  }
  loadData()
}, [])
```

#### B. Appointment Components
Similar al anterior, reemplazar imports y usar las funciones async.

## 📊 Impacto

### Datos Migrados
| Categoría | Antes (Hardcoded) | Después (Database) |
|-----------|-------------------|-------------------|
| Servicios de Turnos | 8 en types.ts | 8 en appointment_services |
| Servicios de Cotización | 3 en api.ts | 3 en quotation_services |
| Marcas de Vehículos | 7 en api.ts | 7 en vehicle_brands |
| Modelos de Vehículos | 42 en api.ts | 42 en vehicle_models |
| **TOTAL** | **60 registros** | **60 registros** |

### Beneficios
✅ **Flexibilidad**: Actualizar precios/servicios sin deployment
✅ **Escalabilidad**: Agregar nuevas marcas/modelos fácilmente
✅ **Mantenibilidad**: Datos centralizados en un solo lugar
✅ **Resiliencia**: Fallback automático a datos hardcoded si falla DB
✅ **Auditoría**: Campos created_at/updated_at en todas las tablas

### Datos Hardcoded Restantes
❌ **ELIMINAR DESPUÉS**: `tireModels` en quotation/api.ts (líneas 27-112)
   - Son 6 neumáticos MOCK - la data real está en tabla `products`
   - No migrar, simplemente eliminar cuando se verifique que no se usan

⚠️ **MANTENER**: Datos hardcoded como fallback hasta confirmar que BD funciona

## 🔍 Archivos Modificados

### Creados
```
✨ supabase/migrations/20250128_create_appointment_services.sql
✨ supabase/migrations/20250128_create_quotation_services.sql
✨ supabase/migrations/20250128_create_vehicle_tables.sql
✨ supabase/run-migrations.md
✨ MIGRATION_SUMMARY.md
```

### Modificados
```
📝 src/features/appointments/api.ts (+27 líneas)
📝 src/features/quotation/api.ts (+106 líneas)
```

## 🎯 Próximos Pasos (Orden de Ejecución)

1. ✅ **[COMPLETADO]** Crear migraciones SQL
2. ✅ **[COMPLETADO]** Crear funciones API para BD
3. 🔄 **[EN PROGRESO]** Ejecutar migraciones en Supabase Dashboard
4. ⏳ **[PENDIENTE]** Actualizar QuotationWizard para usar nueva API
5. ⏳ **[PENDIENTE]** Actualizar componentes de appointments
6. ⏳ **[PENDIENTE]** Testing completo de flujos
7. ⏳ **[PENDIENTE]** Eliminar datos mock (tireModels)
8. ⏳ **[PENDIENTE]** Remover hardcoded data una vez validado 100%

## 📝 Notas Técnicas

### Estrategia de Fallback
Todas las funciones API tienen fallback automático:
```typescript
catch (error) {
  console.error('Error fetching from DB:', error)
  return hardcodedData // Fallback
}
```

### Mapeo de Datos
- **Database**: snake_case (price_type, brand_id)
- **TypeScript**: camelCase (priceType, brandId)
- Mapeo automático en funciones API

### Índices Creados
```sql
✅ idx_appointment_services_name
✅ idx_quotation_services_name
✅ idx_vehicle_brands_name
✅ idx_vehicle_models_brand_id
✅ idx_vehicle_models_name
```

### Triggers Creados
```sql
✅ update_updated_at_column() - Función reutilizable
✅ Triggers en todas las tablas para actualizar updated_at
```

---

**Estado**: 🟢 Migraciones listas para ejecutar
**Siguiente Acción**: Ejecutar migraciones en Supabase Dashboard
**Tiempo Estimado**: 5-10 minutos para ejecutar + 1-2 horas actualizar componentes
