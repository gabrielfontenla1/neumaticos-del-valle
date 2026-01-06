# Twilio WhatsApp Integration Guide

## Database Schema Reference

### Multi-Provider Support

The system now supports three messaging providers:
- `kommo` - Original Kommo integration
- `twilio` - Twilio WhatsApp Business API
- `meta` - Meta (Facebook) WhatsApp Business API

## Key Concepts

### 1. Provider Field
Every conversation and message is tagged with its source provider:

```typescript
interface Conversation {
  provider: 'kommo' | 'twilio' | 'meta'
  // ... other fields
}
```

### 2. 24-Hour Messaging Window
WhatsApp enforces a 24-hour window for proactive messages. The `last_user_message_at` field tracks when the user last sent a message:

```typescript
interface Conversation {
  last_user_message_at: Date | null
  // Automatically updated when user sends a message
}
```

### 3. Provider-Specific Identifiers
- **Kommo**: Uses `kommo_chat_id` (required)
- **Twilio**: Uses `phone` number (kommo_chat_id is null)
- **Meta**: Uses `phone` number (kommo_chat_id is null)

## Common Database Queries

### Find or Create Twilio Conversation

```typescript
// Find existing conversation
const conversation = await supabase
  .from('kommo_conversations')
  .select('*')
  .eq('provider', 'twilio')
  .eq('phone', phoneNumber)
  .single()

// Create new Twilio conversation
const { data, error } = await supabase
  .from('kommo_conversations')
  .insert({
    provider: 'twilio',
    phone: phoneNumber,
    contact_name: contactName,
    status: 'active',
    kommo_chat_id: null // Not required for Twilio
  })
  .select()
  .single()
```

### Check 24-Hour Window Eligibility

```typescript
// Check if we can send a proactive message
const { data } = await supabase
  .from('kommo_conversations')
  .select('last_user_message_at')
  .eq('id', conversationId)
  .single()

const canSendProactive = data?.last_user_message_at
  ? (Date.now() - new Date(data.last_user_message_at).getTime()) < 24 * 60 * 60 * 1000
  : false
```

### Get Conversations by Provider

```typescript
// Get all Twilio conversations
const { data } = await supabase
  .from('kommo_conversations')
  .select('*')
  .eq('provider', 'twilio')
  .eq('status', 'active')
  .order('last_message_at', { ascending: false })
```

### Add Message with Automatic Timestamp Update

```typescript
// When user sends a message, last_user_message_at updates automatically
const { data } = await supabase
  .from('kommo_messages')
  .insert({
    conversation_id: conversationId,
    provider: 'twilio',
    role: 'user', // Triggers automatic timestamp update
    content: messageText,
    message_type: 'text'
  })
```

## Provider Statistics View

### Get Overview of All Providers

```sql
SELECT * FROM active_conversations_by_provider;
```

Returns:
```
provider | total | active | escalated | within_24h
---------|-------|--------|-----------|------------
kommo    |   6   |   6    |     0     |     0
twilio   |   15  |   12   |     2     |     8
meta     |   0   |   0    |     0     |     0
```

## TypeScript Type Definitions

### Updated Types

```typescript
export type MessageProvider = 'kommo' | 'twilio' | 'meta'

export interface KommoConversation {
  id: string
  provider: MessageProvider
  phone: string
  contact_name: string | null
  kommo_chat_id: string | null // Nullable for Twilio/Meta
  status: 'active' | 'escalated' | 'closed'
  last_message_at: string
  last_user_message_at: string | null // New field
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface KommoMessage {
  id: string
  conversation_id: string
  provider: MessageProvider // New field
  role: 'user' | 'assistant' | 'system'
  content: string
  message_type: 'text' | 'image' | 'file' | 'location'
  metadata?: Record<string, any>
  created_at: string
}
```

## Best Practices

### 1. Always Check Provider
When processing messages, always check the provider to use appropriate logic:

```typescript
if (conversation.provider === 'twilio') {
  // Twilio-specific logic
  await sendTwilioMessage(...)
} else if (conversation.provider === 'kommo') {
  // Kommo-specific logic
  await sendKommoMessage(...)
}
```

### 2. Respect 24-Hour Window
Before sending proactive messages via WhatsApp:

```typescript
const canSend = await checkWhatsApp24HourWindow(conversationId)
if (!canSend) {
  // Queue for later or use template message
  await queueTemplateMessage(conversationId, templateId)
}
```

### 3. Use Indexes for Performance
The migration created indexes for common query patterns:
- Provider + phone lookups (Twilio)
- Provider + status queries
- Provider filtering

Always include provider in your WHERE clauses for optimal performance.

### 4. Monitor Provider Statistics
Regularly check the view for insights:

```typescript
const stats = await supabase
  .from('active_conversations_by_provider')
  .select('*')
```

## Migration Compatibility

### Existing Kommo Code
All existing code continues to work without changes:
- Default provider is 'kommo'
- kommo_chat_id still required for Kommo conversations
- All existing relationships preserved

### Adding Twilio Support
To add Twilio support to existing endpoints:

1. Add provider parameter to conversation creation
2. Check provider before sending messages
3. Use phone number as identifier for Twilio
4. Respect 24-hour window for proactive messages

## Example: Complete Twilio Message Flow

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

async function handleTwilioWebhook(req: Request) {
  const { From, Body } = await req.json()
  const phone = From.replace('whatsapp:', '')

  // 1. Find or create conversation
  let { data: conversation } = await supabase
    .from('kommo_conversations')
    .select('*')
    .eq('provider', 'twilio')
    .eq('phone', phone)
    .single()

  if (!conversation) {
    const { data } = await supabase
      .from('kommo_conversations')
      .insert({
        provider: 'twilio',
        phone,
        contact_name: phone,
        status: 'active'
      })
      .select()
      .single()

    conversation = data
  }

  // 2. Save user message (auto-updates last_user_message_at)
  await supabase
    .from('kommo_messages')
    .insert({
      conversation_id: conversation.id,
      provider: 'twilio',
      role: 'user',
      content: Body,
      message_type: 'text'
    })

  // 3. Generate AI response
  const aiResponse = await generateAIResponse(conversation.id, Body)

  // 4. Save AI message
  await supabase
    .from('kommo_messages')
    .insert({
      conversation_id: conversation.id,
      provider: 'twilio',
      role: 'assistant',
      content: aiResponse,
      message_type: 'text'
    })

  // 5. Send via Twilio
  await sendTwilioMessage(phone, aiResponse)

  // 6. Update conversation
  await supabase
    .from('kommo_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation.id)

  return Response.json({ success: true })
}
```

## Troubleshooting

### Issue: Provider constraint violation
**Error**: `new row for relation "kommo_conversations" violates check constraint "check_valid_provider"`

**Solution**: Ensure provider is one of: 'kommo', 'twilio', 'meta'

### Issue: Kommo conversation missing chat_id
**Error**: `new row violates check constraint "check_kommo_requires_chat_id"`

**Solution**: Kommo conversations must have kommo_chat_id. For Twilio/Meta, set provider appropriately.

### Issue: Duplicate Twilio conversation
**Error**: `duplicate key value violates unique constraint "idx_twilio_conversation_phone"`

**Solution**: A Twilio conversation already exists for this phone number. Use UPDATE instead of INSERT.

## Additional Resources

- [Twilio WhatsApp API Documentation](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
- [Supabase Documentation](https://supabase.com/docs)
