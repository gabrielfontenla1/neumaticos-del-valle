-- ============================================================================
-- BULK STOCK UPDATE RPC FUNCTIONS
-- Replaces 741 individual .update() calls with batch RPCs for ~90% speedup
-- ============================================================================

-- 1. bulk_update_products: Batch update products in a single transaction
-- Input: JSONB array of { id, price?, price_list?, stock?, features?, category?, brand? }
-- Returns: { updated: int, errors: jsonb[] }
CREATE OR REPLACE FUNCTION bulk_update_products(p_updates JSONB)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_updated INT := 0;
  v_errors JSONB[] := '{}';
  v_product_id INT;
  v_stock INT;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    BEGIN
      v_product_id := (v_item->>'id')::INT;
      v_stock := CASE WHEN v_item ? 'stock' THEN (v_item->>'stock')::INT ELSE NULL END;

      UPDATE products SET
        price = COALESCE((v_item->>'price')::NUMERIC, price),
        price_list = COALESCE((v_item->>'price_list')::NUMERIC, price_list),
        stock = COALESCE(v_stock, stock),
        stock_quantity = COALESCE(v_stock, stock_quantity),
        features = CASE
          WHEN v_item ? 'features' THEN (v_item->'features')::JSONB
          ELSE features
        END,
        category = COALESCE(v_item->>'category', category),
        brand = COALESCE(v_item->>'brand', brand),
        updated_at = NOW()
      WHERE id = v_product_id;

      IF FOUND THEN
        v_updated := v_updated + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, jsonb_build_object(
        'id', v_product_id,
        'error', SQLERRM
      ));
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'updated', v_updated,
    'errors', to_jsonb(v_errors)
  );
END;
$$ LANGUAGE plpgsql;

-- 2. bulk_upsert_branch_stock: Batch upsert branch stock records
-- Input: JSONB array of { product_id, branch_code, quantity }
-- Matches branch_code against branches.code (case-insensitive)
CREATE OR REPLACE FUNCTION bulk_upsert_branch_stock(p_records JSONB)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_upserted INT := 0;
  v_errors JSONB[] := '{}';
  v_branch_id UUID;
  v_product_id INT;
  v_quantity NUMERIC;
  v_branch_code TEXT;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_records)
  LOOP
    BEGIN
      v_product_id := (v_item->>'product_id')::INT;
      v_branch_code := UPPER(v_item->>'branch_code');
      v_quantity := (v_item->>'quantity')::NUMERIC;

      -- Find branch by code
      SELECT id INTO v_branch_id
      FROM branches
      WHERE UPPER(code) = v_branch_code
      LIMIT 1;

      IF v_branch_id IS NULL THEN
        v_errors := array_append(v_errors, jsonb_build_object(
          'product_id', v_product_id,
          'branch_code', v_branch_code,
          'error', 'Branch not found'
        ));
        CONTINUE;
      END IF;

      INSERT INTO branch_stock (product_id, branch_id, quantity, last_updated)
      VALUES (v_product_id, v_branch_id, v_quantity, NOW())
      ON CONFLICT (product_id, branch_id)
      DO UPDATE SET
        quantity = EXCLUDED.quantity,
        last_updated = NOW();

      v_upserted := v_upserted + 1;

    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, jsonb_build_object(
        'product_id', v_product_id,
        'branch_code', v_branch_code,
        'error', SQLERRM
      ));
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'upserted', v_upserted,
    'errors', to_jsonb(v_errors)
  );
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION bulk_update_products IS 'Batch update products (price, stock, features) in a single transaction. Used by Excel stock import.';
COMMENT ON FUNCTION bulk_upsert_branch_stock IS 'Batch upsert branch stock records matching by branch code. Used by Excel stock import.';
