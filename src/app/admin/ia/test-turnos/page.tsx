'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, Calendar, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  intent?: string;
  appointmentCreated?: boolean;
}

export default function TestTurnosPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: 'system',
      content: '🧪 Simulador del flujo de turnos vía WhatsApp\n\nEscribí "turno" o "quiero sacar turno" para comenzar el flujo.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>(`test_conv_${Date.now()}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

    try {
      const response = await fetch('/api/kommo/test-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          messageText: input.trim(),
          senderName: 'Usuario de Prueba',
          senderPhone: '+5491123456789',
        }),
      });

      const result = await response.json();

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: result.responseText || result.error || 'Sin respuesta',
        timestamp: new Date(),
        intent: result.intent,
        appointmentCreated: result.appointmentCreated,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Si se creó un turno, mostrar mensaje de éxito
      if (result.appointmentCreated) {
        const successMessage: Message = {
          id: uuidv4(),
          role: 'system',
          content: `✅ ¡Turno creado exitosamente!\nID: ${result.appointmentId}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setConversationId(`test_conv_${Date.now()}`);
    setMessages([
      {
        id: uuidv4(),
        role: 'system',
        content: '🔄 Conversación reiniciada\n\nEscribí "turno" para comenzar un nuevo flujo.',
        timestamp: new Date(),
      }
    ]);
  };

  const suggestedMessages = [
    "Quiero sacar un turno",
    "1",
    "Alineación",
    "Mañana",
    "10",
    "Sí",
    "Cancelar",
  ];

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white flex items-center gap-3">
            <Calendar className="h-8 w-8 text-[#d97757]" />
            Test: Flujo de Turnos
          </h1>
          <p className="text-gray-400">
            Simula el flujo de reserva de turnos vía WhatsApp
          </p>
        </div>
        <Button
          onClick={resetConversation}
          variant="outline"
          className="bg-[#2a2a28] border-[#3a3a37] text-gray-300 hover:bg-[#3a3a37]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reiniciar
        </Button>
      </div>

      <Card className="flex-1 flex flex-col bg-[#262624] border-[#3a3a37] shadow-xl">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-6 bg-[#1a1a18]">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' :
                  message.role === 'system' ? 'justify-center' : 'justify-start'
                }`}
              >
                {message.role === 'system' ? (
                  <div className="bg-[#3a3a37] text-gray-300 px-4 py-2 rounded-lg text-sm max-w-[80%]">
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                ) : (
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-[#d97757] text-white'
                          : 'bg-green-600 text-white'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-[#d97757] text-white shadow-lg'
                          : 'bg-green-900/50 text-gray-100 border border-green-700'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>
                      {message.intent && (
                        <div className="mt-2 text-xs opacity-70">
                          Intent: {message.intent}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
                <div className="bg-green-900/50 rounded-lg px-4 py-3 border border-green-700">
                  <Loader2 className="h-4 w-4 animate-spin text-green-400" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-[#3a3a37] bg-[#1f1f1d]">
          <p className="text-xs text-gray-500 mb-2">Respuestas rápidas:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestedMessages.map((msg, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInput(msg)}
                className="text-xs bg-[#2a2a28] border-[#3a3a37] text-gray-300 hover:bg-[#3a3a37]"
              >
                {msg}
              </Button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 border-t border-[#3a3a37] bg-[#1f1f1d]">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
              className="flex-1 bg-[#2a2a28] border-[#3a3a37] text-gray-100 placeholder:text-gray-500 focus:border-green-500"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-4 text-xs text-gray-500">
        <p>Conversation ID: {conversationId}</p>
      </div>
    </div>
  );
}
