# Workflow: Fix Estructura Tabs en Admin Chats

**Creado**: 2026-02-06
**Estado**: 🔵 En progreso
**Patrón usado**: bugfix-ui

---

## Pipeline

| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | ADMIN | Reestructurar Tabs: mover chat view DENTRO de TabsContent conversations | ✅ Done |
| 2 | QA | Verificar que tabs funcionan y build OK | 🔵 Running |

---

## Dependencias

```
ADMIN → QA
```

---

## Problema

El panel de chat (mensajes) estaba FUERA de TabsContent, causando:
- Click en conversación no mostraba mensajes
- Al cambiar tabs el chat seguía visible

## Solución

Reestructurar para que:
- TabsContent "conversations" contenga AMBOS paneles (lista + chat)
- TabsContent "ai-config" contenga solo AIConfigPanel

---

## Notas

- Ver SPECS.md para el código completo corregido
- Mantener diseño estilo WhatsApp (colores verdes oscuros)
- El archivo es `src/app/admin/chats/page.tsx`
