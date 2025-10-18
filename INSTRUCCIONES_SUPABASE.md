# 📋 Instrucciones para Configurar la Base de Datos en Supabase

## Paso 1: Acceder al SQL Editor de Supabase

1. Ve a: https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr
2. En el menú lateral, haz clic en **SQL Editor**
3. Haz clic en **"New query"**

## Paso 2: Ejecutar el Script SQL

Copia y pega TODO el contenido del archivo `supabase_setup.sql` en el editor SQL y ejecuta.

Si prefieres ejecutar paso a paso, aquí está el orden:

### 1️⃣ Primero - Crear tabla de productos:
```sql
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  category VARCHAR(50) NOT NULL CHECK (category IN ('auto', 'camioneta', 'camion', 'moto')),
  size VARCHAR(50),
  width INTEGER,
  profile INTEGER,
  diameter INTEGER,
  load_index VARCHAR(10),
  speed_rating VARCHAR(5),
  description TEXT,
  price DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  image_url TEXT,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### 2️⃣ Segundo - Crear tabla de appointments:
```sql
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50) NOT NULL,
  service VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  branch VARCHAR(100) NOT NULL,
  vehicle_info JSONB,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### 3️⃣ Tercero - Crear tabla de branches:
```sql
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  hours JSONB,
  coordinates JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### 4️⃣ Cuarto - Habilitar RLS (Row Level Security):
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para productos y sucursales
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Branches are viewable by everyone" ON branches
  FOR SELECT USING (true);

-- Política para crear appointments
CREATE POLICY "Anyone can create appointments" ON appointments
  FOR INSERT WITH CHECK (true);
```

## Paso 3: Verificar que las tablas se crearon

1. En el menú lateral, ve a **Table Editor**
2. Deberías ver las 3 tablas: `products`, `appointments`, `branches`

## Paso 4: Ejecutar el script de Node.js para insertar datos

Una vez creadas las tablas, ejecuta desde la terminal:

```bash
node setup-database.js
```

## Alternativa: Insertar datos manualmente

Si prefieres, puedes insertar los datos de ejemplo directamente desde el SQL Editor ejecutando las queries INSERT del archivo `supabase_setup.sql`

## 🚀 Listo!

Una vez completados estos pasos, tu aplicación estará conectada y funcionando con Supabase.

Visita http://localhost:6001/products para ver el catálogo de productos.