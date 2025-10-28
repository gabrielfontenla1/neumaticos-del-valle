# Módulo de Importación de Excel - Documentación

## Resumen
El módulo de importación de Excel en el dashboard de administrador ha sido actualizado con la misma lógica de normalización y procesamiento que el script de Python `import-pirelli-stock.py`. Ahora puede manejar tanto formatos simples como formatos con stock por sucursales.

## Características Implementadas

### 1. Normalización Automática de Datos
- **Extracción de Dimensiones**: Detecta automáticamente ancho, perfil y diámetro desde la descripción
- **Limpieza de Descripciones**: Elimina códigos y espacios innecesarios
- **Códigos de Producto**: Limpia y normaliza códigos propios y de proveedor

### 2. Categorización Inteligente
Categoriza automáticamente los productos en:
- **auto**: Neumáticos para autos (ancho < 195mm)
- **camioneta**: Neumáticos para camionetas/SUV (ancho ≥ 235mm o modelos SCORPION)
- **camion**: Neumáticos para camiones (sufijo C, prefijo LT, CARRIER, CHRONO)
- **moto**: Neumáticos para motos (M/C, TT, MT 60, SUPER CITY)

### 3. Manejo de Stock por Sucursales
Detecta y procesa columnas de stock para las siguientes sucursales:
- BELGRANO
- CATAMARCA
- LA_BANDA
- SALTA
- TUCUMAN
- VIRGEN

El stock total se calcula sumando el stock de todas las sucursales.

### 4. Uso de Service Role Key
- Utiliza `SUPABASE_SERVICE_ROLE_KEY` para bypass de políticas RLS
- Permite importación masiva sin restricciones de seguridad a nivel de fila
- Implementado en el endpoint API `/api/admin/import-products`

### 5. Opción de Eliminar Productos Existentes
- Checkbox opcional para eliminar todos los productos antes de importar
- Útil para reemplazar completamente el catálogo
- Incluye advertencia visual para prevenir eliminaciones accidentales

## Archivos Modificados/Creados

### Nuevos Archivos

1. **`/src/features/products/utils/importHelpers.ts`**
   - Funciones de normalización y procesamiento
   - `parseTireSize()`: Extrae dimensiones usando regex
   - `determineCategory()`: Categorización automática
   - `processStockBySucursal()`: Procesamiento de stock
   - `normalizeExcelRow()`: Normalización de filas
   - `convertToProduct()`: Conversión a formato de producto

2. **`/src/app/api/admin/import-products/route.ts`**
   - Endpoint API para importación server-side
   - Usa service role key para bypass de RLS
   - Maneja eliminación opcional de productos existentes
   - Importación en batches de 50 productos

### Archivos Modificados

1. **`/src/features/products/import/ExcelImporter.tsx`**
   - UI mejorada con detección de formato
   - Checkbox para eliminar productos existentes
   - Información visual sobre normalización
   - Templates duales (simple y sucursales)

2. **`/src/features/products/api.ts`**
   - Función `importProducts()` actualizada
   - Llama al nuevo endpoint API en lugar de procesar client-side
   - Soporte para flag de eliminación

## Proceso de Importación

### Flujo de Trabajo

1. **Carga del Archivo**
   - Usuario arrastra o selecciona archivo Excel
   - Sistema lee y muestra preview de primeros 10 registros

2. **Detección de Formato**
   - Analiza headers para detectar columnas de sucursales
   - Muestra indicador visual si es formato con sucursales

3. **Procesamiento**
   - Cliente envía datos al endpoint API
   - Servidor aplica normalización con service role key
   - Importación en batches para mejor manejo de errores

4. **Resultados**
   - Muestra resumen de importación
   - Indica productos importados exitosamente
   - Reporta errores por batch si los hay

### Patrones de Dimensiones Soportados

```javascript
// Patrones regex para extracción de dimensiones
175/65R15        → width: 175, profile: 65, diameter: 15
175/65 R 15      → width: 175, profile: 65, diameter: 15
175/65-R15       → width: 175, profile: 65, diameter: 15
175/65ZR15       → width: 175, profile: 65, diameter: 15
5.20S12          → width: 0, profile: 0, diameter: 12
```

## Templates de Excel

### Formato Simple
```
| sku | name | brand | model | category | width | profile | diameter | price | stock | description |
```

### Formato con Sucursales
```
| CODIGO_PROPIO | CODIGO_PROVEEDOR | DESCRIPCION | MARCA | BELGRANO | CATAMARCA | LA_BANDA | SALTA | TUCUMAN | VIRGEN | PROVEEDOR |
```

## Uso del Módulo

### Para Administradores

1. Navegar al dashboard de administración
2. Buscar sección "Importar Productos"
3. Descargar template si es necesario
4. Cargar archivo Excel
5. Revisar preview y opciones
6. Opcionalmente marcar "Eliminar productos existentes"
7. Click en "Importar X productos"
8. Revisar resultados

### Para Desarrolladores

```typescript
// Importar con eliminación de existentes
import { importProducts } from '@/features/products/api';

const result = await importProducts(excelData, true); // true = eliminar existentes
```

## Scripts de Utilidad

### Script de Prueba
```bash
node scripts/test-import-simple.js
```
Verifica:
- Configuración del entorno
- Archivos del módulo
- Formato del Excel
- Service role key

### Script de Importación Python (Original)
```bash
python3 scripts/import-pirelli-stock.py
```
Script original que sirvió de base para la implementación.

## Configuración Requerida

### Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx  # Crítico para bypass de RLS
```

### Permisos de Base de Datos
- Tabla `products` debe existir
- Categorías válidas: 'auto', 'camioneta', 'camion', 'moto'
- Service role key debe tener permisos completos

## Solución de Problemas

### Error: RLS Policy Violation
**Causa**: Falta service role key o está mal configurada
**Solución**: Verificar `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`

### Error: Category Check Constraint
**Causa**: Categoría no válida en el producto
**Solución**: El sistema ahora valida y corrige automáticamente

### Error: Import Batch Failed
**Causa**: Datos malformados o duplicados
**Solución**: Revisar el batch específico en los logs

## Mejoras Futuras Sugeridas

1. **Validación Previa**: Validar datos antes de enviar al servidor
2. **Importación Incremental**: Opción de actualizar solo productos existentes
3. **Mapeo de Columnas**: UI para mapear columnas personalizadas
4. **Histórico de Importaciones**: Guardar log de importaciones realizadas
5. **Rollback**: Capacidad de revertir última importación
6. **Precios por Sucursal**: Manejar precios diferenciados si es necesario

## Conclusión

El módulo de importación de Excel ahora tiene paridad completa con el script de Python original, incluyendo:
- ✅ Normalización automática de datos
- ✅ Extracción inteligente de dimensiones
- ✅ Categorización automática
- ✅ Manejo de stock por sucursales
- ✅ Bypass de RLS con service role key
- ✅ Opción de eliminar productos existentes

El módulo está listo para producción y puede manejar tanto formatos simples como el formato complejo de Pirelli con stock por sucursales.