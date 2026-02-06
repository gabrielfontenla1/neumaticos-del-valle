# 🆕 Patrón: Feature Nueva Fullstack

> Usar cuando: La feature necesita cambios en DB + API + UI

## Cuándo Aplicar

- [ ] Se necesita crear una nueva tabla o modificar schema existente
- [ ] Se necesitan endpoints nuevos (GET, POST, PUT, DELETE)
- [ ] Se necesita UI para mostrar/editar los datos
- [ ] Es una feature "completa" de punta a punta

## Cadena de Dependencias

```
DATA → BACKEND → FRONTEND/ADMIN → QA
```

## Template de Workflow

```markdown
# Workflow: [Nombre de la Feature]

Creado: [fecha]
Estado: 🔵 En progreso
Patrón: new-feature-fullstack

## Pipeline

| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | DATA | Crear migración [nombre_tabla], schema Zod en validations/ | ⏳ Pending |
| 2 | BACKEND | Crear endpoints GET/POST /api/[ruta], documentar en INTERFACES.md | ⏳ Pending |
| 3 | FRONTEND | Crear componentes y página en src/app/[ruta] | ⏳ Pending |
| 4 | QA | Verificar type-check, lint, build | ⏳ Pending |
```

## Variante: Con Panel Admin

Si la feature también necesita gestión en admin:

```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | DATA | Crear migración [tabla], schema Zod | ⏳ Pending |
| 2 | BACKEND | Crear endpoints públicos + admin | ⏳ Pending |
| 3 | FRONTEND | Crear UI pública | ⏳ Pending |
| 4 | ADMIN | Crear panel de gestión en admin/ | ⏳ Pending |
| 5 | QA | Verificar ambas UIs + build | ⏳ Pending |
```

## Ejemplos Reales

### Ejemplo: Sistema de Cupones
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | DATA | Crear tabla vouchers, schema CreateVoucherSchema | ⏳ Pending |
| 2 | BACKEND | GET/POST /api/vouchers, validar en checkout | ⏳ Pending |
| 3 | FRONTEND | Input de cupón en checkout | ⏳ Pending |
| 4 | ADMIN | CRUD de cupones en admin/vouchers | ⏳ Pending |
| 5 | QA | Verificar flujo completo | ⏳ Pending |
```

### Ejemplo: Sistema de Notificaciones
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | DATA | Crear tabla admin_notifications | ⏳ Pending |
| 2 | BACKEND | GET/POST /api/admin/notifications | ⏳ Pending |
| 3 | ADMIN | Badge y panel de notificaciones | ⏳ Pending |
| 4 | QA | Verificar realtime y build | ⏳ Pending |
```

## Checklist Pre-Asignación

- [ ] ¿Los nombres de tabla/endpoint son consistentes con el proyecto?
- [ ] ¿Se especificaron los campos de la tabla?
- [ ] ¿Se definieron los tipos de request/response?
- [ ] ¿FRONTEND/ADMIN sabe qué endpoints consumir?
