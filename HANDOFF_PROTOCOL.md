# 🔄 HANDOFF_PROTOCOL - Comunicación Entre Agentes

> Protocolos y templates para coordinación efectiva entre los 6 agentes.
> **Última actualización**: Febrero 2026

---

## 📋 Protocolo de Inicio de Sesión

**Cada agente DEBE hacer esto al comenzar:**

```
1. ✅ Leer CLAUDE.md (contexto del proyecto)
2. ✅ Leer AGENT_TERRITORIES.md (mi territorio)
3. ✅ Leer SPECS.md (tareas actuales)
4. ✅ Leer STATUS.md (estado de otros agentes)
5. ✅ Leer INTERFACES.md (contratos disponibles)
6. ✅ Verificar git status (cambios recientes)
```

---

## 🎯 Flujos de Handoff

### 1. Usuario → ORCHESTRATOR → Agentes

```
┌──────────┐     ┌─────────────┐     ┌───────────┐
│ Usuario  │────▶│ ORCHESTRATOR│────▶│ SPECS.md  │
└──────────┘     └─────────────┘     └───────────┘
                                           │
                 ┌─────────────────────────┼─────────────────────────┐
                 ▼                         ▼                         ▼
           ┌───────────┐            ┌───────────┐            ┌───────────┐
           │ Agente 1  │            │ Agente 2  │            │ Agente N  │
           └───────────┘            └───────────┘            └───────────┘
                 │                         │                         │
                 └─────────────────────────┼─────────────────────────┘
                                           ▼
                                    ┌───────────┐
                                    │ STATUS.md │
                                    └───────────┘
```

---

## 📝 Templates de Handoff

### Template 1: ORCHESTRATOR asigna tarea

**En SPECS.md:**
```markdown
## 🎯 Feature: [Nombre de la Feature]

### Descripción
[Qué se necesita lograr - claro y conciso]

### Tareas por Agente

#### 🎨 UI
- [ ] [Tarea específica 1]
- [ ] [Tarea específica 2]
**Entrega**: Componente en `src/components/[nombre]/`

#### 📱 PAGES
- [ ] [Tarea específica 1]
- [ ] [Tarea específica 2]
**Depende de**: UI (componentes), API (endpoints)
**Entrega**: Página en `src/app/[ruta]/`

#### 🔧 ADMIN
- [ ] [Tarea específica 1]
**Depende de**: API (endpoints)
**Entrega**: Página admin en `src/app/admin/[ruta]/`

#### ⚙️ API
- [ ] [Tarea específica 1]
- [ ] [Tarea específica 2]
**Entrega**: Documentar en INTERFACES.md

#### 🔌 SERVICES
- [ ] [Tarea específica 1]
**Entrega**: Export en `src/lib/[servicio]/`

### Orden de Ejecución
1. ⚙️ API + 🔌 SERVICES (paralelo)
2. 🎨 UI (cuando API documenta interfaces)
3. 📱 PAGES + 🔧 ADMIN (cuando UI tiene componentes)

### Criterios de Aceptación
- [ ] [Criterio 1]
- [ ] [Criterio 2]
- [ ] Tests pasan
- [ ] Type-check OK
```

---

### Template 2: API notifica endpoint listo

**En INTERFACES.md:**
```markdown
## [NUEVO] POST /api/[ruta]

**Agregado por**: ⚙️ API
**Fecha**: YYYY-MM-DD
**Estado**: ✅ Listo para usar

### Request
```typescript
// Body
interface RequestBody {
  campo1: string
  campo2: number
  campoOpcional?: boolean
}

// Headers
Authorization: Bearer <token>  // si aplica
Content-Type: application/json
```

### Response

**Success (200)**
```typescript
interface SuccessResponse {
  success: true
  data: {
    id: string
    // otros campos
  }
}
```

**Error (400/401/500)**
```typescript
interface ErrorResponse {
  success: false
  error: string
  code?: string
}
```

### Ejemplo de uso
```typescript
const response = await fetch('/api/[ruta]', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ campo1: 'valor', campo2: 123 })
})
const data = await response.json()
```

### Notas
- [Cualquier consideración especial]
```

**En STATUS.md:**
```markdown
| ⚙️ API | 🟢 Completado | [fecha] | Endpoint POST /api/[ruta] documentado en INTERFACES.md |
```

---

### Template 3: UI entrega componente a PAGES

**En INTERFACES.md (sección Components):**
```markdown
## [NUEVO] Componente: ProductCard

**Creado por**: 🎨 UI
**Fecha**: YYYY-MM-DD
**Ubicación**: `src/components/products/ProductCard.tsx`

### Props
```typescript
interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    image?: string
  }
  onAddToCart?: (id: string) => void
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}
```

### Uso
```tsx
import { ProductCard } from '@/components/products/ProductCard'

<ProductCard
  product={product}
  onAddToCart={handleAddToCart}
  variant="compact"
/>
```

### Variantes
- `default`: Card estándar con imagen, nombre, precio
- `compact`: Solo nombre y precio, sin imagen
- `detailed`: Incluye descripción y badge de stock

### Dependencias
- shadcn/ui: Card, Button
- lucide-react: ShoppingCart icon
```

**En STATUS.md:**
```markdown
| 🎨 UI | 🟢 Completado | [fecha] | ProductCard listo, documentado en INTERFACES.md |
```

---

### Template 4: PAGES pide endpoint a API

**En SPECS.md (agregar en sección de la feature actual):**
```markdown
### 📨 Solicitud: PAGES → API

**De**: 📱 PAGES
**Para**: ⚙️ API
**Fecha**: YYYY-MM-DD
**Prioridad**: Alta/Media/Baja

#### Necesito endpoint para:
[Descripción de qué necesita]

#### Propuesta de contrato:
```typescript
// Request
POST /api/[sugerencia-ruta]
Body: {
  campo1: tipo
  campo2: tipo
}

// Response esperado
{
  data: { ... }
}
```

#### Contexto:
- Se usará en: `src/app/[página]/`
- Caso de uso: [descripción]
```

**En STATUS.md:**
```markdown
| 📱 PAGES | 🟡 Bloqueado | [fecha] | Esperando endpoint de API (ver SPECS.md) |
```

---

### Template 5: Cualquier agente reporta bug

**En ISSUES.md:**
```markdown
## 🐛 [AGENTE] Descripción corta del bug

**Reportado por**: [emoji agente]
**Fecha**: YYYY-MM-DD
**Prioridad**: 🔴 Alta / 🟠 Media / 🟡 Baja
**Estado**: 🆕 Nuevo / 🔍 Investigando / 🔧 En progreso / ✅ Resuelto

### Ubicación
- **Archivo**: `src/path/to/file.tsx`
- **Línea**: ~XX (aproximada)
- **Función/Componente**: `nombreFuncion`

### Descripción
**Comportamiento actual**:
[Qué pasa]

**Comportamiento esperado**:
[Qué debería pasar]

### Pasos para reproducir
1. [Paso 1]
2. [Paso 2]
3. [Resultado]

### Contexto adicional
- Browser/Node version:
- Errores en consola:
```
[pegar errores si los hay]
```

### Propuesta de solución (opcional)
[Si tenés idea de cómo arreglarlo]

### Owner sugerido
[Qué agente debería arreglarlo según AGENT_TERRITORIES.md]
```

---

### Template 6: Bloqueo entre agentes

**En STATUS.md:**
```markdown
## 🚫 BLOQUEO ACTIVO

**Agente bloqueado**: [emoji + nombre]
**Bloqueado por**: [emoji + nombre]
**Fecha inicio**: YYYY-MM-DD HH:MM

### Descripción
[Qué necesita el agente bloqueado]

### Acción requerida
[Qué debe hacer el otro agente]

### Workaround temporal (si existe)
[Alternativa mientras se resuelve]
```

---

## 🔔 Notificaciones

### Cuándo actualizar STATUS.md

| Evento | Qué escribir |
|--------|--------------|
| Empiezo tarea | Estado: 🔵 Trabajando, Nota: "Trabajando en [qué]" |
| Termino tarea | Estado: 🟢 Completado, Nota: "Terminé [qué], ver [dónde]" |
| Me bloqueo | Estado: 🔴 Bloqueado, Nota: "Esperando [qué] de [quién]" |
| Disponible | Estado: 🟡 Idle, Nota: "Listo para próxima tarea" |

### Cuándo actualizar INTERFACES.md

| Evento | Acción |
|--------|--------|
| Creo endpoint nuevo | Documentar con template completo |
| Modifico endpoint existente | Actualizar docs + agregar nota de cambio |
| Creo componente reutilizable | Documentar props y uso |
| Depreco algo | Marcar como deprecated con fecha de remoción |

---

## ⚡ Quick Reference

### Necesito un endpoint
```
1. Escribir solicitud en SPECS.md (Template 4)
2. Actualizar mi estado a 🔴 Bloqueado en STATUS.md
3. Esperar que API documente en INTERFACES.md
4. Actualizar mi estado a 🔵 Trabajando
```

### Terminé mi tarea
```
1. Documentar en INTERFACES.md si creé algo público
2. Actualizar STATUS.md a 🟢 Completado
3. Notificar dependientes en SPECS.md si aplica
```

### Encontré un bug
```
1. Documentar en ISSUES.md (Template 5)
2. Mencionar en STATUS.md si me bloquea
3. Continuar con otra tarea si es posible
```

### No sé quién es el owner
```
1. Consultar AGENT_TERRITORIES.md
2. Si sigue ambiguo, preguntar a ORCHESTRATOR
3. ORCHESTRATOR decide y actualiza SPECS.md
```

---

## 🚨 Reglas Críticas

1. **NUNCA** editar código de otro agente sin coordinación
2. **SIEMPRE** documentar interfaces públicas
3. **SIEMPRE** actualizar STATUS.md al cambiar de estado
4. **NUNCA** asumir que un endpoint existe - verificar INTERFACES.md
5. **SIEMPRE** leer archivos de coordinación al inicio de sesión
