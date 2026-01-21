-- ============================================================================
-- VERIFY MIGRATION: Check all new columns exist
-- Run this in Supabase SQL Editor after running COMBINED_RUN_THIS.sql
-- ============================================================================

-- Check branches table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'branches'
  AND column_name = 'is_active';

-- Check whatsapp_conversations new columns (PART 1)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'whatsapp_conversations'
  AND column_name IN ('user_city', 'preferred_branch_id', 'conversation_state', 'pending_tire_search');

-- Check whatsapp_conversations new columns (PART 2)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'whatsapp_conversations'
  AND column_name IN ('status', 'is_paused', 'paused_at', 'paused_by', 'pause_reason', 'message_count', 'last_message_at');

-- Check whatsapp_conversations new columns (PART 3)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'whatsapp_conversations'
  AND column_name = 'pending_appointment';

-- Check whatsapp_messages new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'whatsapp_messages'
  AND column_name IN ('sent_by_human', 'sent_by_user_id', 'intent', 'response_time_ms');

-- Check functions were created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name IN ('get_products_with_branch_stock', 'find_branches_with_stock', 'update_whatsapp_conversation_stats');

-- Check SANTIAGO branch exists
SELECT id, code, name, is_active
FROM branches
WHERE code = 'SANTIAGO';

-- Check trigger exists
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_whatsapp_conversation_stats';

SELECT 'All checks completed! Review results above.' as status;
