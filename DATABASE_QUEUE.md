# 🗄️ DATABASE QUEUE - Cola de Tareas Base de Datos

> Cuando necesites que el agente DATABASE haga algo, agregá tu pedido acá.
> El agente DATABASE revisa este archivo y ejecuta las tareas en orden.

---

## 📋 Tareas Pendientes

<!-- Formato: | Terminal | Tarea | Prioridad | Estado | -->

| Terminal | Tarea | Prioridad | Estado |
|----------|-------|-----------|--------|
| - | - | - | Sin tareas pendientes |

---

## ✅ Tareas Completadas

| Terminal | Tarea | Completado |
|----------|-------|------------|
| - | - | - |

---

## 📝 Cómo Agregar una Tarea

### Si sos una terminal genérica y necesitás algo de database:

```markdown
| T2 | Agregar columna 'discount' a tabla products | Alta | ⏳ Pendiente |
```

### Campos:
- **Terminal**: T1, T2, T3, o T4 (tu identificador)
- **Tarea**: Descripción clara de lo que necesitás
- **Prioridad**: Alta / Media / Baja
- **Estado**: ⏳ Pendiente

### Cuando DATABASE complete:
1. Mueve la tarea a "Tareas Completadas"
2. Si modificó schema, regenerar types con `npx supabase gen types`
3. Documentar cambios importantes

---

## 🗄️ Territorio del DATABASE

```
supabase/migrations/    → Migraciones SQL
src/lib/supabase*.ts    → Clientes Supabase
src/lib/db/             → Queries y helpers
src/types/database.ts   → Types (auto-generado)
```

**Responsabilidades**:
- Crear/modificar tablas
- Escribir migraciones
- Configurar RLS policies
- Optimizar queries
- Mantener integridad de datos

**NO toca**: Endpoints API (eso es BACKEND), Components, páginas
