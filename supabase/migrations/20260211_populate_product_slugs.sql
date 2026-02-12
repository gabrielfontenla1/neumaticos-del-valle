-- Populate slug for all existing products that don't have one yet.
-- Format: {brand}-{model}-{width}-{profile}-r{diameter}-{sku}
-- SKU comes from: sku column, features->>'codigo_propio', or first 8 chars of UUID.

UPDATE products
SET slug = trim(BOTH '-' FROM
  lower(
    regexp_replace(
      regexp_replace(
        concat_ws('-',
          nullif(trim(brand), ''),
          nullif(trim(model), ''),
          CASE WHEN width > 0 THEN width::text END,
          CASE WHEN aspect_ratio > 0 THEN aspect_ratio::text END,
          CASE WHEN rim_diameter > 0 THEN 'r' || rim_diameter::text END,
          coalesce(
            nullif(trim(sku), ''),
            nullif(trim((features->>'codigo_propio')::text), ''),
            left(id::text, 8)
          )
        ),
        '[^a-z0-9-]', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  )
)
WHERE slug IS NULL OR slug = '';
