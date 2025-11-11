# 🤖 Plan de Implementación del Agente IA - Neumáticos del Valle

## 📋 Resumen Ejecutivo
Implementación de un sistema de IA multi-agente integrado en el dashboard para atención al cliente, usando GPT-4 (Opus) con capacidades de respuesta en tiempo real, conocimiento del catálogo de productos y aprendizaje continuo.

## 🏗️ Arquitectura del Sistema

### Componentes Principales
```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│  Dashboard → Pestaña IA → Chat Interface                     │
│     ↓              ↓              ↓                          │
│  [Context]    [Streaming]    [History]                       │
└─────────────┬────────────────────────────────────────────────┘
              │
              ↓ WebSocket / API REST
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
├─────────────────────────────────────────────────────────────┤
│  API Routes → Agent Orchestrator → Model Router              │
│      ↓              ↓                  ↓                     │
│  [Validation]  [Context Builder]  [Response Stream]          │
└─────────────┬────────────────────────────────────────────────┘
              │
              ↓ Parallel Processing
┌─────────────────────────────────────────────────────────────┐
│                    AI AGENTS LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Product  │  │   FAQ    │  │  Sales   │  │ Technical│   │
│  │  Agent   │  │  Agent   │  │  Agent   │  │  Agent   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       ↓              ↓             ↓              ↓         │
│  [GPT-4 Opus]  [GPT-3.5]    [GPT-4 Opus]   [GPT-3.5]      │
└─────────────┬────────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  Supabase DB → Products → Embeddings → FAQs → Chat History  │
│  Vector Store → Knowledge Base → Context Cache               │
└───────────────────────────────────────────────────────────────┘
```

## 📁 Estructura de Archivos

```
src/
├── app/
│   ├── dashboard/
│   │   └── ia/
│   │       ├── page.tsx          # Página principal del chat IA
│   │       └── layout.tsx        # Layout específico para IA
│   └── api/
│       └── ai/
│           ├── chat/
│           │   └── route.ts      # Endpoint principal del chat
│           ├── agents/
│           │   ├── product/route.ts
│           │   ├── faq/route.ts
│           │   ├── sales/route.ts
│           │   └── technical/route.ts
│           ├── context/
│           │   └── route.ts      # Construcción de contexto
│           └── embeddings/
│               └── route.ts      # Generación de embeddings
├── components/
│   └── ai/
│       ├── ChatInterface.tsx     # Interfaz de chat principal
│       ├── MessageList.tsx       # Lista de mensajes
│       ├── InputArea.tsx         # Área de entrada con sugerencias
│       ├── AgentIndicator.tsx    # Indicador de agente activo
│       └── TypingIndicator.tsx   # Indicador de escritura
├── lib/
│   └── ai/
│       ├── openai.ts             # Cliente OpenAI configurado
│       ├── agents/
│       │   ├── orchestrator.ts   # Orquestador principal
│       │   ├── productAgent.ts   # Agente de productos
│       │   ├── faqAgent.ts       # Agente de FAQs
│       │   ├── salesAgent.ts     # Agente de ventas
│       │   └── technicalAgent.ts # Agente técnico
│       ├── context/
│       │   ├── builder.ts        # Constructor de contexto
│       │   ├── embeddings.ts     # Manejo de embeddings
│       │   └── retrieval.ts      # RAG implementation
│       └── prompts/
│           ├── system.ts         # Prompts del sistema
│           ├── product.ts        # Prompts de productos
│           └── faq.ts            # Prompts de FAQs
└── types/
    └── ai.ts                     # Tipos TypeScript para IA
```

## 🔄 Flujo de Implementación (Fases)

### FASE 1: Infraestructura Base (2-3 días)
**Parallelizable: ✅**

#### 1.1 Setup OpenAI y Configuración
```typescript
// .env.local
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...
OPENAI_MODEL_CHAT=gpt-4-0125-preview  # Opus equivalent
OPENAI_MODEL_EMBEDDINGS=text-embedding-3-small
OPENAI_MODEL_FAST=gpt-3.5-turbo-0125
```

#### 1.2 Crear Cliente OpenAI
```typescript
// lib/ai/openai.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

export const models = {
  opus: 'gpt-4-0125-preview',     // Para respuestas complejas
  fast: 'gpt-3.5-turbo-0125',     // Para FAQs y respuestas rápidas
  embeddings: 'text-embedding-3-small'
};
```

#### 1.3 Página IA en Dashboard
- Crear nueva ruta `/dashboard/ia`
- Integrar en el menú de navegación
- Setup inicial de la UI

### FASE 2: Sistema de Chat Básico (2-3 días)
**Parallelizable: ❌ (Depende de Fase 1)**

#### 2.1 Interfaz de Chat
- Componente de chat con streaming
- Historial de conversación
- Indicadores de estado

#### 2.2 API de Chat Simple
```typescript
// app/api/ai/chat/route.ts
export async function POST(request: Request) {
  const { messages, context } = await request.json();

  const stream = await openai.chat.completions.create({
    model: models.opus,
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 1000
  });

  // Return SSE stream
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### FASE 3: Sistema de Contexto y Embeddings (3-4 días)
**Parallelizable: ✅**

#### 3.1 Base de Datos para Vectores
```sql
-- Crear tabla de embeddings en Supabase
CREATE TABLE product_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id INTEGER REFERENCES products(id),
  content TEXT,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE faq_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT,
  answer TEXT,
  embedding vector(1536),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3.2 Generador de Embeddings
```typescript
// lib/ai/context/embeddings.ts
export async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: models.embeddings,
    input: text,
  });
  return response.data[0].embedding;
}
```

#### 3.3 Sistema RAG (Retrieval Augmented Generation)
- Búsqueda por similitud vectorial
- Construcción de contexto relevante
- Cache de contextos frecuentes

### FASE 4: Agentes Especializados (4-5 días)
**Parallelizable: ✅ (Entre agentes)**

#### 4.1 Agente de Productos
```typescript
// lib/ai/agents/productAgent.ts
export class ProductAgent {
  async process(query: string) {
    // 1. Buscar productos relevantes
    const products = await searchProducts(query);

    // 2. Construir contexto
    const context = buildProductContext(products);

    // 3. Generar respuesta
    return await generateResponse(query, context, productPrompt);
  }
}
```

#### 4.2 Agente de FAQs
- Respuestas rápidas con GPT-3.5
- Cache de respuestas frecuentes
- Categorización automática

#### 4.3 Agente de Ventas
- Recomendaciones de productos
- Cálculo de equivalencias
- Sugerencias de alternativas

#### 4.4 Agente Técnico
- Especificaciones detalladas
- Compatibilidad de medidas
- Información de instalación

### FASE 5: Orquestador Multi-Agente (2-3 días)
**Parallelizable: ❌ (Depende de Fase 4)**

#### 5.1 Router Inteligente
```typescript
// lib/ai/agents/orchestrator.ts
export class AgentOrchestrator {
  async route(message: string) {
    // 1. Clasificar intención
    const intent = await classifyIntent(message);

    // 2. Seleccionar agente(s)
    const agents = selectAgents(intent);

    // 3. Procesar en paralelo si es posible
    if (agents.length > 1) {
      const responses = await Promise.all(
        agents.map(agent => agent.process(message))
      );
      return mergeResponses(responses);
    }

    return agents[0].process(message);
  }
}
```

### FASE 6: Base de Conocimientos y FAQs (2-3 días)
**Parallelizable: ✅**

#### 6.1 Datos de FAQs
```typescript
const faqs = [
  {
    category: "Medidas y Equivalencias",
    questions: [
      "¿Qué significa 225/45R17?",
      "¿Puedo cambiar de medida de neumático?",
      "¿Cuál es la equivalencia de...?"
    ]
  },
  {
    category: "Marcas y Calidad",
    questions: [
      "¿Qué marca recomiendan?",
      "¿Diferencia entre marcas premium y económicas?",
      "¿Cuánto duran los neumáticos?"
    ]
  },
  // ... más categorías
];
```

#### 6.2 Sistema de Aprendizaje
- Guardar conversaciones útiles
- Feedback del usuario
- Mejora continua de respuestas

### FASE 7: Integración con Kommo (3-4 días)
**Parallelizable: ✅**

#### 7.1 Sincronización de Conversaciones
- Exportar chats a Kommo
- Crear leads automáticamente
- Sincronización bidireccional

#### 7.2 Webhook Handler Mejorado
```typescript
// app/api/kommo/webhook/route.ts
if (body.message?.add) {
  // Procesar con IA
  const aiResponse = await orchestrator.route(message.text);

  // Enviar respuesta a Kommo
  await sendToKommo(aiResponse);

  // Guardar en base de datos
  await saveConversation(message, aiResponse);
}
```

### FASE 8: Testing y Optimización (2-3 días)
**Parallelizable: ✅**

#### 8.1 Suite de Pruebas
```typescript
// tests/ai/responses.test.ts
describe('AI Responses', () => {
  test('Product queries', async () => {
    const response = await agent.process("Necesito 4 neumáticos 225/45R17");
    expect(response).toContain("productos disponibles");
    expect(response).toContain("precio");
  });

  test('Technical queries', async () => {
    const response = await agent.process("¿Qué presión llevan?");
    expect(response).toContain("PSI");
  });
});
```

#### 8.2 Métricas y Analytics
- Tiempo de respuesta
- Satisfacción del usuario
- Queries más frecuentes
- Tasa de conversión

## 🚀 Tareas Paralelas vs Secuenciales

### ✅ Pueden ejecutarse en PARALELO:
1. **Fase 1 + Fase 3**: Infraestructura base + Sistema de embeddings
2. **Todos los agentes de Fase 4**: Cada agente es independiente
3. **Fase 6 + Fase 7**: FAQs + Integración Kommo
4. **Testing de cada componente**: Se puede ir testeando mientras se desarrolla

### ❌ Deben ser SECUENCIALES:
1. **Fase 1 → Fase 2**: El chat necesita la infraestructura
2. **Fase 4 → Fase 5**: El orquestador necesita los agentes
3. **Fase 5 → Fase 8**: Testing final necesita todo integrado

## 📊 Timeline Estimado

```
Semana 1: Fase 1 + Fase 3 (paralelo)
Semana 2: Fase 2 + Inicio Fase 4
Semana 3: Fase 4 (continuación) + Fase 6 (paralelo)
Semana 4: Fase 5 + Fase 7 (paralelo)
Semana 5: Fase 8 + Ajustes finales
```

**Tiempo total estimado: 4-5 semanas**

## 🎯 Próximos Pasos Inmediatos

1. **HOY**:
   - [ ] Configurar OpenAI API
   - [ ] Crear estructura de carpetas
   - [ ] Setup página IA en dashboard

2. **MAÑANA**:
   - [ ] Implementar chat básico con streaming
   - [ ] Crear primeros prompts del sistema
   - [ ] Setup base de datos para embeddings

3. **ESTA SEMANA**:
   - [ ] Primer agente funcional (productos)
   - [ ] Sistema de contexto básico
   - [ ] Pruebas iniciales

## 💡 Consideraciones Técnicas

### Costos de API
- GPT-4: ~$0.03/1K tokens (input) + $0.06/1K (output)
- GPT-3.5: ~$0.001/1K tokens (input) + $0.002/1K (output)
- Embeddings: ~$0.0001/1K tokens

**Estrategia de optimización**:
- Usar GPT-3.5 para FAQs y queries simples
- GPT-4 solo para consultas complejas y ventas
- Cache agresivo de respuestas frecuentes
- Límites de rate y tokens por usuario

### Escalabilidad
- Sistema de colas para requests
- Cache distribuido con Redis
- CDN para assets estáticos
- Auto-scaling basado en carga

### Seguridad
- Validación de inputs
- Rate limiting por IP/usuario
- Sanitización de respuestas
- Logs de auditoría
- Encriptación de datos sensibles

## 🔗 Integraciones Futuras

1. **WhatsApp Business API** (via Kommo)
2. **Instagram DM** (via Kommo)
3. **Email automático**
4. **Voice assistant** (llamadas telefónicas)
5. **Analytics avanzado** con Mixpanel/Amplitude

---

## ¿Listos para empezar? 🚀

Este plan está diseñado para implementación modular y escalable. Podemos comenzar inmediatamente con las fases paralelas para acelerar el desarrollo.