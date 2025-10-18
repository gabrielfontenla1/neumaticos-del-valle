-- Tabla de productos para Neumáticos del Valle
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  category VARCHAR(50) DEFAULT 'neumatico',
  width INTEGER,
  profile INTEGER,
  diameter INTEGER,
  size_display VARCHAR(20) GENERATED ALWAYS AS (
    CASE
      WHEN width IS NOT NULL AND profile IS NOT NULL AND diameter IS NOT NULL
      THEN width::TEXT || '/' || profile::TEXT || 'R' || diameter::TEXT
      ELSE NULL
    END
  ) STORED,
  price DECIMAL(10,2) NOT NULL,
  price_list DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 4,
  description TEXT,
  features JSONB DEFAULT '{}',
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_size ON products(width, profile, diameter) WHERE width IS NOT NULL;
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_search ON products USING GIN(
  to_tsvector('spanish', name || ' ' || COALESCE(brand, '') || ' ' || COALESCE(model, ''))
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Datos de ejemplo
INSERT INTO products (sku, name, brand, model, category, width, profile, diameter, price, price_list, stock, description, features, is_featured) VALUES
('MICH-185-65-15', 'Michelin Primacy 4', 'Michelin', 'Primacy 4', 'neumatico', 185, 65, 15, 45000, 52000, 12, 'Neumático de alto rendimiento para vehículos de pasajeros', '{"tipo": "verano", "indice_velocidad": "H", "indice_carga": "88"}', true),
('BRID-195-60-15', 'Bridgestone Turanza T001', 'Bridgestone', 'Turanza T001', 'neumatico', 195, 60, 15, 42000, 48000, 8, 'Confort y durabilidad excepcionales', '{"tipo": "verano", "indice_velocidad": "V", "indice_carga": "91"}', true),
('GOOD-205-55-16', 'Goodyear Eagle F1', 'Goodyear', 'Eagle F1', 'neumatico', 205, 55, 16, 55000, 62000, 4, 'Neumático deportivo de alta performance', '{"tipo": "verano", "indice_velocidad": "W", "indice_carga": "94"}', false),
('PIRE-225-45-17', 'Pirelli P Zero', 'Pirelli', 'P Zero', 'neumatico', 225, 45, 17, 68000, 75000, 6, 'El neumático elegido por los fabricantes premium', '{"tipo": "verano", "indice_velocidad": "Y", "indice_carga": "94"}', true),
('CONT-195-65-15', 'Continental ContiPremiumContact 5', 'Continental', 'ContiPremiumContact 5', 'neumatico', 195, 65, 15, 48000, 54000, 10, 'Seguridad y confort en todas las condiciones', '{"tipo": "verano", "indice_velocidad": "H", "indice_carga": "91"}', false),
('FIRE-175-70-14', 'Firestone F-600', 'Firestone', 'F-600', 'neumatico', 175, 70, 14, 28000, 32000, 20, 'Neumático económico para uso urbano', '{"tipo": "verano", "indice_velocidad": "T", "indice_carga": "84"}', false),
('DUNO-215-60-16', 'Dunlop SP Sport', 'Dunlop', 'SP Sport', 'neumatico', 215, 60, 16, 52000, 58000, 7, 'Equilibrio perfecto entre rendimiento y confort', '{"tipo": "verano", "indice_velocidad": "V", "indice_carga": "95"}', false),
('YOKO-185-60-14', 'Yokohama BluEarth', 'Yokohama', 'BluEarth', 'neumatico', 185, 60, 14, 35000, 40000, 15, 'Neumático ecológico con bajo consumo', '{"tipo": "verano", "indice_velocidad": "H", "indice_carga": "86"}', false),
('HANK-205-65-15', 'Hankook Ventus Prime', 'Hankook', 'Ventus Prime', 'neumatico', 205, 65, 15, 38000, 43000, 9, 'Tecnología coreana de alta calidad', '{"tipo": "verano", "indice_velocidad": "H", "indice_carga": "94"}', false),
('BFG-31-10-15', 'BFGoodrich All-Terrain', 'BFGoodrich', 'All-Terrain T/A KO2', '4x4', 31, 10, 15, 85000, 95000, 4, 'El mejor neumático todo terreno del mercado', '{"tipo": "all-terrain", "indice_velocidad": "S", "indice_carga": "109"}', true);

-- Permisos RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

-- Política para modificación (solo autenticados - para admin)
CREATE POLICY "Products are editable by authenticated users"
  ON products FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);