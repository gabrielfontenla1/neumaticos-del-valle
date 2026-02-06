# 🐛 Patrón: Bugfix de API

> Usar cuando: El bug está en un endpoint o lógica de servidor

## Cuándo Aplicar

- [ ] El endpoint devuelve datos incorrectos
- [ ] El endpoint tiene error de validación
- [ ] La query a base de datos es incorrecta
- [ ] NO requiere cambios de schema (si sí, usar otro patrón)

## Cadena de Dependencias

```
BACKEND → QA
```

o si afecta UI:

```
BACKEND → FRONTEND/ADMIN → QA
```

## Template de Workflow

### Bug Solo en Backend

```markdown
# Workflow: Fix [descripción del bug]

Creado: [fecha]
Estado: 🔵 En progreso
Patrón: bugfix-api

## Pipeline

| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | BACKEND | Corregir [bug] en /api/[ruta]/route.ts | ⏳ Pending |
| 2 | QA | Verificar endpoint responde correctamente | ⏳ Pending |
```

### Bug que Afecta UI

```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | BACKEND | Corregir [bug] en /api/[ruta]/route.ts | ⏳ Pending |
| 2 | FRONTEND | Actualizar manejo de response en [componente] | ⏳ Pending |
| 3 | QA | Verificar flujo completo | ⏳ Pending |
```

## Ejemplos Reales

### Ejemplo: Query Retorna Datos Incorrectos
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | BACKEND | Fix query .eq() en /api/products/route.ts | ⏳ Pending |
| 2 | QA | Verificar productos filtran correctamente | ⏳ Pending |
```

### Ejemplo: Error de Validación
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | BACKEND | Ajustar schema Zod para aceptar campo opcional | ⏳ Pending |
| 2 | QA | Verificar POST funciona con y sin el campo | ⏳ Pending |
```

### Ejemplo: Error 500 Intermitente
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | BACKEND | Agregar try-catch y logging en /api/orders/route.ts | ⏳ Pending |
| 2 | QA | Verificar no hay 500 bajo carga normal | ⏳ Pending |
```

## Checklist Pre-Asignación

- [ ] ¿Se identificó el endpoint exacto?
- [ ] ¿Se sabe cuál es el input que causa el error?
- [ ] ¿El fix cambia el contrato de API? (si sí, actualizar INTERFACES.md)
- [ ] ¿El archivo es muy grande? (webhook/route.ts tiene 984 líneas)
