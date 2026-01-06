-- ============================================================================
-- MIGRACIÓN: Integración de Turnos via WhatsApp
-- Fecha: 2024-12-30
-- Descripción: Extiende appointments para soportar reservas desde WhatsApp bot
-- ============================================================================

-- ============================================================================
-- COLUMNAS ADICIONALES EN APPOINTMENTS
-- ============================================================================

-- Columna source para identificar origen del turno
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'source'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.appointments
    ADD COLUMN source TEXT DEFAULT 'web'
    CHECK (source IN ('web', 'whatsapp', 'phone', 'admin'));
  END IF;
END $$;

-- Columna service_id para referenciar appointment_services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'service_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.appointments
    ADD COLUMN service_id TEXT REFERENCES appointment_services(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Columna para referencia a conversación de Kommo (opcional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'kommo_conversation_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.appointments
    ADD COLUMN kommo_conversation_id UUID REFERENCES kommo_conversations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para filtrar por origen
CREATE INDEX IF NOT EXISTS idx_appointments_source
  ON public.appointments(source);

-- Índice para búsqueda por teléfono y fecha (evitar duplicados)
CREATE INDEX IF NOT EXISTS idx_appointments_phone_date
  ON public.appointments(customer_phone, appointment_date);

-- Índice para conversación de Kommo
CREATE INDEX IF NOT EXISTS idx_appointments_kommo_conversation
  ON public.appointments(kommo_conversation_id);

-- Índice para disponibilidad de slots
CREATE INDEX IF NOT EXISTS idx_appointments_slot_availability
  ON public.appointments(store_id, appointment_date, appointment_time, status);

-- ============================================================================
-- FUNCIÓN: Verificar disponibilidad de slot
-- ============================================================================

CREATE OR REPLACE FUNCTION check_slot_availability(
  p_store_id UUID,
  p_date DATE,
  p_time TIME,
  p_max_per_slot INTEGER DEFAULT 2
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM appointments
  WHERE store_id = p_store_id
    AND appointment_date = p_date
    AND appointment_time = p_time
    AND status NOT IN ('cancelled', 'no_show');

  RETURN current_count < p_max_per_slot;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: Obtener slots disponibles para una fecha
-- ============================================================================

CREATE OR REPLACE FUNCTION get_available_slots(
  p_store_id UUID,
  p_date DATE,
  p_slot_duration_minutes INTEGER DEFAULT 30,
  p_max_per_slot INTEGER DEFAULT 2
)
RETURNS TABLE(
  slot_time TIME,
  available BOOLEAN,
  current_bookings INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH time_slots AS (
    -- Generar slots de 09:00 a 17:30
    SELECT generate_series(
      '09:00:00'::TIME,
      '17:30:00'::TIME,
      (p_slot_duration_minutes || ' minutes')::INTERVAL
    )::TIME AS slot_time
  ),
  booking_counts AS (
    SELECT
      a.appointment_time,
      COUNT(*) as booking_count
    FROM appointments a
    WHERE a.store_id = p_store_id
      AND a.appointment_date = p_date
      AND a.status NOT IN ('cancelled', 'no_show')
    GROUP BY a.appointment_time
  )
  SELECT
    ts.slot_time,
    COALESCE(bc.booking_count, 0) < p_max_per_slot AS available,
    COALESCE(bc.booking_count, 0)::INTEGER AS current_bookings
  FROM time_slots ts
  LEFT JOIN booking_counts bc ON ts.slot_time = bc.appointment_time
  ORDER BY ts.slot_time;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Verificar disponibilidad antes de insertar
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_appointment_availability()
RETURNS TRIGGER AS $$
DECLARE
  slot_count INTEGER;
  max_per_slot INTEGER := 2;
BEGIN
  -- Solo verificar si tiene store_id, fecha y hora
  IF NEW.store_id IS NOT NULL AND NEW.appointment_date IS NOT NULL AND NEW.appointment_time IS NOT NULL THEN
    SELECT COUNT(*) INTO slot_count
    FROM appointments
    WHERE store_id = NEW.store_id
      AND appointment_date = NEW.appointment_date
      AND appointment_time = NEW.appointment_time
      AND status NOT IN ('cancelled', 'no_show')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

    IF slot_count >= max_per_slot THEN
      RAISE EXCEPTION 'El horario seleccionado ya está completo (máximo % turnos por horario)', max_per_slot;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger (drop si existe para evitar duplicados)
DROP TRIGGER IF EXISTS trigger_verify_appointment_availability ON public.appointments;
CREATE TRIGGER trigger_verify_appointment_availability
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION verify_appointment_availability();

-- ============================================================================
-- VISTA: Turnos de WhatsApp
-- ============================================================================

CREATE OR REPLACE VIEW whatsapp_appointments AS
SELECT
  a.id,
  a.customer_name,
  a.customer_phone,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.notes,
  a.created_at,
  s.name AS store_name,
  srv.name AS service_name,
  srv.duration AS service_duration,
  c.contact_name AS whatsapp_contact,
  c.kommo_chat_id
FROM appointments a
LEFT JOIN stores s ON a.store_id = s.id
LEFT JOIN appointment_services srv ON a.service_id = srv.id
LEFT JOIN kommo_conversations c ON a.kommo_conversation_id = c.id
WHERE a.source = 'whatsapp'
ORDER BY a.appointment_date DESC, a.appointment_time DESC;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON COLUMN public.appointments.source IS 'Origen del turno: web, whatsapp, phone, admin';
COMMENT ON COLUMN public.appointments.service_id IS 'Referencia al servicio de appointment_services';
COMMENT ON COLUMN public.appointments.kommo_conversation_id IS 'Referencia a la conversación de WhatsApp/Kommo';
COMMENT ON FUNCTION check_slot_availability IS 'Verifica si un slot está disponible para reserva';
COMMENT ON FUNCTION get_available_slots IS 'Obtiene todos los slots con su disponibilidad para una fecha';
