-- Sync stock_quantity to match stock (source of truth).
-- 84 products had stale stock_quantity values from legacy data.
-- 5 products had ghost stock (stock=0 but stock_quantity>0).

UPDATE products
SET stock_quantity = stock
WHERE stock_quantity IS DISTINCT FROM stock;
