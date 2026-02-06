# 🐛 Patrón: Bugfix de UI

> Usar cuando: El bug está en un componente visual, sin cambios de API

## Cuándo Aplicar

- [ ] El problema es visual (layout, estilos, responsive)
- [ ] El problema es de comportamiento en cliente (estados, efectos)
- [ ] NO requiere cambios en base de datos
- [ ] NO requiere cambios en endpoints

## Cadena de Dependencias

```
FRONTEND o ADMIN → QA
```

## Template de Workflow

### Bug en Página Pública

```markdown
# Workflow: Fix [descripción del bug]

Creado: [fecha]
Estado: 🔵 En progreso
Patrón: bugfix-ui

## Pipeline

| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | FRONTEND | Corregir [bug] en [archivo.tsx] | ⏳ Pending |
| 2 | QA | Verificar fix, check regression | ⏳ Pending |
```

### Bug en Dashboard Admin

```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | ADMIN | Corregir [bug] en [archivo.tsx] | ⏳ Pending |
| 2 | QA | Verificar fix, check regression | ⏳ Pending |
```

## Ejemplos Reales

### Ejemplo: Scroll Roto en Sidebar
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | ADMIN | Fix overflow-y en AdminLayout.tsx línea 45 | ⏳ Pending |
| 2 | QA | Verificar scroll funciona en todos los breakpoints | ⏳ Pending |
```

### Ejemplo: Botón No Responde
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | FRONTEND | Fix handler onClick en ProductCard.tsx | ⏳ Pending |
| 2 | QA | Verificar click funciona, no hay errores en console | ⏳ Pending |
```

### Ejemplo: Layout Roto en Mobile
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | FRONTEND | Ajustar breakpoints en ProductsClient.tsx grid | ⏳ Pending |
| 2 | QA | Verificar en viewport 320px, 375px, 768px | ⏳ Pending |
```

## Checklist Pre-Asignación

- [ ] ¿Se identificó el archivo exacto con el bug?
- [ ] ¿Se puede reproducir el bug consistentemente?
- [ ] ¿El fix no afecta otras partes de la UI?
- [ ] ¿El archivo es muy grande? (si >500 líneas, advertir)
