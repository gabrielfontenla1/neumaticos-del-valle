# 🔧 FIX MANUAL REQUERIDO - Schema de Servicios

## ⚠️ ACCIÓN INMEDIATA REQUERIDA

El QA reveló que faltan columnas en la tabla `appointment_services`.
Necesitas ejecutar el siguiente SQL manualmente en Supabase.

---

## 📋 PASOS PARA EJECUTAR

1. Ve a **Supabase Dashboard** → https://supabase.com/dashboard
2. Selecciona tu proyecto: **Neumáticos del Valle**
3. Click en **SQL Editor** (menú lateral izquierdo)
4. Click en **New Query**
5. Copia y pega el siguiente SQL:

---

## 💾 SQL A EJECUTAR

```sql
-- ============================================================================
-- FIX: appointment_services schema
-- Agregar columnas faltantes: requires_vehicle, icon
-- Permitir servicios gratuitos: price >= 0
-- ============================================================================

-- Paso 1: Agregar columnas faltantes
ALTER TABLE appointment_services
ADD COLUMN IF NOT EXISTS requires_vehicle BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Paso 2: Actualizar servicios existentes con valores por defecto
UPDATE appointment_services
SET requires_vehicle = CASE
  WHEN id IN ('inspection', 'tire-change', 'alignment', 'balancing', 'rotation', 'front-end', 'tire-repair', 'installation') THEN true
  WHEN id IN ('consultation', 'quote', 'pressure-check') THEN false
  ELSE false
END
WHERE requires_vehicle IS NULL;

-- Paso 3: Eliminar constraint de precio antiguo (si existe)
DO $$
BEGIN
    ALTER TABLE appointment_services
    DROP CONSTRAINT IF EXISTS appointment_services_price_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Paso 4: Agregar nuevo constraint que permite precio = 0
ALTER TABLE appointment_services
ADD CONSTRAINT appointment_services_price_check CHECK (price >= 0);

-- Paso 5: Agregar comentarios para documentación
COMMENT ON COLUMN appointment_services.requires_vehicle
IS 'Whether this service requires vehicle information';

COMMENT ON COLUMN appointment_services.icon
IS 'Lucide icon name for UI display';

COMMENT ON CONSTRAINT appointment_services_price_check ON appointment_services
IS 'Allows free services (price >= 0)';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar columnas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'appointment_services'
ORDER BY ordinal_position;

-- Verificar constraints
SELECT conname as constraint_name,
       pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'appointment_services'::regclass;

-- Verificar datos
SELECT id, name, price, requires_vehicle, icon
FROM appointment_services
ORDER BY name;
```

---

## ✅ VERIFICACIÓN POST-EJECUCIÓN

Después de ejecutar el SQL, deberías ver:

### Columnas Actualizadas:
```
column_name         | data_type | is_nullable | column_default
--------------------|-----------|-------------|---------------
id                  | text      | NO          |
name                | text      | NO          |
description         | text      | NO          |
duration            | integer   | NO          |
price               | numeric   | NO          |
requires_vehicle    | boolean   | YES         | false
icon                | text      | YES         | NULL
created_at          | timestamp | YES         | now()
updated_at          | timestamp | YES         | now()
```

### Constraints Actualizados:
```
appointment_services_price_check | CHECK (price >= 0)
```

### Datos Actualizados:
Todos los servicios deberían tener:
- `requires_vehicle` = true o false (no NULL)
- `icon` = NULL (por ahora, se puede agregar después)
- `price` >= 0 (permitiendo servicios gratuitos)

---

## 🧪 RE-EJECUTAR QA

Una vez aplicado el fix, ejecuta:

```bash
npx tsx tests/services-qa.test.ts
```

**Resultado Esperado**: 9-10/10 tests passing

---

## 📊 TESTS QUE SE ARREGLARÁN

Después de aplicar este fix:

- ✅ **Test #1**: Database Schema Integrity (actualmente FAIL → PASS)
- ✅ **Test #3**: API POST - Create Service (actualmente FAIL → PASS)
- ✅ **Test #5**: API PUT - Update Service (actualmente FAIL → PASS)
- ✅ **Test #7**: Price Validation (actualmente FAIL → PASS)
- ✅ **Test #10**: End-to-End Integration (actualmente FAIL → PASS)

**Nueva Tasa de Éxito**: 90-100% (9-10/10)

---

## ⚡ ALTERNATIVA RÁPIDA (Si prefieres)

Si no quieres usar el SQL Editor de Supabase, puedes:

1. Instalar PostgreSQL CLI tools:
```bash
brew install postgresql
```

2. Ejecutar la migración directamente:
```bash
PGPASSWORD="tu-password" psql "postgresql://postgres.oyiwyzmaxgnzyhmmkstr:xesti0-sejgyb-Kepvym@aws-1-us-east-2.pooler.supabase.com:6543/postgres" -f supabase/migrations/20250121_fix_appointment_services_schema.sql
```

---

## 🆘 SOPORTE

Si tienes problemas ejecutando el SQL:
1. Verifica que tengas permisos de admin en Supabase
2. Verifica que la tabla `appointment_services` existe
3. Contacta soporte de Supabase si el error persiste

---

**Archivo de migración guardado en**:
`supabase/migrations/20250121_fix_appointment_services_schema.sql`
