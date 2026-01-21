# Sistema de Configuración de IA - Documentación

## 📋 Resumen

Sistema completo de configuración dinámica para el bot de WhatsApp, permitiendo editar prompts, funciones, modelos y parámetros sin reiniciar el servidor.

## ✨ Características Implementadas

### 1. **Infraestructura Backend**
- ✅ Sistema de caché multi-nivel con TTL configurable
- ✅ Servicio de configuración con fallback chain (Cache → DB → Last Known Good → Default)
- ✅ Tipos TypeScript completos para todas las configuraciones
- ✅ Validadores Zod con detección de prompt injection
- ✅ Tablas de auditoría y backups automáticos

### 2. **APIs Admin**
- ✅ `GET/POST /api/admin/settings/ai/models` - Configuración de modelos OpenAI
- ✅ `GET/POST /api/admin/settings/ai/prompts` - System prompts
- ✅ `POST /api/admin/settings/ai/prompts/test` - Probar prompt con OpenAI
- ✅ `GET/POST /api/admin/settings/ai/function-tools` - Function calling tools
- ✅ `POST /api/admin/settings/ai/function-tools/test` - Probar función con OpenAI
- ✅ `GET/POST /api/admin/settings/ai/whatsapp-bot` - Config bot WhatsApp
- ✅ `POST /api/admin/settings/ai/invalidate` - Invalidar caché
- ✅ `GET /api/admin/settings/ai/health` - Health check

### 3. **Dynamic Loading**
- ✅ `getWhatsAppSystemPromptDynamic()` - Carga dinámica de system prompt
- ✅ `getWhatsAppToolsDynamic()` - Carga dinámica de function tools
- ✅ Mantiene compatibilidad con exports estáticos (fallback)
- ✅ Hot reload sin reinicio de servidor

### 4. **UI Admin Completa**
- ✅ Tabs en `/admin/chats` (Conversaciones | Configuración IA)
- ✅ Sección de Prompts del Sistema con testing inline
- ✅ Sección de Function Calling con editor JSON
- ✅ Sección de Modelos y Parámetros con sliders
- ✅ Sección de Config Bot con horarios laborales
- ✅ Indicadores de cambios sin guardar
- ✅ Validación en tiempo real

### 5. **Seguridad y Auditoría**
- ✅ Autenticación de admin requerida
- ✅ Validación con Zod schemas
- ✅ Detección de prompt injection
- ✅ Audit log con usuario y timestamp
- ✅ Backups automáticos antes de cambios
- ✅ RLS policies en Supabase

## 🗂️ Estructura de Archivos

```
src/
├── lib/
│   ├── ai/
│   │   ├── config-types.ts          # Tipos TypeScript
│   │   ├── config-service.ts        # Servicio principal
│   │   └── config-validators.ts     # Validadores Zod
│   ├── config/
│   │   └── cache.ts                 # Sistema de caché
│   └── whatsapp/ai/
│       ├── tools.ts                 # Function tools (modificado)
│       └── function-handler.ts      # Handler (modificado)
├── app/api/admin/settings/ai/
│   ├── models/route.ts
│   ├── prompts/route.ts
│   ├── prompts/test/route.ts
│   ├── function-tools/route.ts
│   ├── function-tools/test/route.ts
│   ├── whatsapp-bot/route.ts
│   ├── invalidate/route.ts
│   └── health/route.ts
├── components/admin/
│   ├── JsonEditor.tsx
│   └── ai-config/
│       ├── AIConfigPanel.tsx
│       ├── PromptsSection.tsx
│       ├── FunctionToolsSection.tsx
│       ├── ModelsSection.tsx
│       └── BotConfigSection.tsx
└── app/admin/chats/page.tsx         # Página modificada con tabs

supabase/migrations/
└── 20260121_ai_config_settings.sql   # Migration

scripts/
└── test-ai-config.sh                 # Script de testing
```

## 🚀 Cómo Usar

### Acceder al Panel de Configuración

1. Navega a `/admin/chats`
2. Click en el tab **"Configuración IA"**
3. Selecciona la sección que quieres editar

### Editar System Prompt

1. Ve a la sección "Prompts del Sistema"
2. Edita el texto del prompt
3. Usa el tester inline para probar con OpenAI
4. Click "Guardar Prompts"
5. Los cambios se aplican inmediatamente (sin reiniciar servidor)

### Configurar Function Tools

1. Ve a la sección "Function Calling"
2. Expande la función que quieres editar
3. Activa/desactiva con el switch
4. Edita el JSON schema en el editor
5. Prueba la función con un mensaje de test
6. Click "Guardar Funciones"

### Ajustar Modelos y Parámetros

1. Ve a la sección "Modelos y Parámetros"
2. Selecciona el modelo (GPT-4o, GPT-4o-mini, etc.)
3. Ajusta temperature, max tokens, penalties
4. Click "Guardar Configuración"

### Configurar Bot WhatsApp

1. Ve a la sección "Config Bot WhatsApp"
2. Activa/desactiva el bot
3. Configura horarios laborales por día
4. Edita mensajes predefinidos
5. Ajusta límites y timeouts
6. Click "Guardar Configuración"

## 🔧 Configuraciones Disponibles

### AI Models Config
```typescript
{
  chatModel: string            // Modelo principal (ej: 'gpt-4o-mini')
  fastModel: string            // Modelo rápido
  temperature: number          // 0-2 (creatividad)
  maxTokens: number            // Límite de tokens
  topP: number                 // 0-1 (diversidad)
  frequencyPenalty: number     // -2 a 2 (anti-repetición)
  presencePenalty: number      // -2 a 2 (temas nuevos)
}
```

### WhatsApp Bot Config
```typescript
{
  isActive: boolean                    // Bot activo
  maintenanceMode: boolean             // Modo mantenimiento
  welcomeMessage: string               // Mensaje de bienvenida
  errorMessage: string                 // Mensaje de error
  maintenanceMessage: string           // Mensaje de mantenimiento
  respectBusinessHours: boolean        // Respetar horarios
  businessHours: {                     // Horarios por día
    [day]: { start, end, enabled }
  }
  maxMessagesPerConversation: number   // Límite de mensajes
  aiResponseTimeout: number            // Timeout en segundos
  enableQueueAlerts: boolean           // Alertas de cola
  enableErrorAlerts: boolean           // Alertas de errores
}
```

### AI Prompts Config
```typescript
{
  whatsappSystemPrompt: string    // Prompt principal WhatsApp
  productPrompt: string           // Prompt de productos
  salesPrompt: string             // Prompt de ventas
  technicalPrompt: string         // Prompt técnico
  faqPrompt: string              // Prompt de FAQ
}
```

### Function Tools Config
```typescript
{
  tools: [
    {
      name: string               // Nombre de la función
      description: string        // Descripción
      enabled: boolean           // Activa/desactiva
      parameters: {              // JSON Schema
        type: 'object',
        properties: {...},
        required: [...]
      }
    }
  ]
}
```

## 🔄 Sistema de Caché

### TTLs Configurados
- System Prompt: **30 segundos** (cambios frecuentes en testing)
- Function Tools: **2 minutos** (críticos pero estables)
- Bot Config: **5 minutos** (horarios, mensajes)
- AI Prompts: **5 minutos**
- Models Config: **10 minutos** (raramente cambian)

### Invalidación Manual
```bash
# Invalidar caché específico
curl -X POST http://localhost:6001/api/admin/settings/ai/invalidate \
  -H "Content-Type: application/json" \
  -d '{"key": "ai_prompts_config"}'

# Invalidar todo el caché
curl -X POST http://localhost:6001/api/admin/settings/ai/invalidate \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:6001/api/admin/settings/ai/health
```

### Test Script
```bash
./scripts/test-ai-config.sh
```

### Testing Manual
1. Editar configuración en UI
2. Guardar cambios
3. Enviar mensaje de WhatsApp
4. Verificar que usa nueva configuración
5. Sin necesidad de reiniciar servidor

## 🔒 Seguridad

### Autenticación
- Todos los endpoints requieren `requireAdminAuth()`
- Solo usuarios con role='admin' pueden acceder

### Validación
- Zod schemas validan todos los inputs
- Detección de prompt injection patterns
- Validación de JSON schemas para function tools

### Auditoría
- Tabla `config_audit_log` registra todos los cambios
- Usuario, timestamp, valor anterior y nuevo
- Tabla `config_backups` para rollback

### RLS Policies
```sql
-- Solo admins pueden ver audit log
CREATE POLICY "Admins can view audit log"
  ON config_audit_log FOR SELECT
  USING (auth.role() = 'admin');

-- Sistema puede insertar logs
CREATE POLICY "System can insert audit log"
  ON config_audit_log FOR INSERT
  WITH CHECK (true);
```

## 📊 Monitoreo

### Métricas de Caché
```typescript
const metrics = getCacheMetrics()
// {
//   hits: number,
//   misses: number,
//   fallbacks: number,
//   errors: number,
//   hitRate: string,
//   cacheSize: number
// }
```

### Health Check Response
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "cache": {
    "status": "ok" | "error",
    "metrics": {...}
  },
  "database": {
    "status": "ok" | "error"
  },
  "configs": {
    "AI Models": { "status": "ok", "source": "cache" },
    ...
  }
}
```

## 🐛 Troubleshooting

### Configuración no se aplica
1. Verificar que se guardó: revisar `app_settings` en Supabase
2. Invalidar caché manualmente
3. Verificar logs del servidor

### Error al guardar
1. Verificar validación Zod en consola
2. Revisar permisos de admin
3. Verificar conexión a Supabase

### Cache hit rate bajo
1. Verificar TTLs en `cache.ts`
2. Revisar frecuencia de cambios
3. Considerar ajustar TTLs

## 🔮 Próximas Mejoras

- [ ] Rollback automático si error rate >10%
- [ ] Versionado de configuraciones
- [ ] Diff viewer entre versiones
- [ ] Importar/exportar configuraciones
- [ ] A/B testing de prompts
- [ ] Métricas de efectividad de configuraciones

## 📚 Referencias

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [JSON Schema](https://json-schema.org/)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
