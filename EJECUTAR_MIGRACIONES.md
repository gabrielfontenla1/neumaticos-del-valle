# 🚀 Ejecutar Migraciones de Base de Datos

## Instrucciones Simples - 5 minutos

### 1️⃣ Abrir SQL Editor de Supabase

**Opción A: Clic directo**
```
https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/sql/new
```

**Opción B: Manual**
1. Ve a https://supabase.com/dashboard
2. Selecciona "Neumáticos del Valle"
3. Click en "SQL Editor" (menú izquierdo)
4. Click en "New Query"

---

### 2️⃣ Ejecutar Migración 1: Servicios de Turnos

**Copiar y pegar este SQL completo:**

```sql
-- Create appointment_services table
CREATE TABLE IF NOT EXISTS appointment_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  requires_vehicle BOOLEAN DEFAULT false,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_services_name ON appointment_services(name);

INSERT INTO appointment_services (id, name, description, duration, price, requires_vehicle, icon) VALUES
  ('inspection', 'Revisión', 'Revisión completa de neumáticos', 30, 0.00, true, 'Search'),
  ('tire-change', 'Cambio de Neumáticos', 'Cambio de 2 o 4 neumáticos', 60, 40000.00, true, 'Wrench'),
  ('alignment', 'Alineación y Balanceo', 'Alineación computarizada y balanceo', 45, 30000.00, true, 'Settings'),
  ('rotation', 'Rotación de Neumáticos', 'Rotación para desgaste uniforme', 30, 20000.00, true, 'RefreshCw'),
  ('pressure-check', 'Control de Presión', 'Verificación y ajuste de presión', 15, 0.00, true, 'Gauge'),
  ('consultation', 'Asesoramiento', 'Consulta sobre neumáticos', 20, 0.00, false, 'MessageCircle'),
  ('quote', 'Cotización Personalizada', 'Presupuesto detallado', 15, 0.00, false, 'FileText'),
  ('installation', 'Instalación y Montaje', 'Montaje profesional de neumáticos', 45, 35000.00, true, 'Wrench')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointment_services_updated_at BEFORE UPDATE
  ON appointment_services FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Hacer click en "Run" o presionar Ctrl+Enter**

✅ Deberías ver: "Success. No rows returned"

---

### 3️⃣ Ejecutar Migración 2: Servicios de Cotización

**Copiar y pegar este SQL:**

```sql
-- Create quotation_services table
CREATE TABLE IF NOT EXISTS quotation_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('per-tire', 'flat')),
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_services_name ON quotation_services(name);

INSERT INTO quotation_services (id, name, description, price, price_type, icon) VALUES
  ('installation', 'Instalación Profesional', 'Incluye montaje, balanceo y válvulas nuevas', 2500.00, 'per-tire', '🔧'),
  ('alignment', 'Alineación Computarizada', 'Alineación de precisión con tecnología láser', 8000.00, 'flat', '⚙️'),
  ('delivery', 'Envío a Domicilio', 'Entrega e instalación en tu domicilio', 3500.00, 'flat', '🚚')
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER update_quotation_services_updated_at BEFORE UPDATE
  ON quotation_services FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Hacer click en "Run"**

✅ Deberías ver: "Success. No rows returned"

---

### 4️⃣ Ejecutar Migración 3: Vehículos (Marcas y Modelos)

**Copiar y pegar este SQL:**

```sql
-- Create vehicle_brands table
CREATE TABLE IF NOT EXISTS vehicle_brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_brands_name ON vehicle_brands(name);

INSERT INTO vehicle_brands (id, name) VALUES
  ('volkswagen', 'Volkswagen'),
  ('ford', 'Ford'),
  ('chevrolet', 'Chevrolet'),
  ('toyota', 'Toyota'),
  ('renault', 'Renault'),
  ('peugeot', 'Peugeot'),
  ('fiat', 'Fiat')
ON CONFLICT (id) DO NOTHING;

-- Create vehicle_models table
CREATE TABLE IF NOT EXISTS vehicle_models (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES vehicle_brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_models_brand_id ON vehicle_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_models_name ON vehicle_models(name);

INSERT INTO vehicle_models (id, brand_id, name) VALUES
  ('vw-golf', 'volkswagen', 'Golf'),
  ('vw-polo', 'volkswagen', 'Polo'),
  ('vw-tiguan', 'volkswagen', 'Tiguan'),
  ('vw-suran', 'volkswagen', 'Suran'),
  ('vw-amarok', 'volkswagen', 'Amarok'),
  ('vw-saveiro', 'volkswagen', 'Saveiro'),
  ('ford-focus', 'ford', 'Focus'),
  ('ford-fiesta', 'ford', 'Fiesta'),
  ('ford-ranger', 'ford', 'Ranger'),
  ('ford-ecosport', 'ford', 'EcoSport'),
  ('ford-ka', 'ford', 'Ka'),
  ('ford-mondeo', 'ford', 'Mondeo'),
  ('chev-cruze', 'chevrolet', 'Cruze'),
  ('chev-onix', 'chevrolet', 'Onix'),
  ('chev-tracker', 'chevrolet', 'Tracker'),
  ('chev-s10', 'chevrolet', 'S10'),
  ('chev-prisma', 'chevrolet', 'Prisma'),
  ('chev-spin', 'chevrolet', 'Spin'),
  ('toy-corolla', 'toyota', 'Corolla'),
  ('toy-hilux', 'toyota', 'Hilux'),
  ('toy-etios', 'toyota', 'Etios'),
  ('toy-yaris', 'toyota', 'Yaris'),
  ('toy-rav4', 'toyota', 'RAV4'),
  ('toy-sw4', 'toyota', 'SW4'),
  ('ren-clio', 'renault', 'Clio'),
  ('ren-sandero', 'renault', 'Sandero'),
  ('ren-duster', 'renault', 'Duster'),
  ('ren-logan', 'renault', 'Logan'),
  ('ren-captur', 'renault', 'Captur'),
  ('ren-kangoo', 'renault', 'Kangoo'),
  ('peu-208', 'peugeot', '208'),
  ('peu-308', 'peugeot', '308'),
  ('peu-2008', 'peugeot', '2008'),
  ('peu-3008', 'peugeot', '3008'),
  ('peu-partner', 'peugeot', 'Partner'),
  ('peu-expert', 'peugeot', 'Expert'),
  ('fiat-cronos', 'fiat', 'Cronos'),
  ('fiat-argo', 'fiat', 'Argo'),
  ('fiat-toro', 'fiat', 'Toro'),
  ('fiat-mobi', 'fiat', 'Mobi'),
  ('fiat-pulse', 'fiat', 'Pulse'),
  ('fiat-strada', 'fiat', 'Strada')
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER update_vehicle_brands_updated_at BEFORE UPDATE
  ON vehicle_brands FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_models_updated_at BEFORE UPDATE
  ON vehicle_models FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Hacer click en "Run"**

✅ Deberías ver: "Success. No rows returned"

---

### 5️⃣ Verificar que todo funcionó

**Copiar y pegar este SQL para verificar:**

```sql
-- Verificar tablas y datos
SELECT 'appointment_services' as tabla, COUNT(*) as registros FROM appointment_services
UNION ALL
SELECT 'quotation_services', COUNT(*) FROM quotation_services
UNION ALL
SELECT 'vehicle_brands', COUNT(*) FROM vehicle_brands
UNION ALL
SELECT 'vehicle_models', COUNT(*) FROM vehicle_models;
```

**Resultado esperado:**
```
tabla                   | registros
-----------------------|----------
appointment_services   | 8
quotation_services     | 3
vehicle_brands         | 7
vehicle_models         | 42
```

✅ **Si ves estos números, TODO FUNCIONÓ CORRECTAMENTE!**

---

## 🎉 ¡Listo!

Las migraciones están completas. Ahora tu aplicación puede:

- ✅ Obtener servicios de turnos desde la BD
- ✅ Obtener servicios de cotización desde la BD
- ✅ Obtener marcas y modelos de vehículos desde la BD
- ✅ Actualizar precios sin hacer deploy
- ✅ Agregar nuevos servicios/vehículos fácilmente

---

## 🔍 Explorar las Nuevas Tablas

Ve a: **Table Editor** → Verás 4 nuevas tablas:
- `appointment_services`
- `quotation_services`
- `vehicle_brands`
- `vehicle_models`

Puedes editar los datos directamente desde ahí!

---

## 📞 Si Algo Sale Mal

Si ves algún error:
1. Toma screenshot del error
2. Avísame en el chat
3. Las migraciones son seguras (usan `IF NOT EXISTS` y `ON CONFLICT DO NOTHING`)

---

**Tiempo estimado: 5 minutos** ⏱️
