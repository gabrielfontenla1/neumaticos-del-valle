# Skill: /update-stock

## Descripcion
Actualiza stock y precios de productos en Supabase desde un archivo Excel.
Soporta dos origenes: **Pirelli** (autos) y **Corven** (agro/camiones).
**Detecta automaticamente** el origen basado en los valores de la columna CATEGORIA.

## Origenes Soportados

### Pirelli (Autos)
- Productos: Neumaticos de autos, SUVs, camionetas, motos
- Categorias en Excel: `CON`, `SUV`, `CAR`, `VAN`, `MOT`
- Destino: Catalogo principal (`/productos`)

### Corven (Agro/Camiones)
- Productos: Neumaticos agricolas, camiones, industriales
- Categorias en Excel: `AGR`, `CMO`, `VI`, `OTR`
- Destino: Catalogo agro (`/agro-camiones`)

## Deteccion Automatica

El sistema detecta el origen analizando los valores de la columna `CATEGORIA`:
- Si contiene `AGR`, `CMO`, `VI` → **Corven**
- Si contiene `CON`, `SUV`, `CAR`, `VAN`, `MOT` → **Pirelli**

## Modos de Operacion

### Modo Completo (Stock + Precios)
Cuando el Excel tiene columnas `CONTADO`, `PUBLICO` y sucursales:
- Actualiza `price` desde CONTADO
- Actualiza `features.price_list` desde PUBLICO
- Actualiza `stock` sumando sucursales
- Actualiza `features.stock_by_branch` con detalle por sucursal

### Modo Solo Stock
Cuando el Excel **NO tiene** columnas `CONTADO`/`PUBLICO` pero SI tiene sucursales:
- Solo actualiza `stock` sumando sucursales
- Solo actualiza `features.stock_by_branch`
- **NO modifica los precios existentes en la BD**

## Uso

### Deteccion automatica de origen
```
/update-stock /ruta/al/archivo.xlsx
```

### Especificar origen manualmente
```
/update-stock /ruta/al/archivo.xlsx --pirelli
/update-stock /ruta/al/archivo.xlsx --corven
```

## Instrucciones para Claude

Cuando el usuario ejecute `/update-stock` con una ruta a un Excel:

1. **Validar el archivo**: Verificar que el archivo existe y es un .xlsx

2. **Detectar origen** (si no se especifica):
   - Leer las primeras 50 filas del Excel
   - Verificar valores en columna CATEGORIA
   - Si tiene AGR/CMO/VI → origen=corven
   - Si tiene CON/SUV/CAR/VAN/MOT → origen=pirelli

3. **Confirmar con usuario si hay duda**:
   - Si se detecta un origen pero el usuario especifico otro, advertir
   - Preguntar confirmacion antes de continuar

4. **Ejecutar via API del dashboard**:
```bash
curl -X POST http://localhost:6001/api/admin/stock/update \
  -F file=@"<ruta_excel>" \
  -F action=update \
  -F source=<pirelli|corven>
```

5. **Interpretar resultados**: Mostrar al usuario un resumen de:
   - Origen detectado (Pirelli o Corven)
   - Modo de actualizacion (completo o solo stock)
   - Productos actualizados
   - Productos no encontrados
   - Errores si los hay

## Formato del Excel esperado

Ambos origenes usan la misma estructura de Pirelli/Geveco:
- Primera fila: Titulo (se salta automaticamente)
- Segunda fila: Headers
- Columna **obligatoria**:
  - `CODIGO_PROPIO`: Codigo unico del producto (ej: `[1]`, `[10]`)
- Columnas de **deteccion de origen**:
  - `CATEGORIA`: Valores que determinan si es Pirelli o Corven
- Columnas **opcionales de precio**:
  - `PUBLICO`: Precio de lista (precio tachado)
  - `CONTADO`: Precio real (con descuento 25%)
- Columnas **opcionales de stock**:
  - `CATAMARCA`, `LA_BANDA`, `SALTA`, `SANTIAGO`, `TUCUMAN`, `VIRGEN`, `BELGRANO`

## Dashboard

Tambien disponible en el panel de administracion:
**http://localhost:6001/admin/stock/update**

Con interfaz visual para:
1. Seleccionar origen (Pirelli/Corven)
2. Arrastrar y soltar archivo
3. Ver deteccion automatica
4. Confirmar y actualizar

## Ejemplos

### Excel Pirelli detectado automaticamente
```
Usuario: /update-stock /Downloads/stockprecionov.xlsx

Claude: Analizando archivo...
Origen detectado: PIRELLI (categorias: CON, SUV, CAR, VAN)
Modo: Stock + Precios
741 filas procesadas

Ejecutando actualizacion...
✅ 741 productos actualizados
⚠️ 0 no encontrados
```

### Excel Corven con origen especificado
```
Usuario: /update-stock /Downloads/corven2.xlsx --corven

Claude: Ejecutando actualizacion para CORVEN...
Modo: Stock + Precios
139 filas procesadas

✅ 120 productos actualizados
⚠️ 19 no encontrados (nuevos productos)
```

### Advertencia de mismatch
```
Usuario: /update-stock /Downloads/corven2.xlsx --pirelli

Claude: ⚠️ ADVERTENCIA: Seleccionaste Pirelli pero el archivo tiene
categorias de Corven (AGR, CMO, VI).

¿Deseas continuar de todas formas o cambiar a Corven?
1. Continuar como Pirelli
2. Cambiar a Corven (recomendado)
```
