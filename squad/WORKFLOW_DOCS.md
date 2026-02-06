# 🔄 WORKFLOW DOCS - Documentación del Sistema

> Esta es la documentación del sistema de workflow.
> El archivo `WORKFLOW.md` en la raíz es para pipelines activos.

## Formato de Pipeline en WORKFLOW.md

Cuando ORCHESTRATOR crea un workflow, debe usar este formato:

```markdown
# Workflow: [Nombre de la feature]

Creado: [fecha/hora]
Estado: 🔵 En progreso

## Pipeline

| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | DATA | [tarea específica] | ⏳ Pending |
| 2 | BACKEND | [tarea específica] | ⏳ Pending |
| 3 | FRONTEND | [tarea específica] | ⏳ Pending |
| 4 | ADMIN | [tarea específica] | ⏳ Pending |
| 5 | QA | Verificar build y tests | ⏳ Pending |
```

## Estados

- `⏳ Pending` - Esperando ser ejecutado
- `🔵 Running` - En ejecución (watcher lo marca automáticamente)
- `✅ Done` - Completado

## Reglas del Pipeline

1. **DATA** siempre primero si hay cambios de DB
2. **BACKEND** después de DATA
3. **FRONTEND** y **ADMIN** pueden ir en paralelo después de BACKEND
4. **QA** siempre al final

## Flujo Automático

```
ORCHESTRATOR escribe WORKFLOW.md con ⏳ Pending
         ↓
WATCHER detecta ⏳ Pending (cada 3 seg)
         ↓
WATCHER marca 🔵 Running y dispara assign.sh
         ↓
Agente trabaja y actualiza STATUS.md con ✅ Done
         ↓
WATCHER detecta ✅ Done en STATUS.md
         ↓
WATCHER marca step como ✅ Done en WORKFLOW.md
         ↓
WATCHER busca siguiente ⏳ Pending...
         ↓
Cuando no hay más → 🎉 WORKFLOW COMPLETADO
```
