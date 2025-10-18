-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to search products with full-text search
CREATE OR REPLACE FUNCTION public.search_products(
  search_query TEXT,
  category_filter UUID DEFAULT NULL,
  brand_filter UUID DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  limit_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  price DECIMAL,
  sale_price DECIMAL,
  brand_name TEXT,
  category_name TEXT,
  image_url TEXT,
  rating DECIMAL,
  review_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.sale_price,
    b.name AS brand_name,
    c.name AS category_name,
    (SELECT url FROM public.product_images pi
     WHERE pi.product_id = p.id AND pi.is_primary = true
     LIMIT 1) AS image_url,
    COALESCE(AVG(r.rating), 0) AS rating,
    COUNT(DISTINCT r.id) AS review_count
  FROM public.products p
  LEFT JOIN public.brands b ON p.brand_id = b.id
  LEFT JOIN public.categories c ON p.category_id = c.id
  LEFT JOIN public.reviews r ON p.id = r.product_id AND r.is_approved = true
  WHERE
    p.status = 'active'
    AND (search_query IS NULL OR search_query = '' OR
         to_tsvector('spanish', p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(b.name, '') || ' ' || COALESCE(c.name, ''))
         @@ plainto_tsquery('spanish', search_query))
    AND (category_filter IS NULL OR p.category_id = category_filter)
    AND (brand_filter IS NULL OR p.brand_id = brand_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
  GROUP BY p.id, p.name, p.slug, p.description, p.price, p.sale_price, b.name, c.name
  ORDER BY
    CASE WHEN search_query IS NOT NULL AND search_query != ''
         THEN ts_rank(to_tsvector('spanish', p.name || ' ' || COALESCE(p.description, '')),
                      plainto_tsquery('spanish', search_query))
         ELSE 0 END DESC,
    p.featured DESC,
    p.best_seller DESC,
    p.created_at DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get product with all details
CREATE OR REPLACE FUNCTION public.get_product_details(product_slug TEXT)
RETURNS TABLE (
  id UUID,
  sku TEXT,
  name TEXT,
  slug TEXT,
  description TEXT,
  brand_id UUID,
  brand_name TEXT,
  brand_slug TEXT,
  category_id UUID,
  category_name TEXT,
  category_slug TEXT,
  width INTEGER,
  aspect_ratio INTEGER,
  rim_diameter INTEGER,
  load_index INTEGER,
  speed_rating TEXT,
  season TEXT,
  price DECIMAL,
  sale_price DECIMAL,
  stock_quantity INTEGER,
  features JSONB,
  specifications JSONB,
  status product_status,
  featured BOOLEAN,
  best_seller BOOLEAN,
  new_arrival BOOLEAN,
  images JSONB,
  rating DECIMAL,
  review_count BIGINT,
  meta_title TEXT,
  meta_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.sku,
    p.name,
    p.slug,
    p.description,
    p.brand_id,
    b.name AS brand_name,
    b.slug AS brand_slug,
    p.category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    p.width,
    p.aspect_ratio,
    p.rim_diameter,
    p.load_index,
    p.speed_rating,
    p.season,
    p.price,
    p.sale_price,
    p.stock_quantity,
    p.features,
    p.specifications,
    p.status,
    p.featured,
    p.best_seller,
    p.new_arrival,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', pi.id,
          'url', pi.url,
          'alt_text', pi.alt_text,
          'is_primary', pi.is_primary,
          'display_order', pi.display_order
        ) ORDER BY pi.display_order, pi.is_primary DESC
      ) FILTER (WHERE pi.id IS NOT NULL),
      '[]'::jsonb
    ) AS images,
    COALESCE(AVG(r.rating), 0) AS rating,
    COUNT(DISTINCT r.id) AS review_count,
    p.meta_title,
    p.meta_description
  FROM public.products p
  LEFT JOIN public.brands b ON p.brand_id = b.id
  LEFT JOIN public.categories c ON p.category_id = c.id
  LEFT JOIN public.product_images pi ON p.id = pi.product_id
  LEFT JOIN public.reviews r ON p.id = r.product_id AND r.is_approved = true
  WHERE p.slug = product_slug
  GROUP BY
    p.id, p.sku, p.name, p.slug, p.description, p.brand_id, b.name, b.slug,
    p.category_id, c.name, c.slug, p.width, p.aspect_ratio, p.rim_diameter,
    p.load_index, p.speed_rating, p.season, p.price, p.sale_price,
    p.stock_quantity, p.features, p.specifications, p.status, p.featured,
    p.best_seller, p.new_arrival, p.meta_title, p.meta_description;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to generate unique voucher code
CREATE OR REPLACE FUNCTION public.generate_voucher_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code format: NDV-XXXXX (where X is alphanumeric)
    new_code := 'NDV-' || upper(substring(md5(random()::text) from 1 for 5));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.vouchers WHERE code = new_code) INTO code_exists;

    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to clean expired carts
CREATE OR REPLACE FUNCTION public.clean_expired_carts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.cart_sessions
  WHERE expires_at < NOW()
  AND user_id IS NULL; -- Only delete anonymous carts

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to get store availability for appointments
CREATE OR REPLACE FUNCTION public.get_store_availability(
  store_uuid UUID,
  check_date DATE
)
RETURNS TABLE (
  time_slot TIME,
  is_available BOOLEAN,
  appointments_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH time_slots AS (
    SELECT generate_series(
      '09:00:00'::TIME,
      '17:00:00'::TIME,
      '1 hour'::INTERVAL
    )::TIME AS slot
  ),
  existing_appointments AS (
    SELECT
      preferred_time,
      COUNT(*) AS count
    FROM public.appointments
    WHERE store_id = store_uuid
    AND preferred_date = check_date
    AND status IN ('pending', 'confirmed')
    GROUP BY preferred_time
  )
  SELECT
    ts.slot AS time_slot,
    COALESCE(ea.count, 0) < 3 AS is_available, -- Max 3 appointments per hour
    COALESCE(ea.count, 0) AS appointments_count
  FROM time_slots ts
  LEFT JOIN existing_appointments ea ON ts.slot = ea.preferred_time
  ORDER BY ts.slot;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate cart totals
CREATE OR REPLACE FUNCTION public.calculate_cart_total(session_uuid UUID)
RETURNS TABLE (
  subtotal DECIMAL,
  tax DECIMAL,
  shipping DECIMAL,
  total DECIMAL,
  items_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(ci.quantity * ci.price_at_time) AS subtotal,
    SUM(ci.quantity * ci.price_at_time) * 0.21 AS tax, -- 21% IVA
    CASE
      WHEN SUM(ci.quantity * ci.price_at_time) >= 50000 THEN 0
      ELSE 2500
    END AS shipping,
    SUM(ci.quantity * ci.price_at_time) * 1.21 +
    CASE
      WHEN SUM(ci.quantity * ci.price_at_time) >= 50000 THEN 0
      ELSE 2500
    END AS total,
    SUM(ci.quantity) AS items_count
  FROM public.cart_items ci
  WHERE ci.cart_session_id = session_uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get analytics data (for admin dashboard)
CREATE OR REPLACE FUNCTION public.get_analytics(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  total_vouchers BIGINT,
  active_vouchers BIGINT,
  redeemed_vouchers BIGINT,
  total_appointments BIGINT,
  pending_appointments BIGINT,
  completed_appointments BIGINT,
  total_reviews BIGINT,
  average_rating DECIMAL,
  low_stock_products BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.vouchers
     WHERE created_at::DATE BETWEEN start_date AND end_date) AS total_vouchers,
    (SELECT COUNT(*) FROM public.vouchers
     WHERE status = 'active' AND valid_until >= NOW()) AS active_vouchers,
    (SELECT COUNT(*) FROM public.vouchers
     WHERE status = 'redeemed' AND redeemed_at::DATE BETWEEN start_date AND end_date) AS redeemed_vouchers,
    (SELECT COUNT(*) FROM public.appointments
     WHERE created_at::DATE BETWEEN start_date AND end_date) AS total_appointments,
    (SELECT COUNT(*) FROM public.appointments
     WHERE status = 'pending') AS pending_appointments,
    (SELECT COUNT(*) FROM public.appointments
     WHERE status = 'completed' AND completed_at::DATE BETWEEN start_date AND end_date) AS completed_appointments,
    (SELECT COUNT(*) FROM public.reviews
     WHERE created_at::DATE BETWEEN start_date AND end_date) AS total_reviews,
    (SELECT AVG(rating) FROM public.reviews
     WHERE is_approved = true) AS average_rating,
    (SELECT COUNT(*) FROM public.products
     WHERE stock_quantity <= min_stock_alert AND status = 'active') AS low_stock_products;
END;
$$ LANGUAGE plpgsql STABLE;