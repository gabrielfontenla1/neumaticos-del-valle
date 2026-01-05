# Sistema de Mapeo de Imágenes de Neumáticos

## Resumen

Este documento describe el sistema centralizado para vincular productos de neumáticos con sus imágenes correspondientes. El sistema fue implementado para resolver problemas de nombres de archivos inconsistentes y mapeos fragmentados.

---

## Arquitectura

### Componentes del Sistema

```
/public/                           # Archivos de imágenes
├── pirelli-*.webp                 # Imágenes Pirelli (formato WebP)
├── formula-*.jpg                  # Imágenes Formula (formato JPG)
└── tire.webp                      # Imagen por defecto

/src/config/
└── tire-image-mapping.ts          # Configuración centralizada de mapeo

/src/features/products/utils/
└── importHelpers.ts               # Usa getTireImage() para nuevos productos

/scripts/
└── update-product-images.mjs      # Script de migración de base de datos
```

### Flujo de Datos

```
Producto (nombre + marca)
        ↓
getTireImage(name, brand)
        ↓
Buscar coincidencia en TIRE_IMAGE_MAPPINGS
        ↓
¿Coincidencia encontrada?
    ├── Sí → Retornar imagen específica
    └── No → Retornar fallback por marca
```

---

## Convención de Nombres de Archivos

### Formato Estándar

```
{marca}-{modelo}.{extensión}
```

- **Minúsculas**: Todo en minúsculas
- **Guiones**: Separar palabras con guiones (no underscores ni espacios)
- **Sin timestamps**: No incluir códigos numéricos ni fechas
- **Extensión**: `.webp` para Pirelli, `.jpg` para Formula

### Ejemplos

| ❌ Incorrecto | ✅ Correcto |
|--------------|-------------|
| `Chrono-1505470062195.webp` | `pirelli-chrono.webp` |
| `Scorpion-Verde-1505470074533.webp` | `pirelli-scorpion-verde.webp` |
| `formulaenergy.jpg` | `formula-energy.jpg` |
| `P400Evo_review_3-4.webp` | `pirelli-p400-evo.webp` |

---

## Configuración del Mapeo

### Archivo Principal

**Ubicación**: `/src/config/tire-image-mapping.ts`

### Estructura del Mapeo

```typescript
interface TireImageMapping {
  pattern: string | RegExp;  // Patrón a buscar en el nombre del producto
  image: string;             // Ruta de la imagen (relativa a /public)
  brand: string;             // Marca del neumático
}
```

### Reglas de Prioridad

**IMPORTANTE**: El orden de los mappings importa. Los patrones más específicos deben ir primero.

```typescript
// ✅ CORRECTO - Específico primero
{ pattern: 'SCORPION VERDE ALL SEASON', image: '/pirelli-scorpion-verde-all-season.webp', brand: 'PIRELLI' },
{ pattern: 'SCORPION VERDE', image: '/pirelli-scorpion-verde.webp', brand: 'PIRELLI' },
{ pattern: 'SCORPION', image: '/pirelli-scorpion.webp', brand: 'PIRELLI' },

// ❌ INCORRECTO - El genérico capturaría todo
{ pattern: 'SCORPION', image: '/pirelli-scorpion.webp', brand: 'PIRELLI' },
{ pattern: 'SCORPION VERDE', image: '/pirelli-scorpion-verde.webp', brand: 'PIRELLI' },
```

### Fallbacks por Marca

```typescript
const BRAND_FALLBACKS = {
  'PIRELLI': '/pirelli-scorpion.webp',
  'FORMULA': '/formula-energy.jpg',
  'DEFAULT': '/tire.webp'
};
```

---

## Cómo Agregar Nuevas Imágenes

### Paso 1: Preparar la Imagen

1. Obtener imagen del neumático (preferiblemente fondo transparente o blanco)
2. Optimizar para web:
   - Pirelli: Convertir a WebP, máximo 200KB
   - Formula: JPG, máximo 150KB
3. Renombrar siguiendo la convención: `{marca}-{modelo}.{ext}`

### Paso 2: Agregar al Proyecto

```bash
# Copiar imagen a /public
cp mi-imagen.webp public/pirelli-nuevo-modelo.webp
```

### Paso 3: Actualizar Configuración

Editar `/src/config/tire-image-mapping.ts`:

```typescript
export const TIRE_IMAGE_MAPPINGS: TireImageMapping[] = [
  // ... mappings existentes ...

  // AGREGAR EN LA POSICIÓN CORRECTA (más específico primero)
  { pattern: 'NUEVO MODELO VARIANTE', image: '/pirelli-nuevo-modelo-variante.webp', brand: 'PIRELLI' },
  { pattern: 'NUEVO MODELO', image: '/pirelli-nuevo-modelo.webp', brand: 'PIRELLI' },
];
```

### Paso 4: Migrar Productos Existentes

```bash
# Ejecutar script de migración
node scripts/update-product-images.mjs
```

### Paso 5: Verificar

1. Revisar la salida del script para confirmar actualizaciones
2. Verificar en la web que las imágenes cargan correctamente
3. Commit y deploy

---

## Script de Migración

### Uso

```bash
node scripts/update-product-images.mjs
```

### Salida Esperada

```
╔══════════════════════════════════════════════════════════════════╗
║       MIGRACIÓN DE IMÁGENES DE PRODUCTOS                         ║
╚══════════════════════════════════════════════════════════════════╝

📊 Leyendo productos de la base de datos...
   ✅ 741 productos encontrados

🔄 Calculando nuevas imágenes...
   📊 Sin cambios: 17
   📊 A actualizar: 724

📋 RESUMEN POR MARCA
─────────────────────────────────────────────────────────────────────
   PIRELLI         Total:  705 | Actualizar:  705
   FORMULA         Total:   35 | Actualizar:   19

📝 EJEMPLOS DE CAMBIOS (primeros 10)
─────────────────────────────────────────────────────────────────────
   165/70R13 79T FORMULA ENERGY
      /formulaenergy.jpg → /formula-energy.jpg

💾 Aplicando cambios en la base de datos...

═══════════════════════════════════════════════════════════════════════
   ✅ Actualizados: 724
   ❌ Errores: 0
═══════════════════════════════════════════════════════════════════════
```

### Requisitos

- Node.js 18+
- Variables de entorno configuradas en `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## Modelos Soportados

### Pirelli

| Modelo | Imagen | Variantes Detectadas |
|--------|--------|----------------------|
| Scorpion | `pirelli-scorpion.webp` | SCORPION, SCORPN |
| Scorpion Verde | `pirelli-scorpion-verde.webp` | SCORPION VERDE |
| Scorpion Verde All Season | `pirelli-scorpion-verde-all-season.webp` | SCORPION VERDE ALL SEASON |
| Scorpion Zero | `pirelli-scorpion-zero.webp` | SCORPION ZERO |
| Scorpion Zero All Season | `pirelli-scorpion-zero-all-season.webp` | SCORPION ZERO ALL SEASON |
| Scorpion Zero Asimmetrico | `pirelli-scorpion-zero-asimmetrico.webp` | SCORPION ZERO ASIMMETRICO |
| Scorpion All Terrain Plus | `pirelli-scorpion-at-plus.webp` | SCORPION ALL TERRAIN, SCORPION ALL TERRAIN PLUS |
| Scorpion ATR | `pirelli-scorpion-atr.webp` | SCORPION ATR |
| Scorpion MTR | `pirelli-scorpion-mtr.webp` | SCORPION MTR |
| Scorpion HT | `pirelli-scorpion-ht.webp` | SCORPION HT |
| Cinturato P1 | `pirelli-cinturato-p1.webp` | CINTURATO P1 |
| Cinturato P7 | `pirelli-cinturato-p7.webp` | CINTURATO P7, CINTURATO |
| P Zero | `pirelli-pzero.webp` | P ZERO, PZERO, P-ZERO |
| P Zero Corsa | `pirelli-pzero-corsa.webp` | P ZERO CORSA, PZERO CORSA |
| P Zero Corsa System | `pirelli-pzero-corsa-system.webp` | P ZERO CORSA SYSTEM, PZERO CORSA SYSTEM |
| P400 Evo | `pirelli-p400-evo.webp` | P400 EVO, P400EVO, P400 |
| Chrono | `pirelli-chrono.webp` | CHRONO, CARRIER |
| Nero GT | `nerogt.jpg` | NERO GT, NEROGT |
| P6000 | `p6000.jpg` | P6000 |
| Powergy | `pirelli-pzero.webp` | POWERGY, PWRGY |

### Formula

| Modelo | Imagen | Variantes Detectadas |
|--------|--------|----------------------|
| Formula Energy | `formula-energy.jpg` | FORMULA ENERGY, F.ENERGY |
| Formula Evo | `formula-evo.jpg` | FORMULA EVO, F.EVO |
| Formula S/T | `formula-st.jpg` | FORMULA S/T, F.S/T, FORMULA AT |
| Formula Spider | `spider.jpg` | FORMULA SPIDER |
| Formula Dragon | `dragon.jpg` | FORMULA DRAGON |

---

## Troubleshooting

### Imagen no aparece

1. **Verificar nombre del archivo**: Debe estar en minúsculas con guiones
2. **Verificar extensión**: `.webp` para Pirelli, `.jpg` para Formula
3. **Verificar ruta en mapping**: Debe empezar con `/`
4. **Verificar producto en DB**: El campo `image_url` debe tener la ruta correcta

### Producto usa imagen incorrecta

1. **Verificar orden de mappings**: Patrones más específicos primero
2. **Verificar coincidencia de marca**: El mapping debe tener la marca correcta
3. **Ejecutar migración**: `node scripts/update-product-images.mjs`

### Error en migración

1. **Verificar variables de entorno**: `.env.local` debe existir con las credenciales
2. **Verificar conexión a Supabase**: Probar desde la consola de Supabase
3. **Revisar logs del script**: El error específico aparecerá en la consola

---

## Funciones Auxiliares

### getTireImage(productName, brand)

Obtiene la imagen correspondiente para un producto.

```typescript
import { getTireImage } from '@/config/tire-image-mapping';

const image = getTireImage("205/55R16 91V SCORPION VERDE", "PIRELLI");
// Retorna: "/pirelli-scorpion-verde.webp"
```

### hasImageMapping(productName, brand)

Verifica si existe un mapeo específico (no fallback).

```typescript
import { hasImageMapping } from '@/config/tire-image-mapping';

hasImageMapping("SCORPION VERDE", "PIRELLI");  // true
hasImageMapping("MODELO DESCONOCIDO", "PIRELLI");  // false
```

### getMappingsForBrand(brand)

Obtiene todos los mappings de una marca.

```typescript
import { getMappingsForBrand } from '@/config/tire-image-mapping';

const pirelliMappings = getMappingsForBrand("PIRELLI");
// Retorna array de TireImageMapping[]
```

### getAllMappedImages()

Lista todas las imágenes únicas usadas.

```typescript
import { getAllMappedImages } from '@/config/tire-image-mapping';

const images = getAllMappedImages();
// Retorna: ["/pirelli-scorpion.webp", "/formula-energy.jpg", ...]
```

---

## Historial de Cambios

### 2026-01-05 - Implementación Inicial

- Renombrados ~20 archivos de imágenes con nueva convención
- Creado sistema centralizado de mapeo en `/src/config/tire-image-mapping.ts`
- Actualizado `importHelpers.ts` para usar nuevo sistema
- Migrados 724 productos en base de datos
- Creada documentación y skill de Claude Code

---

## Archivos Relacionados

- `/src/config/tire-image-mapping.ts` - Configuración principal
- `/src/features/products/utils/importHelpers.ts` - Uso en importación
- `/scripts/update-product-images.mjs` - Script de migración
- `/.claude/skills/update-tire-images.md` - Skill de Claude Code
