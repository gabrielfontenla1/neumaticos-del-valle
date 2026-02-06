# 📚 Biblioteca de Patrones de Workflow

> ORCHESTRATOR: Usá estos patrones como base para crear workflows.
> Elegí el que mejor se ajuste a la tarea y customizalo.

## Índice de Patrones

| Patrón | Archivo | Cuándo Usar |
|--------|---------|-------------|
| Feature Fullstack | `new-feature-fullstack.md` | DB + API + UI nueva |
| Bugfix UI | `bugfix-ui.md` | Bug visual o de comportamiento cliente |
| Bugfix API | `bugfix-api.md` | Bug en endpoint o lógica servidor |
| Agregar Endpoint | `add-endpoint.md` | Nuevo endpoint sin cambios de DB |
| Migración DB | `database-migration.md` | Cambios de schema |
| Refactor | `refactor-component.md` | Mejora de código sin cambio de feature |

## Cómo Elegir el Patrón Correcto

```
¿Necesita cambios de DB?
├── SÍ → ¿Necesita API nueva?
│        ├── SÍ → new-feature-fullstack.md
│        └── NO → database-migration.md
└── NO → ¿Necesita endpoint nuevo?
         ├── SÍ → add-endpoint.md
         └── NO → ¿Es un bug?
                  ├── SÍ → ¿En UI o API?
                  │        ├── UI → bugfix-ui.md
                  │        └── API → bugfix-api.md
                  └── NO → ¿Es refactor?
                           ├── SÍ → refactor-component.md
                           └── NO → Combinar patrones según necesidad
```

## Reglas de Uso

1. **Siempre indicar el patrón usado** en el workflow:
   ```
   Patrón usado: new-feature-fullstack
   ```

2. **Customizar según la tarea**, no copiar ciegamente

3. **Si no hay patrón exacto**, combinar elementos de varios

4. **Agregar nuevos patrones** cuando se detecten casos frecuentes no cubiertos

## Crear Nuevo Patrón

Si identificás una tarea recurrente sin patrón:

1. Crear archivo `[nombre-descriptivo].md` en esta carpeta
2. Seguir la estructura:
   - Cuándo Aplicar (checklist)
   - Cadena de Dependencias
   - Template de Workflow
   - Ejemplos Reales
   - Checklist Pre-Asignación
3. Agregar al índice de este README

---

*Última actualización: Febrero 2026*
