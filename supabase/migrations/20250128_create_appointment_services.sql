-- Create appointment_services table
CREATE TABLE IF NOT EXISTS appointment_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10, 2) NOT NULL,
  requires_vehicle BOOLEAN DEFAULT false,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointment_services_name ON appointment_services(name);

-- Insert hardcoded appointment services data
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

-- Create trigger for updated_at
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
