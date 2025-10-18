# 🔧 INSTRUCCIONES DE CONFIGURACIÓN DE BASE DE DATOS

## ⚠️ IMPORTANTE: Se requiere configuración manual

La página de turnos está intentando acceder a la tabla `stores` que no existe en tu base de datos de Supabase.

## 📋 Pasos para solucionarlo:

### 1. Accede al Editor SQL de Supabase

Abre este enlace en tu navegador:
👉 [https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/editor](https://supabase.com/dashboard/project/oyiwyzmaxgnzyhmmkstr/editor)

### 2. Ejecuta el siguiente SQL

Copia y pega TODO el siguiente código SQL en el editor:

```sql
-- Create stores table for branches/locations
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  email VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours JSONB DEFAULT '{}',
  is_main BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for active stores
CREATE INDEX IF NOT EXISTS idx_stores_active ON public.stores(active);

-- Create index for main store
CREATE INDEX IF NOT EXISTS idx_stores_is_main ON public.stores(is_main);

-- Enable Row Level Security
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view active stores" ON public.stores
  FOR SELECT
  USING (active = true);

-- Create policy for admin write access
CREATE POLICY "Admins can manage stores" ON public.stores
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert sample stores
INSERT INTO public.stores (name, address, city, phone, whatsapp, email, opening_hours, is_main, active)
VALUES
  (
    'Sucursal Central',
    'Av. San Martín 1234',
    'Buenos Aires',
    '011-4444-5555',
    '5491144445555',
    'central@neumaticosdelv alle.com',
    '{
      "monday": {"open": "09:00", "close": "18:00"},
      "tuesday": {"open": "09:00", "close": "18:00"},
      "wednesday": {"open": "09:00", "close": "18:00"},
      "thursday": {"open": "09:00", "close": "18:00"},
      "friday": {"open": "09:00", "close": "18:00"},
      "saturday": {"open": "09:00", "close": "13:00"},
      "sunday": {"closed": true}
    }',
    true,
    true
  ),
  (
    'Sucursal Norte',
    'Av. Maipú 567',
    'Vicente López',
    '011-4444-6666',
    '5491144446666',
    'norte@neumaticosdelv alle.com',
    '{
      "monday": {"open": "09:00", "close": "18:00"},
      "tuesday": {"open": "09:00", "close": "18:00"},
      "wednesday": {"open": "09:00", "close": "18:00"},
      "thursday": {"open": "09:00", "close": "18:00"},
      "friday": {"open": "09:00", "close": "18:00"},
      "saturday": {"open": "09:00", "close": "13:00"},
      "sunday": {"closed": true}
    }',
    false,
    true
  ),
  (
    'Sucursal Sur',
    'Av. Mitre 890',
    'Avellaneda',
    '011-4444-7777',
    '5491144447777',
    'sur@neumaticosdelv alle.com',
    '{
      "monday": {"open": "09:00", "close": "18:00"},
      "tuesday": {"open": "09:00", "close": "18:00"},
      "wednesday": {"open": "09:00", "close": "18:00"},
      "thursday": {"open": "09:00", "close": "18:00"},
      "friday": {"open": "09:00", "close": "18:00"},
      "saturday": {"open": "09:00", "close": "13:00"},
      "sunday": {"closed": true}
    }',
    false,
    true
  );

-- Create or update the appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_year INTEGER,
  service_type VARCHAR(50) NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time VARCHAR(5) NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_store_id ON public.appointments(store_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(preferred_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);

-- Enable Row Level Security on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Anyone can create appointments" ON public.appointments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    customer_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'vendedor')
    )
  );

CREATE POLICY "Users can update their own appointments" ON public.appointments
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'vendedor')
    )
  );

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Haz clic en "Run" o "Ejecutar"

El botón está en la esquina inferior derecha del editor SQL.

### 4. Verifica que funcionó

Después de ejecutar el SQL:

1. Ve a la página de turnos: [http://localhost:6001/appointments](http://localhost:6001/appointments)
2. Deberías ver las 3 sucursales disponibles para seleccionar

## 🎯 Resultado esperado

Una vez ejecutado el SQL correctamente:
- ✅ Se creará la tabla `stores` con 3 sucursales de ejemplo
- ✅ Se creará la tabla `appointments` para guardar los turnos
- ✅ La página de turnos funcionará correctamente
- ✅ Los usuarios podrán reservar turnos sin problemas

## 🆘 ¿Necesitas ayuda?

Si tienes problemas:
1. Verifica que estás en el proyecto correcto en Supabase
2. Asegúrate de copiar TODO el SQL (es largo)
3. Si hay errores, intenta ejecutar el SQL en partes más pequeñas

## 📝 Notas adicionales

- Las tablas tienen Row Level Security (RLS) activado para seguridad
- Los turnos son públicos (cualquiera puede crear uno)
- Solo los admin pueden modificar las sucursales
- Se incluyen 3 sucursales de ejemplo para pruebas