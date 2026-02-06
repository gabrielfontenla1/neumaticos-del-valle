# 🔄 Patrón: Refactor de Componente

> Usar cuando: Se necesita mejorar código sin cambiar funcionalidad

## Cuándo Aplicar

- [ ] Componente demasiado grande (>500 líneas)
- [ ] Código duplicado que necesita abstracción
- [ ] Mejora de performance sin cambio de features
- [ ] Migración de patrones (class → hooks, etc.)

## Cadena de Dependencias

```
FRONTEND o ADMIN → QA
```

## Template de Workflow

### Refactor Simple

```markdown
# Workflow: Refactor [componente]

Creado: [fecha]
Estado: 🔵 En progreso
Patrón: refactor-component

## Pipeline

| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | FRONTEND | Refactorizar [componente] - [qué mejora] | ⏳ Pending |
| 2 | QA | Verificar funcionalidad sin cambios, build OK | ⏳ Pending |
```

### Refactor con Extracción

```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | FRONTEND | Extraer [lógica] a hook use[Nombre] | ⏳ Pending |
| 2 | FRONTEND | Extraer [UI] a componente [Nombre] | ⏳ Pending |
| 3 | QA | Verificar funcionalidad idéntica | ⏳ Pending |
```

## Ejemplos Reales

### Ejemplo: Dividir Componente Grande
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | FRONTEND | Extraer filtros de ProductsClient a ProductFilters.tsx | ⏳ Pending |
| 2 | FRONTEND | Extraer grid de ProductsClient a ProductGrid.tsx | ⏳ Pending |
| 3 | QA | Verificar catálogo funciona igual | ⏳ Pending |
```

### Ejemplo: Extraer Hook
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | FRONTEND | Extraer lógica de filtrado a useProductFilters.ts | ⏳ Pending |
| 2 | QA | Verificar filtros funcionan igual | ⏳ Pending |
```

### Ejemplo: Optimizar Renders
```markdown
| Step | Agent | Task | Status |
|------|-------|------|--------|
| 1 | FRONTEND | Agregar useMemo/useCallback a ProductCard | ⏳ Pending |
| 2 | QA | Verificar performance mejoró, no hay regressions | ⏳ Pending |
```

## Checklist Pre-Asignación

- [ ] ¿El refactor tiene scope limitado?
- [ ] ¿Se mantiene la misma funcionalidad?
- [ ] ¿Hay tests que verifican el comportamiento actual?
- [ ] ¿El archivo es uno de los grandes? (ver PROJECT_MAP.md)
