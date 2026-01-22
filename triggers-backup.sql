-- ============================================================================
-- BACKUP DE TRIGGERS - Para recrear después de migración ENUM
-- ============================================================================

-- Trigger: app_settings.trigger_app_settings_updated_at
CREATE TRIGGER trigger_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION update_app_settings_updated_at();

-- Trigger: appointments.trigger_verify_appointment_availability
CREATE TRIGGER trigger_verify_appointment_availability BEFORE INSERT OR UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION verify_appointment_availability();

-- Trigger: appointments.update_appointments_updated_at
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: branch_stock.branch_stock_updated
CREATE TRIGGER branch_stock_updated BEFORE UPDATE ON public.branch_stock FOR EACH ROW EXECUTE FUNCTION update_branch_stock_timestamp();

-- Trigger: kommo_conversations.trigger_update_kommo_conversation_updated_at
CREATE TRIGGER trigger_update_kommo_conversation_updated_at BEFORE UPDATE ON public.kommo_conversations FOR EACH ROW EXECUTE FUNCTION update_kommo_conversation_updated_at();

-- Trigger: kommo_messages.trigger_update_kommo_message_counts
CREATE TRIGGER trigger_update_kommo_message_counts AFTER INSERT ON public.kommo_messages FOR EACH ROW EXECUTE FUNCTION update_kommo_message_counts();

-- Trigger: kommo_messages.trigger_update_last_user_message
CREATE TRIGGER trigger_update_last_user_message AFTER INSERT ON public.kommo_messages FOR EACH ROW EXECUTE FUNCTION update_last_user_message_timestamp();

-- Trigger: orders.order_payment_change_trigger
CREATE TRIGGER order_payment_change_trigger AFTER UPDATE ON public.orders FOR EACH ROW WHEN (((old.payment_status)::text IS DISTINCT FROM (new.payment_status)::text)) EXECUTE FUNCTION log_order_payment_change();

-- Trigger: orders.order_status_change_trigger
CREATE TRIGGER order_status_change_trigger AFTER UPDATE ON public.orders FOR EACH ROW WHEN (((old.status)::text IS DISTINCT FROM (new.status)::text)) EXECUTE FUNCTION log_order_status_change();

-- Trigger: orders.orders_updated_at_trigger
CREATE TRIGGER orders_updated_at_trigger BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_orders_updated_at();

-- Trigger: products.update_products_updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: service_vouchers.update_service_vouchers_updated_at
CREATE TRIGGER update_service_vouchers_updated_at BEFORE UPDATE ON public.service_vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: stores.ensure_single_main_branch
CREATE TRIGGER ensure_single_main_branch BEFORE INSERT OR UPDATE ON public.stores FOR EACH ROW WHEN ((new.is_main = true)) EXECUTE FUNCTION enforce_single_main_branch();

-- Trigger: whatsapp_messages.trigger_update_whatsapp_conversation_stats
CREATE TRIGGER trigger_update_whatsapp_conversation_stats AFTER INSERT ON public.whatsapp_messages FOR EACH ROW EXECUTE FUNCTION update_whatsapp_conversation_stats();

