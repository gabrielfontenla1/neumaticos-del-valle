'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Message } from '@/types/ai';
import { v4 as uuidv4 } from 'uuid';

export default function IAPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: '👋 ¡Hola! Soy tu asistente de Neumáticos del Valle.\n\n¿En qué puedo ayudarte?\n• Buscar neumáticos por medida\n• Consultar precios y stock\n• Asesoramiento técnico',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create new message for assistant
    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to fetch');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = accumulatedContent;
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.';
          }
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const suggestedQuestions = [
    "¿Qué neumáticos tienen para un Volkswagen Gol?",
    "Necesito 4 neumáticos 185/60R14",
    "¿Cuál es la diferencia entre Bridgestone y Pirelli?",
    "¿Tienen ofertas en neumáticos 205/55R16?",
  ];

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-white">Asistente IA</h1>
        <p className="text-gray-400">
          Chatea con nuestro asistente inteligente para encontrar los neumáticos perfectos
        </p>
      </div>

      <Card className="flex-1 flex flex-col bg-[#262624] border-[#3a3a37] shadow-xl">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-6 bg-[#1a1a18]">
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-[#d97757] text-white'
                        : 'bg-[#3a3a37] text-gray-300'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[600px] ${
                      message.role === 'user'
                        ? 'bg-[#d97757] text-white shadow-lg'
                        : 'bg-[#2a2a28] text-gray-100 border border-[#3a3a37]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {message.content.split('\n').map((line, index) => {
                        // Check if line contains a link
                        if (line.includes('https://')) {
                          const parts = line.split(/(https:\/\/[^\s]+)/);
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
                                      className="text-[#d97757] underline hover:text-[#ff9966] transition-colors"
                                    >
                                      {part}
                                    </a>
                                  );
                                }
                                return <span key={partIndex}>{part}</span>;
                              })}
                            </p>
                          );
                        }
                        return <p key={index}>{line}</p>;
                      })}
                    </div>
                    {message.role === 'assistant' && message.content === '' && (
                      <Loader2 className="h-4 w-4 animate-spin text-[#d97757]" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {messages.length === 1 && (
          <div className="p-6 border-t border-[#3a3a37] bg-[#1f1f1d]">
            <p className="text-sm text-gray-400 mb-3 font-medium">
              Preguntas sugeridas:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(question)}
                  className="text-xs bg-[#2a2a28] border-[#3a3a37] text-gray-300 hover:bg-[#3a3a37] hover:text-white hover:border-[#d97757] transition-all"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 border-t border-[#3a3a37] bg-[#1f1f1d]">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta aquí..."
              disabled={isLoading}
              className="flex-1 bg-[#2a2a28] border-[#3a3a37] text-gray-100 placeholder:text-gray-500 focus:border-[#d97757] focus:ring-1 focus:ring-[#d97757]"
            />
            {isLoading ? (
              <Button
                type="button"
                onClick={stopGeneration}
                variant="destructive"
                size="icon"
                className="bg-red-600 hover:bg-red-700"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim()}
                size="icon"
                className="bg-[#d97757] hover:bg-[#c56645] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}