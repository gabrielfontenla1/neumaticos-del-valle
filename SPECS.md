# 📋 SPECS - Especificaciones de Features

> **🧠 ORCHESTRATOR** escribe aquí. Los demás agentes leen y ejecutan.
> **Última actualización**: 2026-02-06

---

## 🎯 Feature Actual: Fix Estructura Tabs en Admin Chats

### Descripción
Arreglar la estructura de Tabs rota en `/admin/chats`. El panel de chat (mensajes) está fuera de TabsContent, causando que al hacer click en una conversación no se vea correctamente.

### Archivo Principal
- `src/app/admin/chats/page.tsx` - Owner: 🛠️ ADMIN

---

## 📌 Tareas por Agente

| Agente | Tarea | Dependencias | Estado |
|--------|-------|--------------|--------|
| 🛠️ ADMIN | Reestructurar Tabs para incluir chat view dentro de TabsContent | - | ⏳ Pendiente |
| 🧪 QA | Verificar que funciona y build OK | ADMIN | ⏳ Pendiente |

---

## 🛠️ ADMIN - INSTRUCCIONES DETALLADAS

### Archivo: `src/app/admin/chats/page.tsx`

### Problema Actual (ROTO)

```
<Tabs>                                    ← Línea 294
  <div> (Panel Izquierdo)                 ← Línea 296
    <TabsList>                            ← Línea 299
    <TabsContent "conversations">         ← Línea 321 (solo lista)
    <TabsContent "ai-config">             ← Línea 406
  </div>
  <div> (Panel Derecho - Chat View)       ← Línea 412 ❌ FUERA DE TABS!
</Tabs>
```

El panel derecho está FUERA de TabsContent, entonces siempre se muestra.

### Solución: Nueva Estructura

```
<div> (Container principal)
  <Tabs>
    <TabsContent "conversations">
      <div> (Grid de 2 columnas)
        <div> (Lista de chats)
        <div> (Chat view / mensajes)
      </div>
    </TabsContent>
    <TabsContent "ai-config">
      <AIConfigPanel />
    </TabsContent>
  </Tabs>
</div>
```

### Código Completo Corregido

Reemplazar TODO el return (desde línea 292 hasta 593) con:

```tsx
return (
  <div className="h-full w-full flex flex-col overflow-hidden bg-[#111b21]">
    <Tabs defaultValue="conversations" className="flex-1 flex flex-col min-h-0">
      {/* Header with Tabs */}
      <div className="h-12 px-3 flex items-center bg-[#202c33] border-b border-[#2a3942] flex-shrink-0">
        <TabsList className="bg-transparent h-9 p-0 gap-1">
          <TabsTrigger
            value="conversations"
            className="h-8 px-4 text-sm text-[#8696a0] data-[state=active]:bg-[#2a3942] data-[state=active]:text-[#00a884] rounded"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chats
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

      {/* Conversations Tab - Contains BOTH panels */}
      <TabsContent value="conversations" className="flex-1 flex min-h-0 mt-0 data-[state=inactive]:hidden">
        {/* Left Panel - Chat List */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[320px] bg-[#111b21] border-r border-[#2a3942] flex-shrink-0`}>
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
          <div className="flex gap-2 px-3 py-2 border-b border-[#2a3942]">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'active', label: 'Bot Activo' },
              { id: 'paused', label: 'Pausados' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === tab.id
                    ? 'bg-[#00a884] text-[#111b21]'
                    : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
                    <div className="w-12 h-12 rounded-full bg-[#6b7c85] flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-[#cfd9df]" />
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
                      <div className="flex items-center gap-1">
                        {conv.is_paused ? (
                          <Pause className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        ) : (
                          <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb] flex-shrink-0" />
                        )}
                        <span className="text-sm text-[#8696a0] truncate">
                          {getLastMessagePreview(conv)}
                        </span>
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

                <div className="w-10 h-10 rounded-full bg-[#6b7c85] flex items-center justify-center">
                  <User className="h-5 w-5 text-[#cfd9df]" />
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
                      onClick={handlePauseConversation}
                      disabled={isPausing}
                      size="sm"
                      variant="outline"
                      className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 h-8"
                    >
                      <Pause className="h-3.5 w-3.5 mr-1" />
                      Tomar Control
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
                  <Input
                    placeholder={selectedConversation.is_paused ? "Escribe un mensaje" : "Pausá el bot para escribir..."}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && selectedConversation.is_paused) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={!selectedConversation.is_paused}
                    className="bg-[#2a3942] border-0 text-[#e9edef] placeholder:text-[#8696a0] rounded-lg h-10 focus-visible:ring-0 disabled:opacity-50"
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !messageInput.trim() || !selectedConversation.is_paused}
                  size="icon"
                  className="bg-[#00a884] hover:bg-[#02906f] text-white h-10 w-10 rounded-full disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </Button>
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
      </TabsContent>

      {/* AI Config Tab */}
      <TabsContent value="ai-config" className="flex-1 mt-0 overflow-auto min-h-0 data-[state=inactive]:hidden bg-[#111b21]">
        <AIConfigPanel />
      </TabsContent>
    </Tabs>
  </div>
)
```

### Imports necesarios (verificar que estén)

Asegurarse de que estos imports existan al inicio del archivo:
- `CheckCheck` de lucide-react (ya debería estar)
- Eliminar imports no usados: `MoreVertical`, `Smile`, `Paperclip`, `Mic`

### Al terminar 🛠️ ADMIN:
1. Verificar que al hacer click en conversación se ve el chat
2. Verificar que al cambiar a "Configuración IA" desaparece el chat
3. Verificar que el scroll funciona en lista y mensajes
4. Actualizar STATUS.md → `🛠️ ADMIN: ✅ Done`

---

## 🧪 QA - INSTRUCCIONES

1. Ejecutar `npm run type-check`
2. Ejecutar `npm run lint`
3. Ejecutar `npm run build`
4. Verificar funcionalmente:
   - [ ] Click en conversación → se ve el chat con mensajes
   - [ ] Click en "Configuración IA" → desaparece el chat, aparece config
   - [ ] Click en "Chats" → vuelve a verse la lista y el chat
   - [ ] Responsive: en mobile se oculta la lista al seleccionar chat
   - [ ] Botón volver (←) funciona en mobile
5. Actualizar STATUS.md → `🧪 QA: ✅ Done`

---

## ✅ Criterios de Aceptación

- [ ] Click en conversación muestra mensajes correctamente
- [ ] Tabs cambian el contenido correctamente
- [ ] Diseño WhatsApp mantenido
- [ ] Responsive funciona
- [ ] `npm run build` compila OK
