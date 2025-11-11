-- Add price_list column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_list DECIMAL(10, 2);

-- Set initial price_list values (25% more than current price for demonstration)
-- This simulates what the frontend was doing
UPDATE products
SET price_list = ROUND(price * 1.25, 2)
WHERE price_list IS NULL AND price IS NOT NULL;

-- Add comment to column
COMMENT ON COLUMN products.price_list IS 'Precio de lista sin descuento (precio tachado)';