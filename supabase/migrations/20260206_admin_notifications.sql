-- Migration: Admin Notifications System
-- Date: 2026-02-06
-- Author: DATA Agent
-- Description: Creates admin_notifications table, get_admin_dashboard_counts function, and triggers

-- ============================================
-- 1. ENUM for notification types
-- ============================================
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'new_order',
    'new_appointment',
    'new_review',
    'low_stock',
    'new_quote',
    'order_cancelled',
    'appointment_cancelled',
    'voucher_redeemed',
    'system'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. TABLE: admin_notifications
-- ============================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Notification content
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority notification_priority DEFAULT 'medium',

  -- Reference to related entity
  reference_type TEXT, -- 'order', 'appointment', 'review', 'product', 'quote', 'voucher'
  reference_id UUID,

  -- Metadata (extra info as JSON)
  metadata JSONB DEFAULT '{}',

  -- Status tracking
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES profiles(id),

  -- Dismissal
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES profiles(id),

  -- Action tracking
  action_url TEXT, -- URL to navigate when clicked
  action_taken BOOLEAN DEFAULT FALSE,
  action_taken_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Optional expiration
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_reference ON admin_notifications(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority) WHERE is_read = FALSE;

-- ============================================
-- 3. FUNCTION: get_admin_dashboard_counts
-- ============================================
CREATE OR REPLACE FUNCTION get_admin_dashboard_counts()
RETURNS TABLE (
  pending_orders BIGINT,
  pending_appointments BIGINT,
  pending_reviews BIGINT,
  pending_quotes BIGINT,
  low_stock_products BIGINT,
  unread_notifications BIGINT,
  active_vouchers BIGINT,
  today_appointments BIGINT,
  total_products BIGINT,
  total_customers BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Pedidos pendientes
    (SELECT COUNT(*) FROM orders WHERE status = 'pending')::BIGINT AS pending_orders,

    -- Turnos pendientes (no confirmados ni completados)
    (SELECT COUNT(*) FROM appointments WHERE status = 'pending')::BIGINT AS pending_appointments,

    -- Reviews pendientes de aprobación
    (SELECT COUNT(*) FROM reviews WHERE is_approved = FALSE)::BIGINT AS pending_reviews,

    -- Cotizaciones pendientes
    (SELECT COUNT(*) FROM quotes WHERE status = 'pending')::BIGINT AS pending_quotes,

    -- Productos con stock bajo (menos de min_stock_alert)
    (SELECT COUNT(*) FROM products
     WHERE stock_quantity <= min_stock_alert
     AND status = 'active')::BIGINT AS low_stock_products,

    -- Notificaciones no leídas
    (SELECT COUNT(*) FROM admin_notifications
     WHERE is_read = FALSE
     AND is_dismissed = FALSE
     AND (expires_at IS NULL OR expires_at > NOW()))::BIGINT AS unread_notifications,

    -- Vouchers activos
    (SELECT COUNT(*) FROM vouchers WHERE status = 'active')::BIGINT AS active_vouchers,

    -- Turnos de hoy
    (SELECT COUNT(*) FROM appointments
     WHERE preferred_date = CURRENT_DATE
     AND status IN ('pending', 'confirmed'))::BIGINT AS today_appointments,

    -- Total de productos activos
    (SELECT COUNT(*) FROM products WHERE status = 'active')::BIGINT AS total_products,

    -- Total de clientes únicos (por email de orders)
    (SELECT COUNT(DISTINCT customer_email) FROM orders)::BIGINT AS total_customers;
END;
$$;

-- ============================================
-- 4. HELPER FUNCTION: create_admin_notification
-- ============================================
CREATE OR REPLACE FUNCTION create_admin_notification(
  p_type notification_type,
  p_title TEXT,
  p_message TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_priority notification_priority DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO admin_notifications (
    type, title, message, reference_type, reference_id,
    priority, action_url, metadata
  ) VALUES (
    p_type, p_title, p_message, p_reference_type, p_reference_id,
    p_priority, p_action_url, p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- 5.1 Trigger for new orders
CREATE OR REPLACE FUNCTION trigger_notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_admin_notification(
    'new_order'::notification_type,
    'Nuevo pedido recibido',
    format('Pedido de %s por $%s', NEW.customer_name, NEW.total),
    'order',
    NEW.id,
    'high'::notification_priority,
    format('/admin/orders/%s', NEW.id),
    jsonb_build_object(
      'customer_email', NEW.customer_email,
      'customer_phone', NEW.customer_phone,
      'total', NEW.total
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_order ON orders;
CREATE TRIGGER on_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_new_order();

-- 5.2 Trigger for new appointments
CREATE OR REPLACE FUNCTION trigger_notify_new_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_admin_notification(
    'new_appointment'::notification_type,
    'Nuevo turno solicitado',
    format('%s - %s para %s', NEW.service_type, NEW.preferred_date, NEW.customer_name),
    'appointment',
    NEW.id,
    'high'::notification_priority,
    format('/admin/appointments/%s', NEW.id),
    jsonb_build_object(
      'customer_phone', NEW.customer_phone,
      'service_type', NEW.service_type,
      'preferred_date', NEW.preferred_date,
      'preferred_time', NEW.preferred_time
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_appointment ON appointments;
CREATE TRIGGER on_new_appointment
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_new_appointment();

-- 5.3 Trigger for new reviews
CREATE OR REPLACE FUNCTION trigger_notify_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_admin_notification(
    'new_review'::notification_type,
    'Nueva reseña para moderar',
    format('%s dejó una reseña de %s estrellas', NEW.customer_name, NEW.rating),
    'review',
    NEW.id,
    CASE WHEN NEW.rating <= 2 THEN 'urgent'::notification_priority ELSE 'medium'::notification_priority END,
    format('/admin/reviews/%s', NEW.id),
    jsonb_build_object(
      'rating', NEW.rating,
      'product_id', NEW.product_id
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_review ON reviews;
CREATE TRIGGER on_new_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_new_review();

-- 5.4 Trigger for new quotes
CREATE OR REPLACE FUNCTION trigger_notify_new_quote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_admin_notification(
    'new_quote'::notification_type,
    'Nueva cotización recibida',
    format('Cotización de %s por $%s', NEW.customer_name, NEW.total),
    'quote',
    NEW.id,
    'medium'::notification_priority,
    format('/admin/quotes/%s', NEW.id),
    jsonb_build_object(
      'customer_phone', NEW.customer_phone,
      'total', NEW.total
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_quote ON quotes;
CREATE TRIGGER on_new_quote
  AFTER INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_new_quote();

-- 5.5 Trigger for low stock (on product update)
CREATE OR REPLACE FUNCTION trigger_notify_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify if stock just went below threshold
  IF NEW.stock_quantity <= NEW.min_stock_alert
     AND (OLD.stock_quantity > OLD.min_stock_alert OR OLD.stock_quantity IS NULL)
     AND NEW.status = 'active' THEN
    PERFORM create_admin_notification(
      'low_stock'::notification_type,
      'Stock bajo',
      format('%s tiene solo %s unidades', NEW.name, NEW.stock_quantity),
      'product',
      NEW.id,
      CASE WHEN NEW.stock_quantity = 0 THEN 'urgent'::notification_priority ELSE 'high'::notification_priority END,
      format('/admin/products/%s', NEW.id),
      jsonb_build_object(
        'sku', NEW.sku,
        'current_stock', NEW.stock_quantity,
        'min_stock', NEW.min_stock_alert
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_low_stock ON products;
CREATE TRIGGER on_low_stock
  AFTER UPDATE OF stock_quantity ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_low_stock();

-- 5.6 Trigger for order cancellation
CREATE OR REPLACE FUNCTION trigger_notify_order_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    PERFORM create_admin_notification(
      'order_cancelled'::notification_type,
      'Pedido cancelado',
      format('El pedido de %s fue cancelado', NEW.customer_name),
      'order',
      NEW.id,
      'medium'::notification_priority,
      format('/admin/orders/%s', NEW.id),
      jsonb_build_object(
        'total', NEW.total,
        'previous_status', OLD.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_cancelled ON orders;
CREATE TRIGGER on_order_cancelled
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_order_cancelled();

-- 5.7 Trigger for voucher redemption
CREATE OR REPLACE FUNCTION trigger_notify_voucher_redeemed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'redeemed' AND OLD.status != 'redeemed' THEN
    PERFORM create_admin_notification(
      'voucher_redeemed'::notification_type,
      'Voucher canjeado',
      format('El voucher %s fue canjeado por %s', NEW.code, NEW.customer_name),
      'voucher',
      NEW.id,
      'low'::notification_priority,
      format('/admin/vouchers/%s', NEW.id),
      jsonb_build_object(
        'code', NEW.code,
        'discount_amount', NEW.discount_amount
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_voucher_redeemed ON vouchers;
CREATE TRIGGER on_voucher_redeemed
  AFTER UPDATE OF status ON vouchers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_voucher_redeemed();

-- ============================================
-- 6. UTILITY FUNCTIONS
-- ============================================

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_notifications
  SET is_read = TRUE, read_at = NOW(), read_by = p_user_id
  WHERE id = p_notification_id AND is_read = FALSE;

  RETURN FOUND;
END;
$$;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE admin_notifications
  SET is_read = TRUE, read_at = NOW(), read_by = p_user_id
  WHERE is_read = FALSE AND is_dismissed = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Dismiss notification
CREATE OR REPLACE FUNCTION dismiss_notification(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_notifications
  SET is_dismissed = TRUE, dismissed_at = NOW(), dismissed_by = p_user_id
  WHERE id = p_notification_id AND is_dismissed = FALSE;

  RETURN FOUND;
END;
$$;

-- Clean old notifications (keep last 30 days)
CREATE OR REPLACE FUNCTION clean_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM admin_notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_read = TRUE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================
-- 7. RLS POLICIES
-- ============================================
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can see all notifications
CREATE POLICY "Admins can view notifications" ON admin_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'vendedor')
    )
  );

-- Admins can update notifications (mark as read, dismiss)
CREATE POLICY "Admins can update notifications" ON admin_notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'vendedor')
    )
  );

-- System can insert notifications (via triggers)
CREATE POLICY "System can insert notifications" ON admin_notifications
  FOR INSERT
  WITH CHECK (TRUE);

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON TYPE notification_type TO authenticated;
GRANT USAGE ON TYPE notification_priority TO authenticated;
GRANT SELECT, UPDATE ON admin_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION dismiss_notification(UUID, UUID) TO authenticated;

-- ============================================
-- Done!
-- ============================================
COMMENT ON TABLE admin_notifications IS 'Notificaciones del sistema para el panel de administración';
COMMENT ON FUNCTION get_admin_dashboard_counts() IS 'Retorna contadores para el dashboard de admin';
