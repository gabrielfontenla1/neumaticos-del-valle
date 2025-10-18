-- Neumáticos del Valle - Database Setup for Supabase
-- Este script crea todas las tablas necesarias para la aplicación

-- ====================
-- TABLA DE PRODUCTOS
-- ====================
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

-- Índices para búsqueda rápida
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_size ON products(width, profile, diameter);

-- ====================
-- TABLA DE CITAS/TURNOS
-- ====================
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

-- Índices para citas
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_branch ON appointments(branch);

-- ====================
-- TABLA DE SUCURSALES
-- ====================
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

-- ====================
-- INSERTAR SUCURSALES
-- ====================
INSERT INTO branches (name, city, province, address, phone) VALUES
  ('Neumáticos del Valle Catamarca Centro', 'Catamarca', 'Catamarca', 'Av. Belgrano 938', '(0383) 443-0000'),
  ('Neumáticos del Valle La Banda', 'La Banda', 'Santiago del Estero', 'República del Líbano Sur 866', '(0385) 427-0000'),
  ('Neumáticos del Valle San Fernando', 'San Fernando del Valle', 'Catamarca', 'Alem 1118', '(0383) 443-1111'),
  ('Neumáticos del Valle Salta', 'Salta', 'Salta', 'Jujuy 330', '(0387) 431-0000'),
  ('Neumáticos del Valle Santiago', 'Santiago del Estero', 'Santiago del Estero', 'Av. Belgrano Sur 2834', '(0385) 422-0000'),
  ('Neumáticos del Valle Tucumán', 'San Miguel de Tucumán', 'Tucumán', 'Av. Gobernador del Campo 436', '(0381) 424-0000')
ON CONFLICT DO NOTHING;

-- ====================
-- PRODUCTOS DE EJEMPLO
-- ====================
INSERT INTO products (name, brand, model, category, width, profile, diameter, price, stock, description) VALUES
  -- Neumáticos para Autos
  ('Pirelli Cinturato P7', 'Pirelli', 'Cinturato P7', 'auto', 205, 55, 16, 85000, 20, 'Neumático de alto rendimiento con tecnología Green Performance'),
  ('Pirelli P400 EVO', 'Pirelli', 'P400 EVO', 'auto', 175, 65, 14, 65000, 15, 'Ideal para uso urbano, excelente durabilidad'),
  ('Pirelli P1 Cinturato', 'Pirelli', 'P1 Cinturato', 'auto', 195, 60, 15, 72000, 25, 'Perfecto balance entre confort y seguridad'),
  ('Pirelli P Zero', 'Pirelli', 'P Zero', 'auto', 225, 45, 17, 125000, 10, 'Ultra High Performance para vehículos deportivos'),

  -- Neumáticos para Camionetas
  ('Pirelli Scorpion Verde', 'Pirelli', 'Scorpion Verde', 'camioneta', 235, 65, 17, 115000, 18, 'SUV y Crossover, máxima eficiencia'),
  ('Pirelli Scorpion ATR', 'Pirelli', 'Scorpion ATR', 'camioneta', 265, 70, 16, 135000, 12, 'All Terrain para aventuras off-road'),
  ('Pirelli Scorpion Zero', 'Pirelli', 'Scorpion Zero', 'camioneta', 255, 55, 18, 145000, 8, 'Alto rendimiento para SUV deportivos'),

  -- Neumáticos para Camiones
  ('Pirelli FH88', 'Pirelli', 'FH88', 'camion', 295, 80, 22.5, 285000, 6, 'Para eje delantero, larga distancia'),
  ('Pirelli TR88', 'Pirelli', 'TR88', 'camion', 295, 80, 22.5, 295000, 4, 'Para eje de tracción, máxima tracción'),
  ('Pirelli Formula Driver II', 'Pirelli', 'Formula Driver II', 'camion', 275, 80, 22.5, 265000, 5, 'Versátil para todo tipo de ejes')
ON CONFLICT DO NOTHING;

-- ====================
-- FUNCIONES ÚTILES
-- ====================

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================
-- ROW LEVEL SECURITY
-- ====================

-- Habilitar RLS en las tablas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Políticas para productos (lectura pública)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Políticas para sucursales (lectura pública)
CREATE POLICY "Branches are viewable by everyone" ON branches
  FOR SELECT USING (true);

-- Políticas para appointments (inserción pública, lectura restringida)
CREATE POLICY "Anyone can create appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- Solo se pueden ver las citas propias (basado en phone o email)
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (
    customer_phone = current_setting('request.jwt.claims', true)::json->>'phone' OR
    customer_email = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- ====================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ====================
CREATE INDEX idx_products_search ON products
  USING gin(to_tsvector('spanish', name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(model, '')));

-- ====================
-- VISTAS ÚTILES
-- ====================

-- Vista de productos con stock disponible
CREATE OR REPLACE VIEW available_products AS
SELECT * FROM products WHERE stock > 0;

-- Vista de citas del día
CREATE OR REPLACE VIEW today_appointments AS
SELECT * FROM appointments
WHERE appointment_date = CURRENT_DATE
  AND status != 'cancelled'
ORDER BY appointment_time;

COMMENT ON TABLE products IS 'Catálogo de productos de neumáticos';
COMMENT ON TABLE appointments IS 'Sistema de turnos/citas para servicios';
COMMENT ON TABLE branches IS 'Información de sucursales';