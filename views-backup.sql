-- ============================================================================
-- BACKUP DE VIEWS - Para recrear después de migración ENUM
-- ============================================================================

-- View: active_conversations_by_provider
CREATE OR REPLACE VIEW public.active_conversations_by_provider AS
 SELECT provider,
    count(*) AS total,
    count(*) FILTER (WHERE (status = 'active'::text)) AS active,
    count(*) FILTER (WHERE (status = 'escalated'::text)) AS escalated,
    count(*) FILTER (WHERE (last_user_message_at > (now() - '24:00:00'::interval))) AS within_24h
   FROM kommo_conversations
  GROUP BY provider;

-- View: available_products
CREATE OR REPLACE VIEW public.available_products AS
 SELECT id,
    name,
    brand,
    model,
    category,
    size,
    width,
    profile,
    diameter,
    load_index,
    speed_rating,
    description,
    price,
    stock,
    image_url,
    features,
    created_at,
    updated_at
   FROM products
  WHERE (stock > 0);

-- View: kommo_active_conversations
CREATE OR REPLACE VIEW public.kommo_active_conversations AS
 SELECT id,
    kommo_chat_id,
    kommo_contact_id,
    kommo_lead_id,
    phone,
    contact_name,
    contact_email,
    status,
    message_count,
    bot_message_count,
    user_message_count,
    last_message_at,
    last_bot_response_at,
    escalated_at,
    resolved_at,
    escalation_reason,
    assigned_to,
    channel,
    metadata,
    tags,
    created_at,
    updated_at,
    ( SELECT m.content
           FROM kommo_messages m
          WHERE (m.conversation_id = c.id)
          ORDER BY m.created_at DESC
         LIMIT 1) AS last_message_content,
    ( SELECT m.role
           FROM kommo_messages m
          WHERE (m.conversation_id = c.id)
          ORDER BY m.created_at DESC
         LIMIT 1) AS last_message_role
   FROM kommo_conversations c
  WHERE (status = 'active'::text)
  ORDER BY last_message_at DESC;

-- View: kommo_conversation_stats
CREATE OR REPLACE VIEW public.kommo_conversation_stats AS
 SELECT date_trunc('day'::text, created_at) AS date,
    channel,
    status,
    count(*) AS conversation_count,
    sum(message_count) AS total_messages,
    sum(bot_message_count) AS bot_messages,
    sum(user_message_count) AS user_messages,
    avg(message_count) AS avg_messages_per_conversation
   FROM kommo_conversations
  GROUP BY (date_trunc('day'::text, created_at)), channel, status
  ORDER BY (date_trunc('day'::text, created_at)) DESC;

-- View: today_appointments
CREATE OR REPLACE VIEW public.today_appointments AS
 SELECT id,
    customer_name,
    customer_email,
    customer_phone,
    service_type AS service,
    appointment_date,
    appointment_time,
    branch,
    vehicle_info,
    notes,
    status,
    created_at,
    updated_at
   FROM appointments
  WHERE ((appointment_date = CURRENT_DATE) AND ((status)::text <> 'cancelled'::text))
  ORDER BY appointment_time;

-- View: whatsapp_appointments
CREATE OR REPLACE VIEW public.whatsapp_appointments AS
 SELECT a.id,
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
   FROM (((appointments a
     LEFT JOIN stores s ON ((a.store_id = s.id)))
     LEFT JOIN appointment_services srv ON ((a.service_id = srv.id)))
     LEFT JOIN kommo_conversations c ON ((a.kommo_conversation_id = c.id)))
  WHERE (a.source = 'whatsapp'::text)
  ORDER BY a.appointment_date DESC, a.appointment_time DESC;

