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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quotation_services_name ON quotation_services(name);

-- Insert hardcoded quotation services data
INSERT INTO quotation_services (id, name, description, price, price_type, icon) VALUES
  ('installation', 'Instalación Profesional', 'Incluye montaje, balanceo y válvulas nuevas', 2500.00, 'per-tire', '🔧'),
  ('alignment', 'Alineación Computarizada', 'Alineación de precisión con tecnología láser', 8000.00, 'flat', '⚙️'),
  ('delivery', 'Envío a Domicilio', 'Entrega e instalación en tu domicilio', 3500.00, 'flat', '🚚')
ON CONFLICT (id) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_quotation_services_updated_at BEFORE UPDATE
  ON quotation_services FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
