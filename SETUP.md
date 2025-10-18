# 🚀 Setup - Neumáticos del Valle

Guía de configuración para poner en funcionamiento el proyecto.

## 📋 Pre-requisitos

- Node.js 18+ instalado
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Railway](https://railway.app) (opcional, para deployment)

## 🔧 Configuración Local

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

#### a) Crear proyecto en Supabase
1. Ir a [supabase.com](https://supabase.com)
2. Crear un nuevo proyecto
3. Esperar a que se complete la configuración (2-3 minutos)

#### b) Ejecutar migraciones
1. Ir a tu proyecto en Supabase Dashboard
2. Ir a "SQL Editor"
3. Ejecutar los archivos de migración en orden:
   - `/supabase/migrations/001_initial_schema.sql`
   - `/supabase/migrations/002_rls_policies.sql`
   - `/supabase/migrations/003_functions.sql`
   - `/supabase/migrations/004_storage_buckets.sql`

#### c) Configurar variables de entorno
1. Copiar `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

2. En Supabase Dashboard, ir a "Settings" > "API"
3. Copiar las siguientes credenciales a `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Opcional (solo para admin operations)
SUPABASE_SERVICE_KEY=tu-service-key-aqui

# WhatsApp Business
NEXT_PUBLIC_WHATSAPP_NUMBER=5491234567890

# Site URL (development)
NEXT_PUBLIC_SITE_URL=http://localhost:6001
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en http://localhost:6001

## 📦 Importar Productos

Una vez que la base de datos esté configurada:

1. Ir a http://localhost:6001/admin/import
2. Preparar un archivo Excel con las siguientes columnas:
   - SKU
   - Nombre
   - Marca
   - Categoría
   - Precio
   - Stock
   - (otros campos opcionales)
3. Arrastrar y soltar el archivo Excel
4. Revisar la vista previa
5. Hacer clic en "Importar Productos"

## 🔐 Acceso Admin

**Credenciales por defecto:**
- URL: http://localhost:6001/admin/login
- Email: `admin@neumaticosdelvalleocr.cl`
- Password: `admin2024`

⚠️ **Importante:** Cambiar estas credenciales en producción.

## ✅ Verificar Instalación

Ejecutar el script de verificación:

```bash
npm run deploy:check
```

Esto verificará:
- ✅ Variables de entorno configuradas
- ✅ Configuración de build correcta
- ✅ Migraciones aplicadas
- ✅ Dependencias instaladas

## 🚀 Deployment a Railway

### 1. Preparar para deployment

```bash
# Verificar que todo esté listo
npm run deploy:check

# Ejecutar tests
npm test
```

### 2. Deployment

1. Crear cuenta en [Railway](https://railway.app)
2. Conectar repositorio de GitHub
3. Railway detectará automáticamente Next.js
4. Configurar variables de entorno en Railway Dashboard
5. Deployment automático en cada push a `main`

### 3. Variables de entorno en Railway

Configurar las mismas variables de `.env.local` en Railway:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_SITE_URL` (URL de Railway)

## 📝 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo (puerto 6001)
- `npm run build` - Build de producción
- `npm start` - Servidor de producción
- `npm test` - Tests smoke
- `npm run test:e2e` - Tests end-to-end
- `npm run deploy:check` - Verificar deployment
- `npm run type-check` - Verificar TypeScript
- `npm run migrate` - Ejecutar migraciones (si usas CLI)

## 🐛 Troubleshooting

### Error: "Cart database not available"
- ✅ Verificar que ejecutaste las migraciones en Supabase
- ✅ Verificar las credenciales en `.env.local`
- ✅ Verificar que el proyecto de Supabase esté activo

### Error: "fetch failed"
- ✅ Verificar la URL de Supabase (sin / al final)
- ✅ Verificar conexión a internet
- ✅ Verificar que las tablas existan en Supabase

### Página en blanco
- ✅ Revisar consola del navegador (F12)
- ✅ Verificar que el servidor esté corriendo
- ✅ Limpiar cache del navegador

## 📞 Soporte

Si tienes problemas, verifica:
1. Logs de Supabase Dashboard
2. Consola del navegador (F12)
3. Terminal donde corre `npm run dev`
4. Archivo `DEPLOYMENT.md` para más detalles

---

¡Listo! Tu aplicación debería estar funcionando ahora. 🎉
