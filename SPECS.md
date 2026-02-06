# 📋 SPECS - Especificaciones de Features

> **🧠 ORCHESTRATOR** escribe aquí. Los demás agentes leen y ejecutan.
> **Última actualización**: 2026-02-06

---

## 🎯 Feature Actual: Mejoras UX en Admin Chats

### Descripción
Mejorar la experiencia de usuario en `/admin/chats`:
1. Barra de escritura siempre visible
2. Alerta para pausar bot al intentar escribir
3. Eliminar scroll molesto del layout
4. Eliminar header para ganar espacio

### Archivo Principal
- `src/app/admin/chats/page.tsx` (682 líneas) - Owner: 🛠️ ADMIN

---

## 📌 Tareas por Agente

| Agente | Tarea | Dependencias | Estado |
|--------|-------|--------------|--------|
| 🛠️ ADMIN | Implementar 4 mejoras de UX en chats/page.tsx | - | ⏳ Pendiente |
| 🧪 QA | Verificar type-check, build y funcionamiento | ADMIN | ⏳ Pendiente |

---

## 🛠️ ADMIN - INSTRUCCIONES DETALLADAS

### Archivo: `src/app/admin/chats/page.tsx`

### Cambio 1: Eliminar Header (líneas ~332-341)

**ELIMINAR** este bloque completo:
```tsx
{/* Header - Fixed height */}
<div className="pb-4 flex-shrink-0">
  <h1 className="text-3xl font-bold mb-2 text-white flex items-center gap-3">
    <MessageCircle className="h-8 w-8 text-[#d97757]" />
    Chats WhatsApp
  </h1>
  <p className="text-gray-400">
    Conversaciones de WhatsApp y configuración de IA
  </p>
</div>
```

### Cambio 2: Eliminar Scroll del Layout (línea ~331)

**ANTES**:
```tsx
<div className="h-full w-full flex flex-col p-6 overflow-hidden">
```

**DESPUÉS** (reducir padding y asegurar no scroll):
```tsx
<div className="h-full w-full flex flex-col p-4 overflow-hidden">
```

### Cambio 3: Input Siempre Visible + Alerta Bot

**ANTES** (líneas ~624-656) - Input solo cuando pausado:
```tsx
{/* Message Input (only when paused) */}
{selectedConversation.is_paused && (
  <div className="p-4 border-t border-[#3a3a37] bg-[#262624]">
    ...
  </div>
)}
```

**DESPUÉS** - Input siempre visible con lógica de alerta:

```tsx
{/* Message Input - Always visible */}
<div className="p-4 border-t border-[#3a3a37] bg-[#262624] flex-shrink-0">
  <div className="flex gap-2">
    <Textarea
      placeholder={selectedConversation.is_paused ? "Escribe un mensaje..." : "Escribe para tomar control del chat..."}
      value={messageInput}
      onChange={(e) => setMessageInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleSendWithBotCheck()
        }
      }}
      className="flex-1 bg-[#1a1a18] border-[#3a3a37] text-gray-100 min-h-[60px] resize-none"
    />
    <Button
      onClick={handleSendWithBotCheck}
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
    {selectedConversation.is_paused
      ? "Presiona Enter para enviar. Shift+Enter para nueva línea."
      : "El bot está activo. Al enviar, se pausará automáticamente."
    }
  </p>
</div>
```

### Cambio 4: Agregar función handleSendWithBotCheck

**AGREGAR** después de `handleSendMessage` (después de línea ~203):

```tsx
// Send message with bot check
const handleSendWithBotCheck = async () => {
  if (!selectedConversation || !messageInput.trim()) return

  // If bot is active, ask to pause first
  if (!selectedConversation.is_paused) {
    const confirmPause = window.confirm(
      '¿Desea pausar el bot para contestar usted?\n\nAl confirmar, el bot dejará de responder automáticamente y usted tomará el control de la conversación.'
    )

    if (!confirmPause) return

    // Pause the bot first
    try {
      const response = await fetch(`/api/admin/whatsapp/conversations/${selectedConversation.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paused_by: 'admin',
          reason: 'Human takeover to send message'
        })
      })

      if (response.ok) {
        setSelectedConversation(prev => prev ? { ...prev, is_paused: true } : prev)
        fetchConversations()
      } else {
        alert('Error al pausar el bot')
        return
      }
    } catch (error) {
      console.error('Error pausing conversation:', error)
      alert('Error al pausar el bot')
      return
    }
  }

  // Now send the message
  await handleSendMessage()
}
```

### Resumen de Cambios

1. ❌ Eliminar header "Chats WhatsApp..." (líneas 332-341)
2. ✏️ Reducir padding de p-6 a p-4 (línea 331)
3. ➕ Agregar función `handleSendWithBotCheck` (después de línea 203)
4. ✏️ Reemplazar input condicional por input siempre visible (líneas 624-656)

### Al terminar 🛠️ ADMIN:
1. Probar que el input aparece siempre
2. Probar que al escribir con bot activo sale la alerta
3. Probar que no hay scroll en el layout general
4. Verificar que el header ya no aparece
5. Actualizar STATUS.md → `🛠️ ADMIN: ✅ Done`

---

## 🧪 QA - INSTRUCCIONES

1. Ejecutar `npm run type-check`
2. Ejecutar `npm run lint`
3. Ejecutar `npm run build`
4. Verificar funcionalmente en http://localhost:6001/admin/chats:
   - [ ] No aparece header "Chats WhatsApp"
   - [ ] No hay scroll en el layout general
   - [ ] Input de mensaje siempre visible
   - [ ] Al escribir con bot activo → aparece alerta
   - [ ] Al confirmar alerta → bot se pausa y mensaje se envía
   - [ ] Al cancelar alerta → no pasa nada
5. Actualizar STATUS.md → `🧪 QA: ✅ Done`

---

## ✅ Criterios de Aceptación

- [ ] Header eliminado (más espacio)
- [ ] Sin scroll en layout general
- [ ] Input siempre visible cuando hay conversación
- [ ] Alerta funciona al escribir con bot activo
- [ ] `npm run type-check` sin errores
- [ ] `npm run build` compila OK

---

## 📝 Historial de Features

### ⏳ Mejoras UX en Admin Chats (2026-02-06)
Input siempre visible, alerta bot, eliminar scroll y header.

### ✅ Fix Scroll en Admin Chats (2026-02-06)
Corregir scroll en lista de usuarios y conversaciones.

### ✅ Sistema de Notificaciones y Mensajes Admin (2026-02-06)
Implementar notificaciones y mensajes reales en AdminLayout.
