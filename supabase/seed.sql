-- Seed data for development and testing

-- Insert stores
INSERT INTO public.stores (name, address, city, phone, whatsapp, email, latitude, longitude, is_main)
VALUES
  ('Neumáticos del Valle - Sede Principal', 'Av. Independencia 3456', 'Mar del Plata', '223-456-7890', '223-15-456-7890', 'info@neumaticosdelvalle.com', -38.0055, -57.5426, true),
  ('Neumáticos del Valle - Sucursal Centro', 'San Martín 1234', 'Mar del Plata', '223-456-7891', '223-15-456-7891', 'centro@neumaticosdelvalle.com', -38.0023, -57.5575, false),
  ('Neumáticos del Valle - Sucursal Puerto', 'Av. Martínez de Hoz 2000', 'Mar del Plata', '223-456-7892', '223-15-456-7892', 'puerto@neumaticosdelvalle.com', -38.0428, -57.5322, false);

-- Insert categories
INSERT INTO public.categories (name, slug, description, display_order)
VALUES
  ('Autos', 'autos', 'Neumáticos para automóviles', 1),
  ('Camionetas', 'camionetas', 'Neumáticos para camionetas y SUVs', 2),
  ('Camiones', 'camiones', 'Neumáticos para camiones y vehículos pesados', 3),
  ('Motos', 'motos', 'Neumáticos para motocicletas', 4),
  ('Agrícolas', 'agricolas', 'Neumáticos para maquinaria agrícola', 5);

-- Insert brands
INSERT INTO public.brands (name, slug, description, featured)
VALUES
  ('Michelin', 'michelin', 'Líder mundial en neumáticos de alta calidad', true),
  ('Bridgestone', 'bridgestone', 'Innovación y tecnología japonesa en neumáticos', true),
  ('Pirelli', 'pirelli', 'Neumáticos deportivos y de alto rendimiento', true),
  ('Continental', 'continental', 'Tecnología alemana para máxima seguridad', false),
  ('Goodyear', 'goodyear', 'Calidad y confiabilidad americana', false),
  ('Yokohama', 'yokohama', 'Neumáticos de precisión japonesa', false),
  ('Fate', 'fate', 'Marca nacional de excelente relación calidad-precio', true),
  ('Firestone', 'firestone', 'Durabilidad y rendimiento comprobado', false);

-- Get IDs for foreign keys
DO $$
DECLARE
  auto_id UUID;
  camioneta_id UUID;
  michelin_id UUID;
  bridgestone_id UUID;
  pirelli_id UUID;
  continental_id UUID;
  goodyear_id UUID;
  fate_id UUID;
BEGIN
  SELECT id INTO auto_id FROM public.categories WHERE slug = 'autos';
  SELECT id INTO camioneta_id FROM public.categories WHERE slug = 'camionetas';
  SELECT id INTO michelin_id FROM public.brands WHERE slug = 'michelin';
  SELECT id INTO bridgestone_id FROM public.brands WHERE slug = 'bridgestone';
  SELECT id INTO pirelli_id FROM public.brands WHERE slug = 'pirelli';
  SELECT id INTO continental_id FROM public.brands WHERE slug = 'continental';
  SELECT id INTO goodyear_id FROM public.brands WHERE slug = 'goodyear';
  SELECT id INTO fate_id FROM public.brands WHERE slug = 'fate';

  -- Insert sample products
  INSERT INTO public.products (
    sku, name, slug, description, brand_id, category_id,
    width, aspect_ratio, rim_diameter, load_index, speed_rating, season,
    price, sale_price, stock_quantity, featured, best_seller, new_arrival,
    features, specifications
  ) VALUES
  (
    'MICH-PRIM4-20555R16',
    'Michelin Primacy 4 205/55 R16 91V',
    'michelin-primacy-4-205-55-r16',
    'El Michelin Primacy 4 ofrece el más alto nivel de seguridad, desde el primer hasta el último kilómetro. Excelente frenado en mojado.',
    michelin_id,
    auto_id,
    205, 55, 16, 91, 'V', 'summer',
    85000, 79900, 15, true, true, false,
    '["Excelente frenado en mojado", "Larga durabilidad", "Bajo ruido de rodadura", "Eficiencia de combustible clase A"]'::jsonb,
    '{"peso": "8.5 kg", "presion_recomendada": "32 PSI", "profundidad_dibujo": "7.2mm", "garantia": "5 años"}'::jsonb
  ),
  (
    'BRID-TURANZA-18560R15',
    'Bridgestone Turanza T005 185/60 R15 88H',
    'bridgestone-turanza-t005-185-60-r15',
    'Neumático de turismo premium con excelente rendimiento en seco y mojado. Ideal para conducción diaria con máximo confort.',
    bridgestone_id,
    auto_id,
    185, 60, 15, 88, 'H', 'summer',
    72000, NULL, 20, true, false, true,
    '["Máximo confort de conducción", "Reducción de ruido", "Alta durabilidad", "Excelente agarre en mojado"]'::jsonb,
    '{"peso": "7.8 kg", "presion_recomendada": "30 PSI", "profundidad_dibujo": "7.0mm", "garantia": "5 años"}'::jsonb
  ),
  (
    'PIR-PZERO-22545R17',
    'Pirelli P Zero 225/45 R17 94Y',
    'pirelli-p-zero-225-45-r17',
    'Neumático de ultra alto rendimiento desarrollado en colaboración con los principales fabricantes de vehículos premium.',
    pirelli_id,
    auto_id,
    225, 45, 17, 94, 'Y', 'summer',
    125000, 115000, 8, true, true, false,
    '["Ultra alto rendimiento", "Diseñado para deportivos", "Máximo agarre", "Control preciso"]'::jsonb,
    '{"peso": "9.2 kg", "presion_recomendada": "35 PSI", "profundidad_dibujo": "7.5mm", "garantia": "4 años"}'::jsonb
  ),
  (
    'CONT-ECOCONTACT-19565R15',
    'Continental EcoContact 6 195/65 R15 91H',
    'continental-ecocontact-6-195-65-r15',
    'Neumático ecológico con menor resistencia a la rodadura para máximo ahorro de combustible.',
    continental_id,
    auto_id,
    195, 65, 15, 91, 'H', 'summer',
    68000, NULL, 25, false, false, false,
    '["Ahorro de combustible", "Bajo impacto ambiental", "Larga vida útil", "Conducción silenciosa"]'::jsonb,
    '{"peso": "8.0 kg", "presion_recomendada": "32 PSI", "profundidad_dibujo": "7.0mm", "garantia": "5 años"}'::jsonb
  ),
  (
    'GOOD-EAGLE-F1-24540R18',
    'Goodyear Eagle F1 Asymmetric 5 245/40 R18 97Y',
    'goodyear-eagle-f1-asymmetric-5-245-40-r18',
    'Neumático deportivo con tecnología asimétrica para máximo rendimiento en curvas y frenado.',
    goodyear_id,
    auto_id,
    245, 40, 18, 97, 'Y', 'summer',
    145000, 138000, 6, true, false, true,
    '["Tecnología asimétrica", "Máximo agarre en curvas", "Frenado deportivo", "Alto rendimiento"]'::jsonb,
    '{"peso": "10.5 kg", "presion_recomendada": "36 PSI", "profundidad_dibujo": "8.0mm", "garantia": "4 años"}'::jsonb
  ),
  (
    'FATE-MAXISPORT-19555R15',
    'Fate Maxisport 2 195/55 R15 85V',
    'fate-maxisport-2-195-55-r15',
    'Neumático nacional de excelente relación calidad-precio. Ideal para uso urbano y rutas.',
    fate_id,
    auto_id,
    195, 55, 15, 85, 'V', 'summer',
    45000, 42000, 30, false, true, false,
    '["Fabricación nacional", "Excelente relación calidad-precio", "Buen agarre", "Durabilidad comprobada"]'::jsonb,
    '{"peso": "7.5 kg", "presion_recomendada": "30 PSI", "profundidad_dibujo": "6.8mm", "garantia": "3 años"}'::jsonb
  ),
  (
    'MICH-LTX-26570R16',
    'Michelin LTX Force 265/70 R16 112T',
    'michelin-ltx-force-265-70-r16',
    'Neumático para camionetas y SUVs con excelente tracción en todo terreno.',
    michelin_id,
    camioneta_id,
    265, 70, 16, 112, 'T', 'all-season',
    135000, NULL, 10, true, false, false,
    '["Todo terreno", "Alta resistencia", "Tracción superior", "Larga durabilidad"]'::jsonb,
    '{"peso": "14.5 kg", "presion_recomendada": "40 PSI", "profundidad_dibujo": "10.0mm", "garantia": "6 años"}'::jsonb
  ),
  (
    'BRID-DUELER-23565R17',
    'Bridgestone Dueler H/T 684 235/65 R17 104H',
    'bridgestone-dueler-ht-684-235-65-r17',
    'Neumático para SUV con balance perfecto entre confort en carretera y capacidad todoterreno.',
    bridgestone_id,
    camioneta_id,
    235, 65, 17, 104, 'H', 'all-season',
    115000, 108000, 12, false, true, false,
    '["Confort en carretera", "Capacidad off-road", "Bajo ruido", "Alta durabilidad"]'::jsonb,
    '{"peso": "12.8 kg", "presion_recomendada": "38 PSI", "profundidad_dibujo": "9.5mm", "garantia": "5 años"}'::jsonb
  );

  -- Insert product images for each product
  INSERT INTO public.product_images (product_id, url, alt_text, is_primary, display_order)
  SELECT
    p.id,
    'https://placehold.co/600x600/png?text=' || replace(p.slug, '-', '+'),
    p.name,
    true,
    0
  FROM public.products p;

  -- Insert additional images for featured products
  INSERT INTO public.product_images (product_id, url, alt_text, is_primary, display_order)
  SELECT
    p.id,
    'https://placehold.co/600x600/png?text=' || replace(p.slug, '-', '+') || '+Side',
    p.name || ' - Vista lateral',
    false,
    1
  FROM public.products p
  WHERE p.featured = true;

  INSERT INTO public.product_images (product_id, url, alt_text, is_primary, display_order)
  SELECT
    p.id,
    'https://placehold.co/600x600/png?text=' || replace(p.slug, '-', '+') || '+Detail',
    p.name || ' - Detalle',
    false,
    2
  FROM public.products p
  WHERE p.featured = true;

END $$;

-- Insert sample reviews
INSERT INTO public.reviews (product_id, customer_name, rating, title, comment, verified_purchase)
SELECT
  p.id,
  'Juan Pérez',
  5,
  'Excelente producto',
  'Muy conforme con la compra. Los neumáticos tienen excelente agarre y son muy silenciosos.',
  true
FROM public.products p
WHERE p.slug = 'michelin-primacy-4-205-55-r16';

INSERT INTO public.reviews (product_id, customer_name, rating, title, comment, verified_purchase)
SELECT
  p.id,
  'María González',
  4,
  'Buena relación calidad-precio',
  'Buen producto, cumple con lo esperado. El precio es competitivo.',
  true
FROM public.products p
WHERE p.slug = 'fate-maxisport-2-195-55-r15';

INSERT INTO public.reviews (product_id, customer_name, rating, title, comment, verified_purchase)
SELECT
  p.id,
  'Carlos Rodríguez',
  5,
  'Perfectos para mi SUV',
  'Los uso hace 6 meses y van perfectos. Excelente tracción en tierra y muy cómodos en ruta.',
  true
FROM public.products p
WHERE p.slug = 'bridgestone-dueler-ht-684-235-65-r17';

-- Insert a sample admin user (password: admin123)
-- Note: In production, you should create this user through Supabase Auth dashboard
-- This is just for reference of the admin profile structure
INSERT INTO public.profiles (id, email, full_name, is_admin)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@neumaticosdelvalle.com', 'Administrador', true)
ON CONFLICT (id) DO NOTHING;