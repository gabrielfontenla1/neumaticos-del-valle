import { NextRequest, NextResponse } from 'next/server'
import { findConversationById } from '@/lib/whatsapp/repository'
import { getProfilePicture } from '@/lib/baileys/client'
import { phoneToJid } from '@/lib/baileys/phone-utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/whatsapp/conversations/[id]/profile-picture
 * Get the WhatsApp profile picture for a conversation's contact
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    const conversation = await findConversationById(id)
    if (!conversation) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Only Baileys conversations can fetch profile pictures
    if (conversation.source !== 'baileys' || !conversation.baileys_instance_id) {
      return NextResponse.json({ success: true, url: null })
    }

    // Build JID from phone (never use stored LID JIDs for profile pic lookup)
    const jid = conversation.baileys_remote_jid && !conversation.baileys_remote_jid.endsWith('@lid')
      ? conversation.baileys_remote_jid
      : phoneToJid(conversation.phone)

    const result = await getProfilePicture(conversation.baileys_instance_id, jid)

    if (!result.success) {
      return NextResponse.json({ success: true, url: null })
    }

    return NextResponse.json({
      success: true,
      url: result.data?.url || null
    })
  } catch (error) {
    console.error('[API] Error getting profile picture:', error)
    return NextResponse.json({ success: true, url: null })
  }
}
