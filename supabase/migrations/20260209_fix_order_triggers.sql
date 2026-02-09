-- Migration: Fix order notification triggers
-- Purpose: Use correct column name (total_amount instead of total)
-- Priority: CRITICAL - Blocking all new orders
-- Date: 2026-02-09

-- Fix trigger_notify_new_order
CREATE OR REPLACE FUNCTION trigger_notify_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_admin_notification(
    'new_order'::notification_type,
    'Nuevo pedido recibido',
    format('Pedido de %s por $%s', NEW.customer_name, NEW.total_amount),
    'order',
    NEW.id,
    'high'::notification_priority,
    format('/admin/orders/%s', NEW.id),
    jsonb_build_object(
      'customer_email', NEW.customer_email,
      'customer_phone', NEW.customer_phone,
      'total', NEW.total_amount
    )
  );
  RETURN NEW;
END;
$$;

-- Fix trigger_notify_order_cancelled
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
      format('Pedido %s cancelado - $%s', NEW.order_number, NEW.total_amount),
      'order',
      NEW.id,
      'medium'::notification_priority,
      format('/admin/orders/%s', NEW.id),
      jsonb_build_object(
        'total', NEW.total_amount,
        'previous_status', OLD.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;
