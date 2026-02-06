# ➕ Patrón: Agregar Endpoint

> Usar cuando: Se necesita un nuevo endpoint sin cambios de DB

## Cuándo Aplicar

- [ ] Se necesita un nuevo endpoint GET, POST, PUT o DELETE
- [ ] NO se necesita nueva tabla (usa tablas existentes)
- [ ] Puede o no necesitar cambios de UI

## Cadena de Dependencias

Sin UI:
```
BACKEND → QA
```

Con UI:
```
BACKEND → FRONTEND/ADMIN → QA
```

## Template de Workflow

### Solo Endpoint

```markdown
# Workflow: Agregar endpoint [nombre]

Creado: [fecha]
Estado: 🔵 En progreso
Patrón: add-endpoint

## Pipeline

| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | BACKEND | Crear [METHOD] /api/[ruta], documentar en INTERFACES.md | ⏳ Pending |
| 2 | QA | Verificar types y response | ⏳ Pending |
```

### Endpoint + UI Pública

```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | BACKEND | Crear [METHOD] /api/[ruta], documentar en INTERFACES.md | ⏳ Pending |
| 2 | FRONTEND | Consumir endpoint en [componente/página] | ⏳ Pending |
| 3 | QA | Verificar integración | ⏳ Pending |
```

### Endpoint + UI Admin

```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | BACKEND | Crear [METHOD] /api/admin/[ruta], documentar en INTERFACES.md | ⏳ Pending |
| 2 | ADMIN | Consumir endpoint en admin/[página] | ⏳ Pending |
| 3 | QA | Verificar integración | ⏳ Pending |
```

## Ejemplos Reales

### Ejemplo: Endpoint de Estadísticas
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | BACKEND | Crear GET /api/admin/stats con agregaciones | ⏳ Pending |
| 2 | ADMIN | Mostrar stats en dashboard principal | ⏳ Pending |
| 3 | QA | Verificar cálculos y performance | ⏳ Pending |
```

### Ejemplo: Endpoint de Búsqueda
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | BACKEND | Crear GET /api/products/search?q= | ⏳ Pending |
| 2 | FRONTEND | Integrar en SearchBar.tsx | ⏳ Pending |
| 3 | QA | Verificar búsqueda funciona con diferentes queries | ⏳ Pending |
```

### Ejemplo: Endpoint de Export
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | BACKEND | Crear GET /api/admin/orders/export (CSV/Excel) | ⏳ Pending |
| 2 | ADMIN | Agregar botón "Exportar" en admin/orders | ⏳ Pending |
| 3 | QA | Verificar archivo descarga correctamente | ⏳ Pending |
```

## Checklist Pre-Asignación

- [ ] ¿El método HTTP es correcto? (GET para leer, POST para crear, etc.)
- [ ] ¿La ruta sigue convención existente? (/api/[recurso] o /api/admin/[recurso])
- [ ] ¿Se definió el schema de request/response?
- [ ] ¿BACKEND va a documentar en INTERFACES.md?
