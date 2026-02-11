'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  MessageCircle,
  User,
  Bot,
  Search,
  ChevronLeft,
  Pause,
  Play,
  Send,
  UserCheck,
  Settings,
  CheckCheck,
  AlertTriangle,
  Sparkles,
  Bell,
  Plus,
  ArrowRightLeft,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams } from 'next/navigation'
import { ChatListSkeleton, ChatMessagesSkeleton } from '@/components/skeletons'
import { AIConfigPanel } from '@/components/admin/ai-config/AIConfigPanel'
import { AIAssistantChat } from '@/components/admin/ai-chat/AIAssistantChat'

// Types
interface Conversation {
  id: string
  phone: string
  contact_name: string | null
  status: 'active' | 'resolved' | 'archived'
  is_paused: boolean
  paused_at: string | null
  paused_by: string | null
  pause_reason: string | null
  message_count: number
  last_message_at: string | null
  created_at: string
  updated_at: string
  source?: 'twilio' | 'baileys' // Which provider the conversation is using
}

interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  sent_by_human: boolean
  sent_by_user_id: string | null
  intent: string | null
  response_time_ms: number | null
  created_at: string
  source?: 'twilio' | 'baileys' // Which provider the message came through
}

// Source badge component - very small indicator
// Twilio: Blue (#6366F1 indigo), Baileys: Teal (#25D9A3)
function SourceBadge({ source }: { source?: 'twilio' | 'baileys' }) {
  // Default to twilio since that's the only working provider
  const displaySource = source || 'twilio'

  return (
    <span
      className={`
        inline-flex items-center gap-0.5 text-[8px] font-medium uppercase tracking-wider
        px-1 py-0.5 rounded
        ${displaySource === 'twilio'
          ? 'bg-[#6366F1]/20 text-[#6366F1]'
          : 'bg-[#25D9A3]/20 text-[#25D9A3]'
        }
      `}
      title={displaySource === 'twilio' ? 'Via Twilio API' : 'Via Baileys (WhatsApp Web)'}
    >
      {displaySource === 'twilio' ? 'T' : 'B'}
    </span>
  )
}

// Supabase client for realtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ChatsPage() {
  const searchParams = useSearchParams()
  const initialTab = useMemo(() => {
    const tab = searchParams.get('tab')
    if (tab === 'ai-assistant' || tab === 'ai-config') return tab
    return 'conversations'
  }, [searchParams])
  const [activeTab, setActiveTab] = useState(initialTab)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [newChatPhone, setNewChatPhone] = useState('')
  const [newChatSource, setNewChatSource] = useState<'twilio' | 'baileys'>('baileys')
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [isSwitchingToBaileys, setIsSwitchingToBaileys] = useState(false)
  const [profilePics, setProfilePics] = useState<Record<string, string | null>>({})
  const fetchedPicIds = useRef<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === 'paused') params.set('is_paused', 'true')
      if (filter === 'alerts') params.set('alerts', 'true')

      const response = await fetch(`/api/admin/whatsapp/conversations?${params}`)
      const data = await response.json()

      if (data.success && data.data) {
        setConversations(data.data)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/admin/whatsapp/conversations/${conversationId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setMessages(data.data.messages || [])
        const { messages: _, ...convData } = data.data
        setSelectedConversation(prev => prev ? { ...prev, ...convData } : prev)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  // Pause conversation
  const handlePauseConversation = async () => {
    if (!selectedConversation) return

    setIsPausing(true)
    try {
      const response = await fetch(`/api/admin/whatsapp/conversations/${selectedConversation.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paused_by: 'admin',
          reason: 'Human takeover from dashboard'
        })
      })

      if (response.ok) {
        setSelectedConversation(prev => prev ? { ...prev, is_paused: true } : prev)
        fetchConversations()
      }
    } catch (error) {
      console.error('Error pausing conversation:', error)
    } finally {
      setIsPausing(false)
    }
  }

  // Resume conversation
  const handleResumeConversation = async () => {
    if (!selectedConversation) return

    setIsPausing(true)
    try {
      const response = await fetch(`/api/admin/whatsapp/conversations/${selectedConversation.id}/pause`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSelectedConversation(prev => prev ? { ...prev, is_paused: false } : prev)
        fetchConversations()
      }
    } catch (error) {
      console.error('Error resuming conversation:', error)
    } finally {
      setIsPausing(false)
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim()) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/admin/whatsapp/conversations/${selectedConversation.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageInput.trim(),
          user_id: 'admin'
        })
      })

      if (response.ok) {
        setMessageInput('')
        fetchMessages(selectedConversation.id)
      } else {
        const errorData = await response.json()
        alert('Error al enviar mensaje: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error al enviar mensaje')
    } finally {
      setIsSending(false)
    }
  }

  // Create new chat
  const handleCreateNewChat = async () => {
    if (!newChatPhone.trim()) return

    setIsCreatingChat(true)
    try {
      const response = await fetch('/api/admin/whatsapp/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: newChatPhone.trim(),
          source: newChatSource
        })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setShowNewChatDialog(false)
        setNewChatPhone('')
        setNewChatSource('baileys')
        await fetchConversations()
        setSelectedConversation(data.data)
      } else {
        alert(data.error || 'Error al crear conversación')
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert('Error al crear conversación')
    } finally {
      setIsCreatingChat(false)
    }
  }

  // Switch conversation from Twilio to Baileys
  const handleSwitchToBaileys = async () => {
    if (!selectedConversation) return

    setIsSwitchingToBaileys(true)
    try {
      const response = await fetch('/api/admin/whatsapp/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedConversation.phone,
          source: 'baileys'
        })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setSelectedConversation(prev => prev ? { ...prev, source: 'baileys' } : prev)
        fetchConversations()
      } else {
        alert(data.error || 'Error al cambiar a Baileys')
      }
    } catch (error) {
      console.error('Error switching to Baileys:', error)
      alert('Error al cambiar a Baileys')
    } finally {
      setIsSwitchingToBaileys(false)
    }
  }

  // Fetch profile pictures for Baileys conversations
  useEffect(() => {
    const toFetch = conversations
      .filter(c => c.source === 'baileys' && !fetchedPicIds.current.has(c.id))
      .slice(0, 10)

    if (toFetch.length === 0) return

    toFetch.forEach(c => {
      fetchedPicIds.current.add(c.id)
      fetch(`/api/admin/whatsapp/conversations/${c.id}/profile-picture`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.url) {
            setProfilePics(prev => ({ ...prev, [c.id]: data.url }))
          }
        })
        .catch(() => {/* silently fail */})
    })
  }, [conversations])

  // Initial load
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation?.id, fetchMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        (payload) => {
          const newMessage = payload.new as Message
          if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
            setMessages(prev => [...prev, newMessage])
          }
          fetchConversations()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whatsapp_conversations' },
        (payload) => {
          const updated = payload.new as Conversation
          setConversations(prev => prev.map(c => c.id === updated.id ? updated : c))
          if (selectedConversation?.id === updated.id) {
            setSelectedConversation(updated)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation?.id, fetchConversations])

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      conv.contact_name?.toLowerCase().includes(search) ||
      conv.phone?.includes(search)
    )
  })

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) {
      return date.toLocaleDateString('es-AR', { weekday: 'long' })
    }
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  // Get last message preview
  const getLastMessagePreview = (conv: Conversation) => {
    // This would ideally come from the API
    return conv.is_paused ? '⏸️ Bot pausado' : `${conv.message_count} mensajes`
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Header with Tabs */}
        <div className="h-12 px-3 flex items-center bg-[#202c33]/80 backdrop-blur-sm border-b border-[#2a3942] flex-shrink-0">
          <TabsList className="bg-transparent h-9 p-0 gap-1">
            <TabsTrigger
              value="conversations"
              className="h-8 px-4 text-sm text-[#8696a0] data-[state=active]:bg-[#2a3942] data-[state=active]:text-[#00a884] rounded"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chats
            </TabsTrigger>
            <TabsTrigger
              value="ai-assistant"
              className="h-8 px-4 text-sm text-[#8696a0] data-[state=active]:bg-[#2a3942] data-[state=active]:text-[#00a884] rounded"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Asistente IA
            </TabsTrigger>
            <TabsTrigger
              value="ai-config"
              className="h-8 px-4 text-sm text-[#8696a0] data-[state=active]:bg-[#2a3942] data-[state=active]:text-[#00a884] rounded"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configuración IA
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Animated Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'conversations' && (
            <motion.div
              key="conversations"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex-1 flex min-h-0"
            >
          {/* Left Panel - Chat List */}
          <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[380px] bg-[#111b21] border-r border-[#2a3942] flex-shrink-0`}>
            {/* Search */}
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
                <Input
                  placeholder="Buscar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 bg-[#202c33] border-0 text-[#e9edef] placeholder:text-[#8696a0] rounded-lg focus-visible:ring-0"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a3942]">
              <div className="flex gap-2 flex-1">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'paused', label: 'Pausados' },
                  { id: 'alerts', label: 'Alertas', icon: Bell },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-full transition-colors ${
                      filter === tab.id
                        ? 'bg-[#00a884] text-[#111b21]'
                        : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
                    }`}
                  >
                    {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowNewChatDialog(true)}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white transition-colors shrink-0"
                title="Nuevo mensaje"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1 min-h-0">
              {isLoading ? (
                <ChatListSkeleton items={5} />
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-[#8696a0]">
                  <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No hay conversaciones</p>
                </div>
              ) : (
                <div>
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-[#202c33] transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-[#2a3942]' : ''
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#6b7c85] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {profilePics[conv.id] ? (
                          <img src={profilePics[conv.id]!} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-[#cfd9df]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-[#e9edef] truncate">
                            {conv.contact_name || conv.phone || 'Sin nombre'}
                          </span>
                          <span className="text-xs text-[#8696a0] flex-shrink-0 ml-2">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 min-w-0">
                            {conv.is_paused ? (
                              <Pause className="h-3 w-3 text-amber-500 flex-shrink-0" />
                            ) : (
                              <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb] flex-shrink-0" />
                            )}
                            <span className="text-sm text-[#8696a0] truncate">
                              {getLastMessagePreview(conv)}
                            </span>
                          </div>
                          <SourceBadge source={conv.source} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel - Chat View */}
          <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-[#0b141a] min-w-0`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="h-14 px-4 flex items-center gap-3 bg-[#202c33] flex-shrink-0">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1 hover:bg-[#2a3942] rounded-full"
                  >
                    <ChevronLeft className="h-5 w-5 text-[#aebac1]" />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-[#6b7c85] flex items-center justify-center overflow-hidden">
                    {profilePics[selectedConversation.id] ? (
                      <img src={profilePics[selectedConversation.id]!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-[#cfd9df]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#e9edef] truncate">
                      {selectedConversation.contact_name || selectedConversation.phone || 'Sin nombre'}
                    </h3>
                    <p className="text-xs text-[#8696a0]">
                      {selectedConversation.is_paused ? 'Control humano activo' : 'Bot activo'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedConversation.source !== 'baileys' && (
                      <Button
                        onClick={handleSwitchToBaileys}
                        disabled={isSwitchingToBaileys}
                        size="sm"
                        className="bg-[#25D9A3]/15 text-[#25D9A3] hover:bg-[#25D9A3]/25 border-0 h-8"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                        {isSwitchingToBaileys ? 'Cambiando...' : 'Usar Baileys'}
                      </Button>
                    )}
                    {selectedConversation.is_paused ? (
                      <Button
                        onClick={handleResumeConversation}
                        disabled={isPausing}
                        size="sm"
                        className="bg-[#00a884] hover:bg-[#02906f] text-white h-8"
                      >
                        <Play className="h-3.5 w-3.5 mr-1" />
                        Activar Bot
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowPauseDialog(true)}
                        disabled={isPausing}
                        size="sm"
                        className="bg-red-500/15 text-red-400 hover:bg-red-500/25 border-0 h-8"
                      >
                        <Pause className="h-3.5 w-3.5 mr-1" />
                        Pausar Bot
                      </Button>
                    )}
                  </div>
                </div>

                {/* Paused Banner */}
                {selectedConversation.is_paused && (
                  <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-center gap-2 text-amber-500 text-xs flex-shrink-0">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Bot pausado - Estás respondiendo manualmente</span>
                  </div>
                )}

                {/* Messages Area */}
                <ScrollArea
                  ref={scrollAreaRef}
                  className="flex-1 min-h-0 px-4 py-2"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundColor: '#0b141a'
                  }}
                >
                  {isLoadingMessages ? (
                    <ChatMessagesSkeleton messages={6} />
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[#8696a0]">
                      <MessageCircle className="h-12 w-12 mb-2 opacity-30" />
                      <p>No hay mensajes</p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-2">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`relative max-w-[65%] px-3 py-2 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-[#005c4b] text-[#e9edef]'
                                : message.sent_by_human
                                  ? 'bg-[#1d4ed8] text-white'
                                  : 'bg-[#202c33] text-[#e9edef]'
                            }`}
                          >
                            {message.sent_by_human && message.role === 'assistant' && (
                              <div className="flex items-center gap-1 text-xs text-blue-300 mb-1">
                                <UserCheck className="h-3 w-3" />
                                <span>Admin</span>
                              </div>
                            )}
                            {!message.sent_by_human && message.role === 'assistant' && (
                              <div className="flex items-center gap-1 text-xs text-[#00a884] mb-1">
                                <Bot className="h-3 w-3" />
                                <span>Bot</span>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {message.content}
                            </p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              message.role === 'user' ? 'text-[#ffffff99]' : 'text-[#8696a0]'
                            }`}>
                              <span className="text-[10px]">{formatMessageTime(message.created_at)}</span>
                              {message.role === 'user' && (
                                <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="px-4 py-3 bg-[#202c33] flex items-center gap-2 flex-shrink-0">
                  <div className="flex-1 relative">
                    {!selectedConversation.is_paused && (
                      <button
                        type="button"
                        onClick={() => setShowPauseDialog(true)}
                        className="absolute inset-0 z-10 cursor-pointer"
                      />
                    )}
                    <Input
                      placeholder={selectedConversation.is_paused ? "Escribe un mensaje..." : "Pausá el bot para escribir..."}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && selectedConversation.is_paused) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      readOnly={!selectedConversation.is_paused}
                      className={`bg-[#2a3942] border-0 text-[#e9edef] placeholder:text-[#8696a0] rounded-lg h-10 focus-visible:ring-0 ${
                        !selectedConversation.is_paused ? 'opacity-50 cursor-pointer' : ''
                      }`}
                    />
                  </div>

                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !messageInput.trim() || !selectedConversation.is_paused}
                    className={`flex items-center justify-center h-10 w-10 rounded-full transition-all shrink-0 ${
                      selectedConversation.is_paused && messageInput.trim()
                        ? 'bg-[#00a884] hover:bg-[#02906f] text-white shadow-lg shadow-[#00a884]/30 scale-100 hover:scale-105'
                        : selectedConversation.is_paused
                          ? 'bg-[#00a884]/40 text-white/50'
                          : 'bg-[#2a3942] text-[#8696a0]'
                    } disabled:cursor-not-allowed`}
                  >
                    <Send className="h-4 w-4 ml-0.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#8696a0] bg-[#222e35]">
                <div className="w-48 h-48 mb-6 rounded-full bg-[#2a3942] flex items-center justify-center">
                  <MessageCircle className="h-24 w-24 text-[#364147]" />
                </div>
                <h2 className="text-2xl font-light text-[#e9edef] mb-2">WhatsApp Admin</h2>
                <p className="text-sm text-center max-w-sm">
                  Selecciona una conversación para ver los mensajes
                </p>
              </div>
            )}
          </div>
            </motion.div>
          )}

          {activeTab === 'ai-assistant' && (
            <motion.div
              key="ai-assistant"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex-1 min-h-0"
            >
              <AIAssistantChat />
            </motion.div>
          )}

          {activeTab === 'ai-config' && (
            <motion.div
              key="ai-config"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex-1 overflow-auto min-h-0"
            >
              <AIConfigPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>

      {/* Pause Bot Confirmation Dialog */}
      <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <AlertDialogContent className="bg-[#202c33] border-[#2a3942] max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <AlertDialogTitle className="text-[#e9edef]">
                Pausar Bot
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[#8696a0] leading-relaxed">
              Para enviar mensajes manualmente necesitás pausar el bot primero.
              <span className="block mt-2 text-[#aebac1]">
                El bot seguirá leyendo el contexto de la conversación y retomará con normalidad una vez que lo vuelvas a activar.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="bg-[#2a3942] border-[#3b4a54] text-[#e9edef] hover:bg-[#3b4a54] hover:text-[#e9edef]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handlePauseConversation()}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
            >
              <Pause className="h-3.5 w-3.5 mr-1.5" />
              Pausar Bot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="bg-[#202c33] border-[#2a3942] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#e9edef]">Nuevo chat</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            {/* Provider selector */}
            <div>
              <label className="text-sm text-[#8696a0] mb-2 block">
                Enviar vía
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewChatSource('baileys')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newChatSource === 'baileys'
                      ? 'bg-[#25D9A3]/20 text-[#25D9A3] ring-1 ring-[#25D9A3]/50'
                      : 'bg-[#2a3942] text-[#8696a0] hover:bg-[#3b4a54]'
                  }`}
                >
                  <span className="text-xs font-bold">B</span>
                  Baileys
                </button>
                <button
                  type="button"
                  onClick={() => setNewChatSource('twilio')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newChatSource === 'twilio'
                      ? 'bg-[#6366F1]/20 text-[#6366F1] ring-1 ring-[#6366F1]/50'
                      : 'bg-[#2a3942] text-[#8696a0] hover:bg-[#3b4a54]'
                  }`}
                >
                  <span className="text-xs font-bold">T</span>
                  Twilio
                </button>
              </div>
            </div>

            {/* Phone input */}
            <div>
              <label className="text-sm text-[#8696a0] mb-2 block">
                Número de teléfono
              </label>
              <Input
                placeholder={newChatSource === 'baileys' ? '5493835123456' : '549XXXXXXXXXX'}
                value={newChatPhone}
                onChange={(e) => setNewChatPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateNewChat()
                  }
                }}
                className="bg-[#2a3942] border-[#3b4a54] text-[#e9edef] placeholder:text-[#8696a0] focus-visible:ring-[#00a884]"
                autoFocus
              />
              <div className="mt-2 text-xs text-[#8696a0] space-y-1">
                {newChatSource === 'baileys' ? (
                  <>
                    <p className="text-[#25D9A3]/80 font-medium">Formato: solo numeros, sin + ni espacios</p>
                    <p>Ej: <span className="text-[#e9edef] font-mono">5493835123456</span></p>
                    <p className="text-[10px]">549 (Argentina) + cod. area sin 0 + numero sin 15</p>
                  </>
                ) : (
                  <>
                    <p className="text-[#6366F1]/80 font-medium">Formato: solo numeros, sin + ni espacios</p>
                    <p>Ej: <span className="text-[#e9edef] font-mono">5493835123456</span></p>
                    <p className="text-[10px]">549 (Argentina) + cod. area sin 0 + numero sin 15</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowNewChatDialog(false); setNewChatPhone(''); setNewChatSource('baileys') }}
              className="bg-[#2a3942] border-[#3b4a54] text-[#e9edef] hover:bg-[#3b4a54] hover:text-[#e9edef]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateNewChat}
              disabled={isCreatingChat || !newChatPhone.trim()}
              className="bg-[#00a884] hover:bg-[#02906f] text-white"
            >
              {isCreatingChat ? 'Creando...' : 'Iniciar chat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
