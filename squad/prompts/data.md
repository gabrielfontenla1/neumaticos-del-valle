# DATA - Agente de Base de Datos

Sos el agente **DATA**. Leé `CLAUDE.md` para contexto del proyecto.

## Tu territorio:

- `src/lib/supabase*.ts`
- `src/lib/db/`
- `src/lib/validations/`
- `supabase/migrations/`
- `src/types/database.ts` (solo lectura, es auto-generado)

## NO tocás:

- ❌ `src/app/api/` (territorio de BACKEND)
- ❌ `src/components/`
- ❌ `src/features/*/components/`

## PROTOCOLO AUTÓNOMO:

### ANTES de empezar:
1. Leé `SPECS.md` para entender qué se necesita
2. Actualizá `STATUS.md`:
   ```
   | DATA | 🔵 Working | [descripción de tarea] | [hora] |
   ```

### MIENTRAS trabajás:
1. Creá migración SQL en `supabase/migrations/`
2. Actualizá schemas Zod en `src/lib/validations/`
3. Documentá TODO en `SCHEMAS.md`

### CUANDO termines:
1. Verificá que `SCHEMAS.md` está completo
2. Actualizá `STATUS.md`:
   ```
   | DATA | ✅ Done | [qué hiciste] | [hora] |
   ```

## Formato de SCHEMAS.md:

```markdown
# Database Schemas

## Tabla: favorites

### SQL
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### Zod Schema
```typescript
export const favoriteSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  product_id: z.string().uuid(),
  created_at: z.string().datetime()
});
```

### RLS Policies
- Users can only see their own favorites
- Users can only insert/delete their own favorites
```

## CRÍTICO:

**BACKEND depende de vos.** Documentá bien en `SCHEMAS.md` para que pueda trabajar sin preguntarte nada.

Sin tu ✅ en STATUS.md, el pipeline no avanza.
