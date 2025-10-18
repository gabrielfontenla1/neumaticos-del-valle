-- Create stores table if it doesn't exist
CREATE TABLE IF NOT EXISTS stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) DEFAULT 'Buenos Aires',
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    opening_hours JSONB DEFAULT '{}',
    is_main BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(active);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city);
CREATE INDEX IF NOT EXISTS idx_stores_is_main ON stores(is_main);

-- Insert sample data only if table is empty
INSERT INTO stores (name, address, city, phone, whatsapp, email, latitude, longitude, opening_hours, is_main, active)
SELECT * FROM (VALUES
    (
        'Neumáticos del Valle - Palermo',
        'Av. Santa Fe 3456',
        'Buenos Aires',
        '(11) 4555-1234',
        '5491155551234',
        'palermo@neumaticosdevalle.com',
        -34.5880,
        -58.4099,
        '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
        true,
        true
    ),
    (
        'Neumáticos del Valle - Belgrano',
        'Av. Cabildo 2345',
        'Buenos Aires',
        '(11) 4666-5678',
        '5491166665678',
        'belgrano@neumaticosdevalle.com',
        -34.5626,
        -58.4546,
        '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
        false,
        true
    ),
    (
        'Neumáticos del Valle - San Isidro',
        'Av. Centenario 1234',
        'San Isidro',
        '(11) 4777-9876',
        '5491177779876',
        'sanisidro@neumaticosdevalle.com',
        -34.4709,
        -58.5286,
        '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "09:00", "close": "14:00"}, "sunday": {"closed": true}}'::jsonb,
        false,
        true
    )
) AS v(name, address, city, phone, whatsapp, email, latitude, longitude, opening_hours, is_main, active)
WHERE NOT EXISTS (SELECT 1 FROM stores LIMIT 1);