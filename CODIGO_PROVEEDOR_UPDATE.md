# 📦 Actualización: Código de Proveedor en Catálogo y Detalle

## Fecha: 2026-01-20
## Usuario: Gabriel Fontenla

---

## ✅ Resumen Ejecutivo

Se agregó el **código del proveedor** en:
1. ✅ Cards del catálogo principal (`/productos`)
2. ✅ Cards de agro/camiones (`/agro-camiones`)
3. ✅ Vista de detalle del producto
4. ✅ Sección de información adicional

---

## 📊 Datos Actualizados

### Información Guardada en BD:

```json
{
  "codigo_proveedor": "3839300",
  "proveedor": "PIRELLI NEUMATICOS SAIC",
  "stock_por_sucursal": {
    "catamarca": 15,
    "salta": 19,
    "santiago": 1
  }
}
```

### Estadísticas:
- **Total productos actualizados**: 741/741 (100%)
- **Productos con código de proveedor**: 741
- **Errores**: 0

---

## 🔧 Cambios Realizados

### 1. Script de Actualización

**Archivo**: `scripts/update_stock_from_excel.py`

**Cambios**:
- ✅ Extrae `CODIGO_PROVEEDOR` del Excel
- ✅ Extrae `PROVEEDOR` del Excel
- ✅ Guarda ambos campos en `features`
- ✅ Actualiza TODOS los productos (con y sin stock)

**Código agregado**:
```python
# Obtener código de proveedor y proveedor
codigo_proveedor = str(row.get('CODIGO_PROVEEDOR', '')).strip()
proveedor = str(row.get('PROVEEDOR', '')).strip()

# Agregar código de proveedor si existe
if codigo_proveedor and codigo_proveedor != 'nan':
    current_features['codigo_proveedor'] = codigo_proveedor

# Agregar proveedor si existe
if proveedor and proveedor != 'nan':
    current_features['proveedor'] = proveedor
```

---

### 2. Cards del Catálogo Principal

**Archivo**: `src/app/productos/ProductsClient.tsx:1389-1394`

**Cambios**:
- ✅ Corregido campo de `codigo_proveedor` (antes buscaba campo incorrecto)
- ✅ Agregado estilo `font-mono` para mejor legibilidad
- ✅ Formato mejorado: "Cód. Proveedor: XXXXXX"

**Código actualizado**:
```typescript
{/* Código de proveedor */}
{(product.features as any)?.codigo_proveedor && (
  <div className="text-[10px] text-gray-500 mb-2 font-mono">
    Cód. Proveedor: {(product.features as any).codigo_proveedor}
  </div>
)}
```

**Vista previa**:
```
PIRELLI
225/60R18
104H XL SCORPN
Cód. Proveedor: 3839300    ← NUEVO
Stock: 35 unidades
$366,521.25
```

---

### 3. Cards de Agro/Camiones

**Archivo**: `src/app/agro-camiones/AgroCamionesClient.tsx:1228-1232`

**Cambios**:
- ✅ Mismo formato que catálogo principal
- ✅ Consistencia visual en toda la aplicación

---

### 4. Vista de Detalle del Producto

#### 4.1 Sección de Precio (arriba)

**Archivo**: `src/features/products/catalog/ProductDetail.tsx:355-361`

**Cambios**:
- ✅ Cambiado de `features.proveedor` a `features.codigo_proveedor`
- ✅ Badge destacado debajo del precio
- ✅ Estilo `font-mono` para mejor legibilidad

**Código actualizado**:
```typescript
{/* Código de proveedor */}
{features?.codigo_proveedor && (
  <div className="mb-2">
    <p className="text-xs text-gray-700 border border-gray-300 bg-gray-50 rounded px-2 py-1 inline-block font-mono">
      Cód. Proveedor: {features.codigo_proveedor}
    </p>
  </div>
)}
```

**Ubicación**: Debajo de "3 cuotas sin interés" y arriba de "Colocación sin cargo"

---

#### 4.2 Sección de Información Adicional (abajo)

**Archivo**: `src/features/products/catalog/ProductDetail.tsx:642-653`

**Cambios**:
- ✅ Agregado "Código de Proveedor" como campo separado
- ✅ Agregado "Proveedor" (nombre completo) como campo adicional
- ✅ Formato tabular para mejor legibilidad

**Código agregado**:
```typescript
{features?.codigo_proveedor && (
  <div className="flex items-center justify-between py-2 border-b border-gray-100">
    <span className="text-sm text-gray-600">Código de Proveedor:</span>
    <span className="text-sm font-semibold text-gray-900 font-mono">{features.codigo_proveedor}</span>
  </div>
)}
{features?.proveedor && (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-600">Proveedor:</span>
    <span className="text-sm font-semibold text-gray-900">{features.proveedor}</span>
  </div>
)}
```

**Vista previa**:
```
Información adicional
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Categoría:              camioneta
Modelo:                 SCORPION HT
Código de Proveedor:    3839300      ← NUEVO
Proveedor:              PIRELLI NEUMATICOS SAIC  ← NUEVO
```

---

## 📱 Ubicaciones del Código de Proveedor

### En el Catálogo:
```
┌─────────────────────────────┐
│ [Imagen del neumático]      │
├─────────────────────────────┤
│ PIRELLI                     │
│ 225/60R18                   │
│ 104H XL SCORPN              │
│ Cód. Proveedor: 3839300  ←  │ NUEVO
│ Stock: 35 unidades          │
│ $366,521.25                 │
└─────────────────────────────┘
```

### En el Detalle (Sección de Precio):
```
$488,695  25% OFF
$366,521,25
3 cuotas sin interés de $122,173
┌──────────────────────────────┐
│ Cód. Proveedor: 3839300   ←  │ NUEVO (Badge destacado)
└──────────────────────────────┘
Colocación sin cargo...
```

### En el Detalle (Información Adicional):
```
Información adicional
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Categoría:              camioneta
Modelo:                 SCORPION HT
Código de Proveedor:    3839300      ← NUEVO
Proveedor:              PIRELLI...   ← NUEVO
```

---

## 🎨 Estilos Aplicados

### Tipografía:
- **`font-mono`**: Fuente monoespaciada para códigos numéricos
- **Tamaño**: `text-[10px]` en cards, `text-xs` en detalle
- **Color**: `text-gray-500` (secundario, no distrae del precio)

### Layout:
- **Cards**: Ubicado entre modelo y stock
- **Detalle (precio)**: Badge destacado con borde
- **Detalle (info)**: Formato tabular con labels claros

---

## ✅ Verificación

### Producto de ejemplo: [475] - 225/60R18 SCORPN

```json
{
  "sku": "[475]",
  "name": "225/60R18 104H XL SCORPN",
  "stock": 35,
  "features": {
    "codigo_proveedor": "3839300",
    "proveedor": "PIRELLI NEUMATICOS SAIC",
    "stock_por_sucursal": {
      "catamarca": 15,
      "salta": 19,
      "santiago": 1
    }
  }
}
```

### ✅ Checklist:
- [x] Código visible en catálogo principal
- [x] Código visible en catálogo agro/camiones
- [x] Código visible en detalle (precio)
- [x] Código y proveedor en información adicional
- [x] Todos los 741 productos actualizados
- [x] Estilos consistentes en toda la app
- [x] Font-mono para mejor legibilidad

---

## 🚀 Resultado Final

**Sistema 100% operativo** con información completa de proveedor:

1. ✅ **Catálogo**: Código de proveedor visible en todas las cards
2. ✅ **Detalle**: Código destacado debajo del precio
3. ✅ **Información**: Código y nombre de proveedor en tabla
4. ✅ **Base de datos**: 741 productos con información completa

---

## 📝 Archivos Modificados

1. `scripts/update_stock_from_excel.py` - Script de actualización
2. `src/app/productos/ProductsClient.tsx` - Catálogo principal
3. `src/app/agro-camiones/AgroCamionesClient.tsx` - Catálogo agro
4. `src/features/products/catalog/ProductDetail.tsx` - Vista de detalle

---

**Actualización completada exitosamente**
**Sistema: Neumáticos del Valle**
**Desarrollado por: Gabriel Fontenla con Claude Code**
