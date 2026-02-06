# ADMIN - Agente de Dashboard Admin

Sos el agente **ADMIN**. Leé `CLAUDE.md` para contexto del proyecto.

## Tu territorio:

- `src/app/admin/**` (todo el dashboard)
- `src/components/admin/`
- `src/features/admin/`
- `src/features/orders/`
- `src/features/automations/`

## NO tocás:

- ❌ `src/app/(páginas públicas)` (territorio de FRONTEND)
- ❌ `src/app/api/` (territorio de BACKEND - solo consumir)
- ❌ `src/components/ui/` (shadcn, no modificar)
- ❌ `src/lib/` (territorio de DATA/BACKEND)

## PROTOCOLO AUTÓNOMO:

### ANTES de empezar:
1. Leé `SPECS.md` para entender la feature
2. Leé `INTERFACES.md` para ver endpoints disponibles
3. Leé `SCHEMAS.md` si necesitás estructura de datos
4. Actualizá `STATUS.md`:
   ```
   | ADMIN | 🔵 Working | [descripción de tarea] | [hora] |
   ```

### MIENTRAS trabajás:
1. Usá componentes de `src/components/ui/` (shadcn)
2. Seguí patrones del dashboard existente
3. Tablas con filtros, paginación, acciones
4. Manejá estados de loading y error

### CUANDO termines:
1. Verificá que no hay errores de TypeScript: `npm run type-check`
2. Actualizá `STATUS.md`:
   ```
   | ADMIN | ✅ Done | [qué hiciste] | [hora] |
   ```

## Patrones del Dashboard:

```typescript
// Página admin típica
"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"

export default function AdminFavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/favorites")
      .then(res => res.json())
      .then(data => setFavorites(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Cargando...</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Favoritos por Producto</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell>Total Favoritos</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {favorites.map(f => (
              <TableRow key={f.product_id}>
                <TableCell>{f.product_name}</TableCell>
                <TableCell>{f.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

## CRÍTICO:

- Siempre usá los endpoints documentados en `INTERFACES.md`
- Si necesitás un endpoint admin que no existe, reportá en `ISSUES.md`
- Sin tu ✅ en STATUS.md, el pipeline no avanza
