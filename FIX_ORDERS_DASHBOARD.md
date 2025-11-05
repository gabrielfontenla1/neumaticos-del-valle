# 🔧 Fix Orders Dashboard - Instrucciones Completas

## 📝 El Problema
El dashboard de órdenes no funciona porque **la tabla `orders` no existe en Supabase**. Esto se confirmó con el diagnóstico:
- ❌ La tabla `orders` no está creada
- ✅ La tabla `vouchers` existe
- ❌ La API devuelve error 500 porque no encuentra la tabla

## ✅ Solución Paso a Paso

### Paso 1: Crear las Tablas en Supabase

1. **Abre Supabase Dashboard**
   - Ve a: https://app.supabase.com/project/oyiwyzmaxgnzyhmmkstr
   - Navega a: **SQL Editor** (en el menú lateral izquierdo)

2. **Ejecuta el Script SQL**
   - Haz clic en **"New query"**
   - Copia TODO el contenido del archivo: `src/database/migrations/create_orders_tables_fixed.sql`
   - Pega en el editor SQL
   - Haz clic en **"Run"** (botón verde)

   El script creará:
   - ✅ Tabla `orders` con 20 campos
   - ✅ Tabla `order_history` para auditoría
   - ✅ Índices para mejor performance
   - ✅ Políticas RLS (Row Level Security)
   - ✅ Triggers automáticos
   - ✅ Funciones helper

3. **Verifica que las tablas se crearon**
   - En Supabase, ve a **Table Editor**
   - Deberías ver:
     - `orders` (nueva)
     - `order_history` (nueva)
     - `vouchers` (ya existente)

### Paso 2: Verificar el Sistema

1. **Ejecuta el script de diagnóstico:**
   ```bash
   node src/scripts/diagnose-orders.mjs
   ```

   Deberías ver:
   ```
   ✅ Table 'orders' exists and is accessible
   ✅ Orders table has 0 records
   ✅ API is working
   ✅ Orders system is properly configured!
   ```

2. **Prueba el Dashboard:**
   - Ve a: http://localhost:6001/admin/orders
   - Deberías ver el dashboard vacío (sin órdenes aún)
   - Sin errores en la consola

### Paso 3: Crear una Orden de Prueba

1. **Método 1: Desde el Checkout (Recomendado)**
   - Ve a http://localhost:6001/productos
   - Agrega productos al carrito
   - Ve al checkout
   - Completa el formulario
   - Click en "Enviar pedido por WhatsApp"
   - Esto creará un voucher Y una orden

2. **Método 2: Directamente en Supabase**
   - En SQL Editor, ejecuta:
   ```sql
   INSERT INTO orders (
     order_number,
     customer_name,
     customer_email,
     customer_phone,
     items,
     subtotal,
     tax,
     shipping,
     total_amount,
     payment_method,
     source,
     notes
   ) VALUES (
     'ORD-2025-00001',
     'Juan Pérez',
     'juan@example.com',
     '+54 11 1234-5678',
     '[{
       "product_id": "test-001",
       "name": "Neumático Michelin 205/55R16",
       "quantity": 2,
       "price": 45000,
       "total_price": 90000
     }]'::jsonb,
     90000.00,
     0.00,
     0.00,
     90000.00,
     'efectivo',
     'whatsapp',
     'Orden de prueba'
   );
   ```

3. **Verifica en el Dashboard:**
   - Actualiza http://localhost:6001/admin/orders
   - Deberías ver la orden creada
   - Puedes cambiar el estado con el dropdown

### Paso 4: Verificar Funcionalidades

#### ✅ Filtros del Dashboard
- **Por Estado**: pending, confirmed, processing, shipped, delivered, cancelled
- **Por Estado de Pago**: pending, completed, failed, refunded
- **Por Origen**: website, whatsapp, phone, in_store, admin
- **Por Fecha**: Rango de fechas
- **Búsqueda**: Por nombre, email o teléfono

#### ✅ Acciones Disponibles
- Cambiar estado de orden (dropdown inline)
- Ver detalles de la orden
- Exportar órdenes (próximamente)
- Paginación automática

## 📊 Scripts de Utilidad

### Verificar Sistema Completo
```bash
# Diagnóstico completo
node src/scripts/diagnose-orders.mjs

# Test de flujo completo
node src/scripts/test-order-flow.mjs
```

### Limpiar Datos de Prueba
```sql
-- En Supabase SQL Editor
DELETE FROM orders WHERE notes LIKE '%prueba%';
DELETE FROM vouchers WHERE code LIKE 'NDV-TEST%';
```

## 🚨 Troubleshooting

### Si el dashboard sigue sin funcionar:

1. **Verifica las variables de entorno:**
   ```bash
   cat .env.local | grep SUPABASE
   ```
   Asegúrate que tienes:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Reinicia el servidor:**
   ```bash
   # Detén con Ctrl+C y vuelve a iniciar
   npm run dev
   ```

3. **Verifica en la consola del navegador:**
   - F12 → Console
   - Busca errores rojos
   - Si dice "Failed to fetch", es problema de API/RLS

4. **Verifica las políticas RLS:**
   En Supabase → Authentication → Policies → orders table
   - Debe tener: "Enable all for orders"
   - Si no, créala manualmente

## ✅ Confirmación Final

El sistema está funcionando correctamente cuando:
1. ✅ No hay errores en la consola del navegador
2. ✅ El dashboard carga sin errores
3. ✅ Puedes ver las órdenes (si hay alguna)
4. ✅ Los filtros funcionan
5. ✅ Puedes cambiar el estado de las órdenes
6. ✅ Al hacer checkout, se crea una orden automáticamente

## 📞 Soporte

Si algo no funciona:
1. Ejecuta el diagnóstico: `node src/scripts/diagnose-orders.mjs`
2. Revisa los logs del servidor Next.js
3. Verifica en Supabase → Logs → API Logs

---

**IMPORTANTE**: Este sistema está configurado para desarrollo. Para producción, deberás:
- Ajustar las políticas RLS para mayor seguridad
- Configurar autenticación de administradores
- Agregar validaciones adicionales
- Configurar backups automáticos