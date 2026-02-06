# 📡 BACKEND QUEUE - Cola de Tareas Backend

> Cuando necesites que el agente BACKEND haga algo, agregá tu pedido acá.
> El agente BACKEND revisa este archivo y ejecuta las tareas en orden.

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

### Si sos una terminal genérica y necesitás algo de backend:

```markdown
| T1 | Crear endpoint POST /api/products para agregar productos | Alta | ⏳ Pendiente |
```

### Campos:
- **Terminal**: T1, T2, T3, o T4 (tu identificador)
- **Tarea**: Descripción clara de lo que necesitás
- **Prioridad**: Alta / Media / Baja
- **Estado**: ⏳ Pendiente

### Cuando BACKEND complete:
1. Mueve la tarea a "Tareas Completadas"
2. Documenta el resultado en INTERFACES.md si creó endpoint nuevo

---

## 🔧 Territorio del BACKEND

```
src/app/api/**          → Endpoints
src/lib/validations/    → Schemas Zod
src/lib/config/         → Configuración
src/lib/constants/      → Constantes
src/lib/services/       → Servicios de negocio
```

**NO toca**: Components, páginas, UI, migraciones DB (eso es DATABASE)
