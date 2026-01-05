# Skill: Actualizar Imágenes de Neumáticos

## Descripción

Este skill permite agregar nuevas imágenes de neumáticos al sistema de mapeo y actualizar los productos existentes en la base de datos.

## Cuándo Usar

- Agregar una nueva imagen de neumático
- Agregar un nuevo modelo/variante al mapeo existente
- Corregir el mapeo de un modelo
- Migrar productos después de cambios en el mapeo

## Archivos Involucrados

```
/public/                              # Imágenes de neumáticos
/src/config/tire-image-mapping.ts     # Configuración de mapeo
/scripts/update-product-images.mjs    # Script de migración
/docs/TIRE-IMAGE-MAPPING.md           # Documentación completa
```

## Procedimiento

### Agregar Nueva Imagen

1. **Preparar imagen**:
   - Formato: `.webp` para Pirelli, `.jpg` para Formula
   - Nombre: `{marca}-{modelo}.{ext}` en minúsculas con guiones
   - Tamaño: máximo 200KB

2. **Copiar a /public**:
   ```bash
   cp imagen.webp public/pirelli-nuevo-modelo.webp
   ```

3. **Actualizar mapping** en `/src/config/tire-image-mapping.ts`:
   ```typescript
   // IMPORTANTE: Agregar en orden de especificidad (más específico primero)
   export const TIRE_IMAGE_MAPPINGS: TireImageMapping[] = [
     // Variantes específicas primero
     { pattern: 'NUEVO MODELO VARIANTE', image: '/pirelli-nuevo-modelo-variante.webp', brand: 'PIRELLI' },
     // Modelo base después
     { pattern: 'NUEVO MODELO', image: '/pirelli-nuevo-modelo.webp', brand: 'PIRELLI' },
     // ... resto de mappings
   ];
   ```

4. **Ejecutar migración**:
   ```bash
   node scripts/update-product-images.mjs
   ```

5. **Verificar** que los productos muestran la imagen correcta

### Agregar Variante a Modelo Existente

1. **Editar** `/src/config/tire-image-mapping.ts`
2. **Agregar** el pattern de la variante ANTES del pattern genérico:
   ```typescript
   // Nueva variante (agregar ANTES del genérico)
   { pattern: 'SCORPION NUEVA VARIANTE', image: '/pirelli-scorpion-nueva-variante.webp', brand: 'PIRELLI' },
   // Genérico existente
   { pattern: 'SCORPION', image: '/pirelli-scorpion.webp', brand: 'PIRELLI' },
   ```

3. **Ejecutar migración**

### Corregir Mapeo

1. **Identificar** el pattern incorrecto en el mapping
2. **Corregir** la imagen o el pattern
3. **Ejecutar migración**

## Convención de Nombres

| Marca | Formato | Ejemplo |
|-------|---------|---------|
| Pirelli | `pirelli-{modelo}.webp` | `pirelli-scorpion-verde.webp` |
| Formula | `formula-{modelo}.jpg` | `formula-energy.jpg` |

## Fallbacks

Si no hay coincidencia específica:
- Pirelli → `/pirelli-scorpion.webp`
- Formula → `/formula-energy.jpg`
- Otros → `/tire.webp`

## Orden de Mappings

**CRÍTICO**: Los patterns más específicos van primero.

```typescript
// ✅ CORRECTO
{ pattern: 'SCORPION VERDE ALL SEASON', ... },  // Más específico
{ pattern: 'SCORPION VERDE', ... },              // Intermedio
{ pattern: 'SCORPION', ... },                    // Más genérico

// ❌ INCORRECTO
{ pattern: 'SCORPION', ... },                    // Capturaría todo
{ pattern: 'SCORPION VERDE', ... },              // Nunca se alcanzaría
```

## Script de Migración

```bash
# Ver cambios y aplicar
node scripts/update-product-images.mjs
```

Salida esperada:
```
📊 Leyendo productos de la base de datos...
   ✅ 741 productos encontrados
🔄 Calculando nuevas imágenes...
   📊 Sin cambios: X
   📊 A actualizar: Y
💾 Aplicando cambios en la base de datos...
   ✅ Actualizados: Y
   ❌ Errores: 0
```

## Troubleshooting

### Imagen no aparece
- Verificar nombre del archivo (minúsculas, guiones)
- Verificar ruta en mapping (empieza con `/`)
- Verificar campo `image_url` en Supabase

### Producto usa imagen incorrecta
- Revisar orden de mappings (específico primero)
- Verificar marca en mapping coincide con producto
- Ejecutar migración

### Error en migración
- Verificar `.env.local` con credenciales
- Verificar conexión a Supabase

## Documentación

Ver `/docs/TIRE-IMAGE-MAPPING.md` para documentación completa.
