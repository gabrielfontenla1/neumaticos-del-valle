-- Create vehicle_brands table
CREATE TABLE IF NOT EXISTS vehicle_brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vehicle_brands_name ON vehicle_brands(name);

-- Insert hardcoded vehicle brands data
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_vehicle_models_brand_id ON vehicle_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_models_name ON vehicle_models(name);

-- Insert hardcoded vehicle models data
INSERT INTO vehicle_models (id, brand_id, name) VALUES
  -- Volkswagen
  ('vw-golf', 'volkswagen', 'Golf'),
  ('vw-polo', 'volkswagen', 'Polo'),
  ('vw-tiguan', 'volkswagen', 'Tiguan'),
  ('vw-suran', 'volkswagen', 'Suran'),
  ('vw-amarok', 'volkswagen', 'Amarok'),
  ('vw-saveiro', 'volkswagen', 'Saveiro'),
  -- Ford
  ('ford-focus', 'ford', 'Focus'),
  ('ford-fiesta', 'ford', 'Fiesta'),
  ('ford-ranger', 'ford', 'Ranger'),
  ('ford-ecosport', 'ford', 'EcoSport'),
  ('ford-ka', 'ford', 'Ka'),
  ('ford-mondeo', 'ford', 'Mondeo'),
  -- Chevrolet
  ('chev-cruze', 'chevrolet', 'Cruze'),
  ('chev-onix', 'chevrolet', 'Onix'),
  ('chev-tracker', 'chevrolet', 'Tracker'),
  ('chev-s10', 'chevrolet', 'S10'),
  ('chev-prisma', 'chevrolet', 'Prisma'),
  ('chev-spin', 'chevrolet', 'Spin'),
  -- Toyota
  ('toy-corolla', 'toyota', 'Corolla'),
  ('toy-hilux', 'toyota', 'Hilux'),
  ('toy-etios', 'toyota', 'Etios'),
  ('toy-yaris', 'toyota', 'Yaris'),
  ('toy-rav4', 'toyota', 'RAV4'),
  ('toy-sw4', 'toyota', 'SW4'),
  -- Renault
  ('ren-clio', 'renault', 'Clio'),
  ('ren-sandero', 'renault', 'Sandero'),
  ('ren-duster', 'renault', 'Duster'),
  ('ren-logan', 'renault', 'Logan'),
  ('ren-captur', 'renault', 'Captur'),
  ('ren-kangoo', 'renault', 'Kangoo'),
  -- Peugeot
  ('peu-208', 'peugeot', '208'),
  ('peu-308', 'peugeot', '308'),
  ('peu-2008', 'peugeot', '2008'),
  ('peu-3008', 'peugeot', '3008'),
  ('peu-partner', 'peugeot', 'Partner'),
  ('peu-expert', 'peugeot', 'Expert'),
  -- Fiat
  ('fiat-cronos', 'fiat', 'Cronos'),
  ('fiat-argo', 'fiat', 'Argo'),
  ('fiat-toro', 'fiat', 'Toro'),
  ('fiat-mobi', 'fiat', 'Mobi'),
  ('fiat-pulse', 'fiat', 'Pulse'),
  ('fiat-strada', 'fiat', 'Strada')
ON CONFLICT (id) DO NOTHING;

-- Create triggers for updated_at
CREATE TRIGGER update_vehicle_brands_updated_at BEFORE UPDATE
  ON vehicle_brands FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_models_updated_at BEFORE UPDATE
  ON vehicle_models FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
