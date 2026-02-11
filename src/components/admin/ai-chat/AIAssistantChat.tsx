'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { Message } from '@/types/ai'
import { v4 as uuidv4 } from 'uuid'

const suggestedQuestions = [
  '¿Qué neumáticos tienen para un Volkswagen Gol?',
  'Necesito 4 neumáticos 185/60R14',
  '¿Cuál es la diferencia entre Bridgestone y Pirelli?',
  '¿Tienen ofertas en neumáticos 205/55R16?',
]

export function AIAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content:
        '👋 ¡Hola! Soy tu asistente de Neumáticos del Valle.\n\n¿En qué puedo ayudarte?\n• Buscar neumáticos por medida\n• Consultar precios y stock\n• Asesoramiento técnico',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      )
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error('Failed to fetch')
      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                accumulatedContent += parsed.content
                setMessages((prev) => {
                  const newMessages = [...prev]
                  const lastMessage = newMessages[newMessages.length - 1]
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = accumulatedContent
                  }
                  return newMessages
                })
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Chat error:', error)
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content =
              'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.'
          }
          return newMessages
        })
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  return (
    <div className="h-full flex flex-col p-4">
      <Card className="flex-1 flex flex-col bg-[#111b21] border-[#2a3942] shadow-xl overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-[#005c4b] text-white'
                        : 'bg-[#202c33] text-[#00a884]'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#005c4b] text-[#e9edef]'
                        : 'bg-[#202c33] text-[#e9edef] border border-[#2a3942]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {message.content.split('\n').map((line, index) => {
                        if (line.includes('https://')) {
                          const parts = line.split(/(https:\/\/[^\s]+)/)
                          return (
                            <p key={index}>
                              {parts.map((part, partIndex) => {
                                if (part.startsWith('https://')) {
                                  return (
                                    <a
                                      key={partIndex}
                                      href={part}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#00a884] underline hover:text-[#25d366] transition-colors"
                                    >
                                      {part}
                                    </a>
                                  )
                                }
                                return <span key={partIndex}>{part}</span>
                              })}
                            </p>
                          )
                        }
                        return <p key={index}>{line}</p>
                      })}
                    </div>
                    {message.role === 'assistant' && message.content === '' && (
                      <Loader2 className="h-4 w-4 animate-spin text-[#00a884]" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {messages.length === 1 && (
          <div className="px-4 py-3 border-t border-[#2a3942] bg-[#0b141a]">
            <p className="text-xs text-[#8696a0] mb-2 font-medium">
              Preguntas sugeridas:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(question)}
                  className="text-xs bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:bg-[#2a3942] hover:text-[#e9edef] hover:border-[#00a884] transition-all"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 border-t border-[#2a3942] bg-[#202c33]"
        >
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta aquí..."
              disabled={isLoading}
              className="flex-1 bg-[#2a3942] border-0 text-[#e9edef] placeholder:text-[#8696a0] focus-visible:ring-0 h-10 rounded-lg"
            />
            {isLoading ? (
              <Button
                type="button"
                onClick={stopGeneration}
                variant="destructive"
                size="icon"
                className="bg-red-600 hover:bg-red-700 h-10 w-10"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={`flex items-center justify-center h-10 w-10 rounded-full transition-all shrink-0 ${
                  input.trim()
                    ? 'bg-[#00a884] hover:bg-[#02906f] text-white shadow-lg shadow-[#00a884]/30'
                    : 'bg-[#00a884]/40 text-white/50'
                } disabled:cursor-not-allowed`}
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}
