# Database Migration: Twilio WhatsApp Support

## Quick Reference

**Migration File**: `supabase/migrations/20250101_twilio_whatsapp_support.sql`
**Execution Script**: `scripts/execute-twilio-migration.ts`
**Status**: ✅ Successfully Executed (2025-01-01)
**Impact**: Zero downtime, backward compatible

## What Changed

### Database Schema

#### `kommo_conversations` Table
```sql
-- New columns
ALTER TABLE kommo_conversations
  ADD COLUMN provider TEXT NOT NULL DEFAULT 'kommo',
  ADD COLUMN last_user_message_at TIMESTAMPTZ;

-- Modified columns
ALTER TABLE kommo_conversations
  ALTER COLUMN kommo_chat_id DROP NOT NULL;

-- New constraints
CHECK (provider IN ('kommo', 'twilio', 'meta'))
CHECK (provider != 'kommo' OR kommo_chat_id IS NOT NULL)

-- New indexes
CREATE UNIQUE INDEX idx_twilio_conversation_phone
  ON kommo_conversations(provider, phone);
```

#### `kommo_messages` Table
```sql
-- New column
ALTER TABLE kommo_messages
  ADD COLUMN provider TEXT NOT NULL DEFAULT 'kommo';
```

### Automatic Features

#### Trigger: Auto-Update Last User Message
```sql
-- Automatically updates last_user_message_at when user sends message
CREATE TRIGGER trigger_update_last_user_message
  AFTER INSERT ON kommo_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_user_message_timestamp();
```

#### View: Provider Statistics
```sql
-- Real-time statistics by provider
SELECT * FROM active_conversations_by_provider;

-- Returns:
-- provider | total | active | escalated | within_24h
```

## TypeScript Updates

### Updated Types

```typescript
// src/lib/kommo/types.ts

export type MessageProvider = 'kommo' | 'twilio' | 'meta'

export interface Conversation {
  id: string
  provider: MessageProvider        // NEW
  kommo_chat_id: string | null    // Now nullable
  last_user_message_at: Date | null  // NEW
  // ... other fields
}

export interface Message {
  id: string
  provider: MessageProvider        // NEW
  message_type?: 'text' | 'image' | 'file' | 'location'  // NEW
  // ... other fields
}
```

### New Utility Functions

```typescript
// src/lib/kommo/whatsapp-window.ts

// Check if within 24-hour messaging window
const status = await checkWhatsApp24HourWindow(conversationId)

// Get conversations needing template messages
const conversations = await getConversationsNeedingTemplates('twilio')

// Simple boolean check
const canSend = isWithin24HourWindow(lastUserMessageAt)
```

## Usage Examples

### 1. Create Twilio Conversation

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Create Twilio conversation
const { data, error } = await supabase
  .from('kommo_conversations')
  .insert({
    provider: 'twilio',
    phone: '+5493425123456',
    contact_name: 'Juan Pérez',
    status: 'active'
    // kommo_chat_id NOT required for Twilio
  })
  .select()
  .single()
```

### 2. Save User Message (Auto-Updates Timestamp)

```typescript
// User message automatically updates last_user_message_at
await supabase
  .from('kommo_messages')
  .insert({
    conversation_id: conversationId,
    provider: 'twilio',
    role: 'user',  // Triggers timestamp update
    content: 'Hola, necesito información',
    message_type: 'text'
  })
```

### 3. Check 24-Hour Window

```typescript
import { checkWhatsApp24HourWindow } from '@/lib/kommo/whatsapp-window'

const windowStatus = await checkWhatsApp24HourWindow(conversationId)

if (windowStatus.canSendProactive) {
  // Send normal message
  await sendWhatsAppMessage(phone, message)
} else {
  // Must use template message
  await sendWhatsAppTemplate(phone, templateId, params)
}
```

### 4. Get Provider Statistics

```typescript
const { data } = await supabase
  .from('active_conversations_by_provider')
  .select('*')

// Example result:
// [
//   { provider: 'kommo', total: 6, active: 6, escalated: 0, within_24h: 0 },
//   { provider: 'twilio', total: 15, active: 12, escalated: 2, within_24h: 8 }
// ]
```

### 5. Query by Provider

```typescript
// Get all active Twilio conversations
const { data } = await supabase
  .from('kommo_conversations')
  .select('*')
  .eq('provider', 'twilio')
  .eq('status', 'active')
  .order('last_message_at', { ascending: false })
```

## Migration Verification

### Run Verification Script
```bash
npx tsx scripts/execute-twilio-migration.ts
```

### Manual Verification Queries

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('kommo_conversations', 'kommo_messages')
AND column_name IN ('provider', 'last_user_message_at');

-- Verify constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname LIKE '%provider%' OR conname LIKE '%chat_id%';

-- Check trigger is active
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_last_user_message';

-- Test view
SELECT * FROM active_conversations_by_provider;
```

## Rollback Instructions

If you need to rollback this migration:

```bash
# Connect to database
psql $DATABASE_URL

# Run rollback SQL
\i supabase/migrations/rollback_20250101_twilio.sql
```

Rollback script:
```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_update_last_user_message ON kommo_messages;

-- Remove function
DROP FUNCTION IF EXISTS update_last_user_message_timestamp();

-- Remove view
DROP VIEW IF EXISTS active_conversations_by_provider;

-- Remove indexes
DROP INDEX IF EXISTS idx_twilio_conversation_phone;
DROP INDEX IF EXISTS idx_conversations_provider_status;
DROP INDEX IF EXISTS idx_conversations_provider_phone;
DROP INDEX IF EXISTS idx_messages_provider;

-- Remove constraints
ALTER TABLE kommo_conversations DROP CONSTRAINT IF EXISTS check_valid_provider;
ALTER TABLE kommo_conversations DROP CONSTRAINT IF EXISTS check_kommo_requires_chat_id;

-- Remove columns
ALTER TABLE kommo_conversations DROP COLUMN IF EXISTS provider;
ALTER TABLE kommo_conversations DROP COLUMN IF EXISTS last_user_message_at;
ALTER TABLE kommo_messages DROP COLUMN IF EXISTS provider;

-- Restore NOT NULL constraint
-- IMPORTANT: Only run this if there are no NULL values
-- ALTER TABLE kommo_conversations ALTER COLUMN kommo_chat_id SET NOT NULL;
```

## Testing Checklist

- [x] Migration executes without errors
- [x] All new columns created
- [x] Constraints enforced correctly
- [x] Indexes created successfully
- [x] Trigger updates timestamp automatically
- [x] View returns correct statistics
- [x] TypeScript types updated
- [x] Utility functions created
- [x] Documentation complete
- [ ] Twilio webhook endpoint created
- [ ] End-to-end message flow tested
- [ ] 24-hour window validation tested
- [ ] Load testing with concurrent providers

## Next Steps

1. **Create Twilio Integration**
   - [ ] Set up Twilio webhook endpoint
   - [ ] Implement message processor for Twilio
   - [ ] Configure Twilio credentials
   - [ ] Test incoming/outgoing messages

2. **Update Existing Code**
   - [ ] Update conversation queries to filter by provider
   - [ ] Add provider logic to message routing
   - [ ] Implement 24-hour window checks

3. **Monitoring & Alerts**
   - [ ] Set up provider statistics dashboard
   - [ ] Create alerts for window expiration
   - [ ] Monitor message delivery rates

4. **Documentation**
   - [x] Migration summary
   - [x] Integration guide
   - [x] TypeScript types
   - [x] Utility functions
   - [ ] API endpoint documentation
   - [ ] Testing guide

## Support

### Common Issues

**Q: Can I run this migration multiple times?**
A: Yes, it's idempotent. All operations use `IF NOT EXISTS` or `CREATE OR REPLACE`.

**Q: Will existing Kommo conversations break?**
A: No, they automatically get `provider = 'kommo'` and continue working.

**Q: Do I need to update existing queries?**
A: Not immediately. Default values maintain backward compatibility.

**Q: What if I need to add another provider?**
A: Update the `check_valid_provider` constraint to include the new provider.

### Files Reference

- **Migration**: `supabase/migrations/20250101_twilio_whatsapp_support.sql`
- **Execution**: `scripts/execute-twilio-migration.ts`
- **Types**: `src/lib/kommo/types.ts`
- **Utilities**: `src/lib/kommo/whatsapp-window.ts`
- **Summary**: `TWILIO_MIGRATION_SUMMARY.md`
- **Guide**: `docs/TWILIO_INTEGRATION_GUIDE.md`

### Contact

For migration issues or questions:
- Review documentation in `docs/`
- Check `TWILIO_MIGRATION_SUMMARY.md` for details
- Verify with test queries above
