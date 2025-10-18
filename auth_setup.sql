-- ============================
-- SISTEMA DE AUTENTICACIÓN
-- ============================

-- Crear tabla de perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'cliente' CHECK (role IN ('cliente', 'vendedor', 'admin')),
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON profiles(branch_id);

-- ============================
-- TABLA DE VOUCHERS (SOLO PARA VENDEDORES)
-- ============================

CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2),
  product_id UUID REFERENCES public.products(id),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled', 'expired')),
  valid_until DATE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES public.profiles(id),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_created_by ON vouchers(created_by);
CREATE INDEX IF NOT EXISTS idx_vouchers_branch ON vouchers(branch_id);

-- ============================
-- ACTUALIZAR TABLA DE APPOINTMENTS
-- ============================

-- Agregar columna de usuario si no existe
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);

-- ============================
-- ROW LEVEL SECURITY
-- ============================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- ============================
-- POLÍTICAS DE SEGURIDAD - PROFILES
-- ============================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Los admin pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Los vendedores pueden ver perfiles de clientes
CREATE POLICY "Sellers can view customer profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('vendedor', 'admin')
    )
  );

-- ============================
-- POLÍTICAS DE SEGURIDAD - VOUCHERS
-- ============================

-- Solo vendedores y admin pueden crear vouchers
CREATE POLICY "Sellers can create vouchers" ON vouchers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('vendedor', 'admin')
    )
  );

-- Los vendedores solo pueden ver vouchers de su sucursal
CREATE POLICY "Sellers can view branch vouchers" ON vouchers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.role = 'vendedor' AND profiles.branch_id = vouchers.branch_id)
      )
    )
  );

-- Los clientes pueden ver sus propios vouchers (por email o phone)
CREATE POLICY "Customers can view own vouchers" ON vouchers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.email = vouchers.customer_email
        OR profiles.phone = vouchers.customer_phone
      )
    )
  );

-- ============================
-- POLÍTICAS DE SEGURIDAD - APPOINTMENTS
-- ============================

-- Actualizar política existente para appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;

CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (
    user_id = auth.uid()
    OR customer_email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR customer_phone = (SELECT phone FROM profiles WHERE id = auth.uid())
  );

-- Los vendedores y admin pueden ver todos los appointments de su sucursal
CREATE POLICY "Staff can view branch appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (profiles.role = 'vendedor' AND appointments.branch = (
          SELECT name FROM branches WHERE id = profiles.branch_id
        ))
      )
    )
  );

-- Los usuarios pueden crear sus propios appointments
DROP POLICY IF EXISTS "Anyone can create appointments" ON appointments;

CREATE POLICY "Authenticated users can create appointments" ON appointments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Los usuarios pueden actualizar sus propios appointments
CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- ============================
-- FUNCIONES ÚTILES
-- ============================

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para generar código de voucher único
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- DATOS DE PRUEBA
-- ============================

-- NOTA: Los usuarios se deben crear desde la aplicación usando Supabase Auth
-- Aquí solo creamos los perfiles de prueba después de crear los usuarios

-- Para pruebas, después de crear usuarios desde la aplicación:
-- 1. admin@neumaticosdelValle.com (contraseña: Admin123!)
-- 2. vendedor1@neumaticosdelValle.com (contraseña: Vendedor123!)
-- 3. vendedor2@neumaticosdelValle.com (contraseña: Vendedor123!)
-- 4. cliente1@gmail.com (contraseña: Cliente123!)
-- 5. cliente2@gmail.com (contraseña: Cliente123!)

-- Los perfiles se crearán automáticamente con el trigger
-- Pero luego hay que actualizar los roles manualmente o desde la aplicación

COMMENT ON TABLE profiles IS 'Perfiles de usuario que extienden auth.users';
COMMENT ON TABLE vouchers IS 'Sistema de vouchers para vendedores';
COMMENT ON COLUMN profiles.role IS 'Rol del usuario: cliente, vendedor o admin';
COMMENT ON COLUMN vouchers.code IS 'Código único del voucher';
COMMENT ON COLUMN vouchers.status IS 'Estado del voucher: active, used, cancelled, expired';