'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageCircle,
  User,
  Bot,
  Phone,
  Clock,
  RefreshCw,
  Search,
  ChevronLeft,
  Pause,
  Play,
  Send,
  UserCheck,
  Settings
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { ChatListSkeleton, ChatMessagesSkeleton } from '@/components/skeletons'
import { AIConfigPanel } from '@/components/admin/ai-config/AIConfigPanel'

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
}

// Supabase client for realtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [pauseFilter, setPauseFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Fetch conversations from new WhatsApp endpoint
  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (pauseFilter !== 'all') params.set('is_paused', pauseFilter === 'paused' ? 'true' : 'false')

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
  }, [statusFilter, pauseFilter])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/admin/whatsapp/conversations/${conversationId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setMessages(data.data.messages || [])
        // Update selected conversation with latest data
        const { messages: _, ...convData } = data.data
        setSelectedConversation(prev => prev ? { ...prev, ...convData } : prev)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  // Pause conversation (human takeover)
  const handlePauseConversation = async () => {
    if (!selectedConversation) return

    setIsPausing(true)
    try {
      const response = await fetch(`/api/admin/whatsapp/conversations/${selectedConversation.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paused_by: 'admin', // TODO: Get actual user ID
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

  // Resume conversation (bot takeover)
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

  // Send message (human intervention)
  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim()) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/admin/whatsapp/conversations/${selectedConversation.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageInput.trim(),
          user_id: 'admin' // TODO: Get actual user ID
        })
      })

      if (response.ok) {
        setMessageInput('')
        // Refresh messages
        fetchMessages(selectedConversation.id)
      } else {
        const errorData = await response.json()
        console.error('Error sending message:', errorData.error)
        alert('Error al enviar mensaje: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error al enviar mensaje')
    } finally {
      setIsSending(false)
    }
  }

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

  // Supabase Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages'
        },
        (payload) => {
          const newMessage = payload.new as Message
          // If this message belongs to the selected conversation, add it
          if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
            setMessages(prev => [...prev, newMessage])
          }
          // Refresh conversation list to update last_message_at
          fetchConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_conversations'
        },
        (payload) => {
          const updated = payload.new as Conversation
          // Update in list
          setConversations(prev =>
            prev.map(c => c.id === updated.id ? updated : c)
          )
          // Update selected if it's the same
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

  // Filter conversations by search term
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      conv.contact_name?.toLowerCase().includes(search) ||
      conv.phone?.includes(search)
    )
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  }

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (conv: Conversation) => {
    if (conv.is_paused) {
      return {
        style: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        label: 'Pausado'
      }
    }
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      resolved: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      archived: 'bg-gray-600/20 text-gray-500 border-gray-600/30'
    }
    const labels: Record<string, string> = {
      active: 'Bot Activo',
      resolved: 'Resuelto',
      archived: 'Archivado'
    }
    return { style: styles[conv.status] || '', label: labels[conv.status] || conv.status }
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold mb-2 text-white flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-[#d97757]" />
          Chats WhatsApp
        </h1>
        <p className="text-gray-400">
          Conversaciones de WhatsApp y configuración de IA
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="conversations" className="flex-1 flex flex-col min-h-0">
        <TabsList className="bg-[#262624] border-[#3a3a37] mb-4">
          <TabsTrigger
            value="conversations"
            className="data-[state=active]:bg-[#d97757] data-[state=active]:text-white"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Conversaciones
          </TabsTrigger>
          <TabsTrigger
            value="ai-config"
            className="data-[state=active]:bg-[#d97757] data-[state=active]:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuración IA
          </TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="flex-1 flex gap-4 min-h-0 mt-0">
        {/* Conversation List */}
        <Card className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 bg-[#262624] border-[#3a3a37]`}>
          {/* Filters */}
          <div className="p-4 border-b border-[#3a3a37] space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-[#1a1a18] border-[#3a3a37] text-gray-100"
              />
            </div>
            <div className="flex gap-2">
              <Select value={pauseFilter} onValueChange={setPauseFilter}>
                <SelectTrigger className="bg-[#1a1a18] border-[#3a3a37] text-gray-100">
                  <SelectValue placeholder="Estado Bot" />
                </SelectTrigger>
                <SelectContent className="bg-[#262624] border-[#3a3a37]">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Bot Activo</SelectItem>
                  <SelectItem value="paused">Pausados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-[#1a1a18] border-[#3a3a37] text-gray-100">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-[#262624] border-[#3a3a37]">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="resolved">Resueltos</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchConversations}
                className="border-[#3a3a37] hover:bg-[#3a3a37]"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <ChatListSkeleton items={5} />
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No hay conversaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-[#3a3a37]">
                {filteredConversations.map((conv) => {
                  const statusBadge = getStatusBadge(conv)
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-[#2a2a28] transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-[#2a2a28] border-l-2 border-[#d97757]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white truncate">
                              {conv.contact_name || 'Sin nombre'}
                            </span>
                            {conv.is_paused && (
                              <Pause className="h-4 w-4 text-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{conv.phone || 'Sin teléfono'}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {conv.message_count} mensajes
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            {formatDate(conv.last_message_at)}
                          </span>
                          <Badge variant="outline" className={`text-xs ${statusBadge.style}`}>
                            {statusBadge.label}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {/* Stats Footer */}
          <div className="p-3 border-t border-[#3a3a37] text-xs text-gray-500">
            {filteredConversations.length} conversaciones
          </div>
        </Card>

        {/* Message View */}
        <Card className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#262624] border-[#3a3a37]`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#3a3a37] flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="w-10 h-10 rounded-full bg-[#d97757] flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">
                    {selectedConversation.contact_name || 'Sin nombre'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="h-3 w-3" />
                    {selectedConversation.phone || 'Sin teléfono'}
                  </div>
                </div>

                {/* Pause/Resume Button */}
                <div className="flex items-center gap-2">
                  {selectedConversation.is_paused ? (
                    <Button
                      onClick={handleResumeConversation}
                      disabled={isPausing}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {isPausing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Activar Bot
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePauseConversation}
                      disabled={isPausing}
                      variant="outline"
                      className="border-amber-500 text-amber-400 hover:bg-amber-500/20"
                    >
                      {isPausing ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Pause className="h-4 w-4 mr-2" />
                      )}
                      Tomar Control
                    </Button>
                  )}
                </div>

                <div className="text-right text-xs text-gray-500">
                  <div>{selectedConversation.message_count} mensajes</div>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    {formatDate(selectedConversation.created_at)}
                  </div>
                </div>
              </div>

              {/* Paused Warning */}
              {selectedConversation.is_paused && (
                <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 text-amber-400 text-sm">
                  <UserCheck className="h-4 w-4" />
                  <span>Bot pausado - Control humano activo. El bot no responderá hasta que actives nuevamente.</span>
                </div>
              )}

              {/* Messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-[#1a1a18]">
                {isLoadingMessages ? (
                  <ChatMessagesSkeleton messages={6} />
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
                    <p>No hay mensajes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`flex gap-3 max-w-[85%] min-w-0 ${
                            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.role === 'user'
                                ? 'bg-[#d97757] text-white'
                                : message.sent_by_human
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-[#3a3a37] text-gray-300'
                            }`}
                          >
                            {message.role === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : message.sent_by_human ? (
                              <UserCheck className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                          <div
                            className={`rounded-lg px-4 py-2 min-w-0 ${
                              message.role === 'user'
                                ? 'bg-[#d97757] text-white'
                                : message.sent_by_human
                                  ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30'
                                  : 'bg-[#2a2a28] text-gray-100 border border-[#3a3a37]'
                            }`}
                          >
                            <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                              {message.content}
                            </div>
                            <div className={`flex items-center gap-2 mt-1 text-xs ${
                              message.role === 'user' ? 'text-white/60' : 'text-gray-500'
                            }`}>
                              <span>{formatFullDate(message.created_at)}</span>
                              {message.sent_by_human && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-400">Humano</span>
                                </>
                              )}
                              {message.response_time_ms && !message.sent_by_human && (
                                <>
                                  <span>•</span>
                                  <span>{message.response_time_ms}ms</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input (only when paused) */}
              {selectedConversation.is_paused && (
                <div className="p-4 border-t border-[#3a3a37] bg-[#262624]">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escribe un mensaje..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      className="flex-1 bg-[#1a1a18] border-[#3a3a37] text-gray-100 min-h-[60px] resize-none"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !messageInput.trim()}
                      className="bg-[#d97757] hover:bg-[#c86646] text-white self-end"
                    >
                      {isSending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Presiona Enter para enviar. Shift+Enter para nueva línea.
                  </p>
                </div>
              )}

              {/* Footer Info */}
              <div className="p-3 border-t border-[#3a3a37] text-xs text-gray-500 flex justify-between">
                <span>Conversación: {selectedConversation.id.slice(0, 8)}...</span>
                <span>WhatsApp via Twilio</span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg">Selecciona una conversación</p>
              <p className="text-sm">para ver los mensajes</p>
            </div>
          )}
        </Card>
        </TabsContent>

        {/* AI Configuration Tab */}
        <TabsContent value="ai-config" className="flex-1 flex flex-col min-h-0 mt-0 h-full overflow-hidden">
          <AIConfigPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
