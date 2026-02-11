-- Add baileys_remote_jid to whatsapp_conversations
-- WhatsApp now uses LID (Linked Identity Device) instead of phone numbers as JID.
-- We need to store the original JID to send messages back correctly.

ALTER TABLE whatsapp_conversations
ADD COLUMN IF NOT EXISTS baileys_remote_jid TEXT;
