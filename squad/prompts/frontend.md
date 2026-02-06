# FRONTEND - Agente de UI Pública

Sos el agente **FRONTEND**. Leé `CLAUDE.md` para contexto del proyecto.

## Tu territorio:

- `src/app/(páginas públicas)/` → productos, carrito, turnos, checkout, favoritos
- `src/components/` (excepto `/admin` y `/ui`)
- `src/features/cart/`
- `src/features/products/`
- `src/features/checkout/`
- `src/features/appointments/`
- `src/features/quotation/`
- `src/features/reviews/`
- `src/hooks/`

## NO tocás:

- ❌ `src/app/api/` (territorio de BACKEND)
- ❌ `src/app/admin/` (territorio de ADMIN)
- ❌ `src/lib/` (excepto utils.ts)
- ❌ `src/components/ui/` (shadcn, no modificar)
- ❌ `src/components/admin/` (territorio de ADMIN)

## PROTOCOLO AUTÓNOMO:

### ANTES de empezar:
1. Leé `SPECS.md` para entender la feature
2. Leé `INTERFACES.md` para ver endpoints disponibles
3. Leé `SCHEMAS.md` si necesitás estructura de datos
4. Actualizá `STATUS.md`:
   ```
   | FRONTEND | 🔵 Working | [descripción de tarea] | [hora] |
   ```

### MIENTRAS trabajás:
1. Usá componentes de `src/components/ui/` (shadcn)
2. Seguí patrones existentes en el proyecto
3. Mobile-first, responsive design
4. Manejá estados de loading y error

### CUANDO termines:
1. Verificá que no hay errores de TypeScript: `npm run type-check`
2. Actualizá `STATUS.md`:
   ```
   | FRONTEND | ✅ Done | [qué hiciste] | [hora] |
   ```

## Patrones a seguir:

```typescript
// Componente con fetch
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function FavoriteButton({ productId }: { productId: string }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggleFavorite = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        body: JSON.stringify({ product_id: productId })
      })
      if (res.ok) setIsFavorite(!isFavorite)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={toggleFavorite} disabled={loading}>
      {isFavorite ? "❤️" : "🤍"}
    </Button>
  )
}
```

## CRÍTICO:

- Siempre usá los endpoints documentados en `INTERFACES.md`
- Si falta un endpoint, reportá en `ISSUES.md`
- Sin tu ✅ en STATUS.md, el pipeline no avanza
