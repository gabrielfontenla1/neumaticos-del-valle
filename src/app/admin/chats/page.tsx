'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
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
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronLeft
} from 'lucide-react'

interface Conversation {
  id: string
  provider: 'kommo' | 'twilio' | 'meta'
  phone: string | null
  contact_name: string | null
  status: 'active' | 'escalated' | 'resolved'
  message_count: number
  last_message_at: string | null
  escalated_at: string | null
  escalation_reason: string | null
  channel: string
  created_at: string
  lastMessage: {
    content: string
    role: 'user' | 'assistant'
    createdAt: string
  } | null
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  intent: string | null
  ai_model: string | null
  response_time_ms: number | null
  created_at: string
  provider: string
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [providerFilter, setProviderFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch conversations
  const fetchConversations = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (providerFilter !== 'all') params.set('provider', providerFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/admin/conversations?${params}`)
      const data = await response.json()

      if (data.conversations) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/admin/conversations?id=${conversationId}`)
      const data = await response.json()

      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [providerFilter, statusFilter])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Filter conversations by search term
  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      conv.contact_name?.toLowerCase().includes(search) ||
      conv.phone?.includes(search) ||
      conv.lastMessage?.content.toLowerCase().includes(search)
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

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      kommo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      twilio: 'bg-green-500/20 text-green-400 border-green-500/30',
      meta: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    }
    return colors[provider] || 'bg-gray-500/20 text-gray-400'
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      escalated: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      resolved: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    const labels: Record<string, string> = {
      active: 'Activo',
      escalated: 'Escalado',
      resolved: 'Resuelto'
    }
    return { style: styles[status] || '', label: labels[status] || status }
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-white flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-[#d97757]" />
          Chats WhatsApp
        </h1>
        <p className="text-gray-400">
          Visualiza las conversaciones de WhatsApp (Kommo y Twilio)
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
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
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="bg-[#1a1a18] border-[#3a3a37] text-gray-100">
                  <SelectValue placeholder="Proveedor" />
                </SelectTrigger>
                <SelectContent className="bg-[#262624] border-[#3a3a37]">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="kommo">Kommo</SelectItem>
                  <SelectItem value="twilio">Twilio</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-[#1a1a18] border-[#3a3a37] text-gray-100">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-[#262624] border-[#3a3a37]">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="escalated">Escalados</SelectItem>
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
              <div className="flex items-center justify-center h-32 text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Cargando...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
                <p>No hay conversaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-[#3a3a37]">
                {filteredConversations.map((conv) => {
                  const statusBadge = getStatusBadge(conv.status)
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
                            {conv.status === 'escalated' && (
                              <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{conv.phone || 'Sin teléfono'}</span>
                          </div>
                          {conv.lastMessage && (
                            <p className="text-sm text-gray-400 truncate">
                              {conv.lastMessage.role === 'assistant' && '🤖 '}
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            {formatDate(conv.last_message_at)}
                          </span>
                          <div className="flex gap-1">
                            <Badge variant="outline" className={`text-xs ${getProviderBadge(conv.provider)}`}>
                              {conv.provider}
                            </Badge>
                          </div>
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
                    <span className="text-gray-600">•</span>
                    <Badge variant="outline" className={`text-xs ${getProviderBadge(selectedConversation.provider)}`}>
                      {selectedConversation.provider}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>{selectedConversation.message_count} mensajes</div>
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    {formatDate(selectedConversation.created_at)}
                  </div>
                </div>
              </div>

              {/* Escalation Warning */}
              {selectedConversation.status === 'escalated' && (
                <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 text-amber-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Escalado: {selectedConversation.escalation_reason || 'Sin razón especificada'}</span>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-[#1a1a18]">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Cargando mensajes...
                  </div>
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
                          className={`flex gap-3 max-w-[85%] ${
                            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              message.role === 'user'
                                ? 'bg-[#d97757] text-white'
                                : 'bg-[#3a3a37] text-gray-300'
                            }`}
                          >
                            {message.role === 'user' ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </div>
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              message.role === 'user'
                                ? 'bg-[#d97757] text-white'
                                : 'bg-[#2a2a28] text-gray-100 border border-[#3a3a37]'
                            }`}
                          >
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.content}
                            </div>
                            <div className={`flex items-center gap-2 mt-1 text-xs ${
                              message.role === 'user' ? 'text-white/60' : 'text-gray-500'
                            }`}>
                              <span>{formatFullDate(message.created_at)}</span>
                              {message.intent && (
                                <>
                                  <span>•</span>
                                  <span className="italic">{message.intent}</span>
                                </>
                              )}
                              {message.response_time_ms && (
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

              {/* Footer Info */}
              <div className="p-3 border-t border-[#3a3a37] text-xs text-gray-500 flex justify-between">
                <span>Conversación: {selectedConversation.id.slice(0, 8)}...</span>
                <span>Canal: {selectedConversation.channel}</span>
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
      </div>
    </div>
  )
}
