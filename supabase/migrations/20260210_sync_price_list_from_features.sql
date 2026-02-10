-- Sync products.price_list column from features->>'price_list' (source of truth).
-- The features.price_list value is written by the stock update Excel import (PUBLICO column)
-- and is the correct value. The column-level price_list was set by an old migration
-- using price * 1.25, which produced incorrect values for some products.

UPDATE products
SET price_list = (features->>'price_list')::DECIMAL(10, 2)
WHERE features->>'price_list' IS NOT NULL
  AND (features->>'price_list')::DECIMAL(10, 2) > 0;
