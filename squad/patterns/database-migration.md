# 🗄️ Patrón: Migración de Base de Datos

> Usar cuando: Se necesita crear tabla, agregar campo, o modificar schema

## Cuándo Aplicar

- [ ] Se necesita una nueva tabla
- [ ] Se necesita agregar/modificar campos
- [ ] Se necesitan nuevos índices o constraints
- [ ] Se necesitan nuevas policies RLS

## Cadena de Dependencias

Solo schema:
```
DATA → QA
```

Con cambios de API:
```
DATA → BACKEND → QA
```

Fullstack:
```
DATA → BACKEND → FRONTEND/ADMIN → QA
```

## Template de Workflow

### Solo Migración

```markdown
# Workflow: Migración [descripción]

Creado: [fecha]
Estado: 🔵 En progreso
Patrón: database-migration

## Pipeline

| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | DATA | Crear migración [nombre].sql, schema Zod | ⏳ Pending |
| 2 | QA | Verificar migración aplica, types correctos | ⏳ Pending |
```

### Migración + API

```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | DATA | Crear migración [nombre].sql, schema Zod | ⏳ Pending |
| 2 | BACKEND | Actualizar queries que usan la tabla | ⏳ Pending |
| 3 | QA | Verificar migración + endpoints | ⏳ Pending |
```

### Migración Fullstack

```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | DATA | Crear migración [nombre].sql, schema Zod | ⏳ Pending |
| 2 | BACKEND | Actualizar endpoints afectados | ⏳ Pending |
| 3 | FRONTEND | Actualizar formularios/componentes | ⏳ Pending |
| 4 | QA | Verificar flujo completo | ⏳ Pending |
```

## Ejemplos Reales

### Ejemplo: Nueva Tabla
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | DATA | CREATE TABLE admin_notifications con RLS | ⏳ Pending |
| 2 | DATA | Schema AdminNotificationSchema en validations/ | ⏳ Pending |
| 3 | QA | Verificar tabla existe y policies funcionan | ⏳ Pending |
```

### Ejemplo: Agregar Campo
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | DATA | ALTER TABLE products ADD COLUMN discount_price | ⏳ Pending |
| 2 | BACKEND | Actualizar queries de productos | ⏳ Pending |
| 3 | FRONTEND | Mostrar precio con descuento en ProductCard | ⏳ Pending |
| 4 | QA | Verificar cálculos de precio | ⏳ Pending |
```

### Ejemplo: Agregar Índice
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | DATA | CREATE INDEX idx_products_brand ON products(brand) | ⏳ Pending |
| 2 | QA | Verificar query performance mejoró | ⏳ Pending |
```

## Checklist Pre-Asignación

- [ ] ¿El nombre de la migración es descriptivo? (ej: 20260206_add_notifications.sql)
- [ ] ¿Se especificaron los campos con tipos?
- [ ] ¿Se necesitan policies RLS?
- [ ] ¿El cambio es backwards-compatible?
- [ ] ¿Se actualizará types/database.ts después? (NUNCA editar manualmente)
