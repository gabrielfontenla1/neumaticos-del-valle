# Skill: /verify-prices

## Descripcion
Verifica y compara precios y/o stock entre el ecommerce (base de datos) y un archivo Excel.
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

## Modos de Verificacion

### Modo Completo (Precios + Stock)
Cuando el Excel tiene columnas `CONTADO`, `PUBLICO` y sucursales:
- Verifica precios coincidan
- Verifica stock coincida

### Modo Solo Precios
Cuando el Excel tiene `CONTADO`/`PUBLICO` pero NO sucursales:
- Solo verifica que los precios coincidan

### Modo Solo Stock
Cuando el Excel tiene sucursales pero NO `CONTADO`/`PUBLICO`:
- Solo verifica que el stock coincida
- **NO revisa precios**

## Uso

### Deteccion automatica de origen
```
/verify-prices /ruta/al/archivo.xlsx
```

### Especificar origen manualmente
```
/verify-prices /ruta/al/archivo.xlsx --pirelli
/verify-prices /ruta/al/archivo.xlsx --corven
```

## Instrucciones para Claude

Cuando el usuario ejecute `/verify-prices` con una ruta a un Excel:

1. **Validar el archivo**: Verificar que el archivo existe y es un .xlsx

2. **Detectar origen** (si no se especifica):
   - Leer las primeras 50 filas del Excel
   - Verificar valores en columna CATEGORIA
   - Si tiene AGR/CMO/VI → origen=corven
   - Si tiene CON/SUV/CAR/VAN/MOT → origen=pirelli

3. **Confirmar con usuario si hay duda**:
   - Si se detecta un origen pero el usuario especifico otro, advertir
   - Preguntar confirmacion antes de continuar

4. **Ejecutar el script de verificacion**:
```bash
python3 /Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle/scripts/verify_prices_excel.py "<ruta_excel>" [--pirelli|--corven]
```

5. **Interpretar resultados**: Mostrar al usuario un resumen de:
   - Origen detectado (Pirelli o Corven)
   - Modo de verificacion detectado
   - Total de productos comparados
   - Productos correctos
   - Productos con diferencias de precio (si aplica)
   - Productos con diferencias de stock (si aplica)
   - Productos no encontrados
   - Detalle de discrepancias si las hay

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

## Verificaciones que realiza

### Si hay columnas de precio:
1. **Precio contado**: Compara CONTADO del Excel con `price` de la BD (tolerancia $1)
2. **Precio de lista**: Compara PUBLICO del Excel con `features.price_list` de la BD

### Si hay columnas de stock:
1. **Stock total**: Compara suma de sucursales del Excel con `stock` de la BD (debe coincidir exacto)
2. **Stock por sucursal**: Usa `features.stock_by_branch` (campo actual)
3. **Campo legacy**: Detecta si existe `features.stock_por_sucursal` (campo obsoleto) y lo reporta

## Ejemplos de salida

### Excel Pirelli detectado automaticamente
```
Usuario: /verify-prices /Downloads/stockprecionov.xlsx

Claude: Analizando archivo...
Origen detectado: PIRELLI (categorias: CON, SUV, CAR, VAN)
Modo: Precios + Stock
741 filas procesadas

VERIFICACION DE PRECIOS Y STOCK: EXCEL vs ECOMMERCE
============================================================
Total productos en Excel: 741
Todo correcto: 738 (99.6%)
Con diferencias de precio: 2
Con diferencias de stock: 1
No encontrados: 0

✅ Verificacion completada
```

### Excel Corven con origen especificado
```
Usuario: /verify-prices /Downloads/corven2.xlsx --corven

Claude: Ejecutando verificacion para CORVEN...
Modo: Solo Stock
139 filas procesadas

VERIFICACION DE STOCK: EXCEL vs ECOMMERCE
============================================================
Total productos en Excel: 139
Todo correcto: 137 (98.6%)
Con diferencias de stock: 2
No encontrados: 0

✅ Verificacion completada
```

### Excel solo con stock
```
Usuario: /verify-prices /Downloads/stock_only.xlsx

Claude: Analizando archivo...
Origen detectado: PIRELLI (categorias: CON, SUV)
Modo: Solo Stock (sin columnas de precio)

VERIFICACION DE STOCK: EXCEL vs ECOMMERCE
============================================================
Total productos en Excel: 300
Todo correcto: 298 (99.3%)
Con diferencias de stock: 2
```

### Advertencia de mismatch
```
Usuario: /verify-prices /Downloads/corven2.xlsx --pirelli

Claude: ⚠️ ADVERTENCIA: Seleccionaste Pirelli pero el archivo tiene
categorias de Corven (AGR, CMO, VI).

¿Deseas continuar de todas formas o cambiar a Corven?
1. Continuar como Pirelli
2. Cambiar a Corven (recomendado)
```

## Dashboard

Tambien disponible verificacion rapida desde el panel de administracion:
**http://localhost:6001/admin/stock/update**

Con la opcion de analizar antes de actualizar para ver discrepancias.
