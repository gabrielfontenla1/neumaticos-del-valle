# Contexto Completo para Railway MCP - Neumáticos del Valle

## 📋 INFORMACIÓN DEL PROYECTO

**Nombre**: Neumáticos del Valle
**Repositorio GitHub**: https://github.com/gabrielfontenla1/neumaticos-del-valle
**Railway Project**: angelic-truth
**Project ID**: `0ed91d35-b255-4998-b308-d6b47fab8d4b`
**Service ID**: `5a750c70-2432-46ea-a44a-861a6bffad32`
**Service Name**: neumaticos-del-valle

**Stack Tecnológico**:
- **Framework**: Next.js 15.5.3 (React 19.1.0)
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **Hosting**: Railway
- **Language**: TypeScript
- **Node Version**: >=20.0.0

## 🌳 ESTRUCTURA DE BRANCHES (Git)

```
main (production)     → Production Environment (Under Construction)
  ↓ merge desde staging
staging (pre-prod)    → Staging Environment (Full Site)
  ↓ merge desde development
development (trabajo) → Local Development (Full Site)
```

**Estado Actual**:
- ✅ Branch `main` - existe en GitHub (actualmente deployado en production)
- ✅ Branch `staging` - existe en GitHub (pendiente deployment)
- ✅ Branch `development` - existe en GitHub (solo local)

**Último Commit en main**: `9bfd0c0 - feat: Implement professional multi-environment setup`

## 🚂 ESTADO ACTUAL DE RAILWAY

### Production Environment (Configurado ✅)
- **Environment ID**: `841673b6-8234-4960-b550-993631f2213b`
- **Branch vinculado**: `main` (debería estar, verificar)
- **Service**: neumaticos-del-valle (activo)
- **URL Pública**: https://www.neumaticosdelvalle.com
- **URL Railway**: https://neumaticos-del-valle-production.up.railway.app

### Staging Environment (Creado pero incompleto ⚠️)
- **Estado**: Environment creado pero sin servicio vinculado
- **Branch objetivo**: `staging`
- **Service**: None (PENDIENTE CREAR)
- **URL objetivo**: staging-neumaticos.up.railway.app (auto-generada)

## 🔑 VARIABLES DE ENTORNO

### Variables en Production (✅ Configuradas)

```bash
# Environment Control
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=true
NEXT_PUBLIC_SITE_URL=https://www.neumaticosdelvalle.com
NEXT_PUBLIC_URL=https://neumaticos-del-valle-production.up.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://oyiwyzmaxgnzyhmmkstr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aXd5em1heGduenlobW1rc3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODIzNzksImV4cCI6MjA3NTg1ODM3OX0.H7Hmb4fVQA17UdDGp5ZaWsXLXO1fYs0ZY280NZNDUQM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aXd5em1heGduenlobW1rc3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4MjM3OSwiZXhwIjoyMDc1ODU4Mzc5fQ.i6FMnZo-QsCYH6oQUQcrLtK6naPu5HdE-_3FXhwgWbM
DATABASE_URL=postgresql://postgres.oyiwyzmaxgnzyhmmkstr:xesti0-sejgyb-Kepvym@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# Email
RESEND_API_KEY=re_123456789_YOUR_API_KEY_HERE
RESEND_FROM_EMAIL=info@neumaticosdelvalle.com

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=5493856771265

# AI
OPENAI_API_KEY=your_openai_api_key_here

# Performance
NEXT_SHARP_PATH=/tmp/node_modules/sharp
NEXT_TELEMETRY_DISABLED=1
PORT=8080
HOSTNAME=0.0.0.0
```

### Variables NECESARIAS en Staging (⚠️ PENDIENTE)

```bash
# Environment Control (DIFERENTES)
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false
NEXT_PUBLIC_SITE_URL=https://staging-neumaticos.up.railway.app

# Resto de variables IGUALES a production
# (Supabase, Resend, OpenAI, WhatsApp, Performance, etc.)
```

**⚠️ IMPORTANTE**: La única diferencia entre Production y Staging son las variables de control de ambiente:
- `NEXT_PUBLIC_ENVIRONMENT`: production vs staging
- `NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION`: true vs false
- `NEXT_PUBLIC_SITE_URL`: URL correspondiente

## 🎯 OBJETIVO DEL MULTI-AMBIENTE

### Comportamiento Esperado

| Ambiente | Branch | URL | Muestra | Auto-Deploy |
|----------|--------|-----|---------|-------------|
| **Development** | `development` | `localhost:3000` | Full Site | No (local) |
| **Staging** | `staging` | `staging-neumaticos.up.railway.app` | Full Site | Sí |
| **Production** | `main` | `www.neumaticosdelvalle.com` | Under Construction | Sí |

### Lógica de Renderizado (Implementada en código)

**Archivo**: `src/lib/env.ts`
```typescript
export function getEnvironment(): Environment {
  const envVar = process.env.NEXT_PUBLIC_ENVIRONMENT
  if (envVar === 'staging' || envVar === 'production') return envVar
  if (process.env.NODE_ENV === 'development') return 'development'
  const showUnderConstruction = process.env.NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION === 'true'
  return showUnderConstruction ? 'production' : 'staging'
}

export function shouldShowUnderConstruction(): boolean {
  const env = getEnvironment()
  return env === 'production'
}
```

**Archivo**: `src/app/page.tsx`
```typescript
export default function Home() {
  const showUnderConstruction = shouldShowUnderConstruction();
  return showUnderConstruction ? <UnderConstruction /> : <TeslaHomePage />;
}
```

## ✅ TAREAS COMPLETADAS

- [x] Crear branches: development, staging, main
- [x] Implementar sistema de detección de ambiente (`src/lib/env.ts`)
- [x] Implementar renderizado condicional (`src/app/page.tsx`)
- [x] Crear página Under Construction (`src/components/UnderConstruction.tsx`)
- [x] Crear ambiente Production en Railway
- [x] Configurar variables en Production
- [x] Crear ambiente Staging en Railway
- [x] Subir todo a GitHub

## 🚨 TAREAS PENDIENTES (URGENTE)

### 1. Vincular Servicio en Staging Environment ⚠️

**Problema**: El ambiente staging existe pero no tiene servicio vinculado.

**Solución Requerida**:
```
En Railway Dashboard:
1. Seleccionar ambiente "staging"
2. Click "+ New" → "Service"
3. Seleccionar "GitHub Repo"
4. Conectar: gabrielfontenla1/neumaticos-del-valle
5. IMPORTANTE: Seleccionar branch "staging"
6. Configurar:
   - Root Directory: /
   - Build Command: npm run build
   - Start Command: npm start
```

### 2. Configurar Variables en Staging ⚠️

Copiar TODAS las variables de production excepto las de control de ambiente:

```bash
# Variables a cambiar:
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false
NEXT_PUBLIC_SITE_URL=https://staging-neumaticos.up.railway.app

# Variables a copiar igual:
- DATABASE_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- NEXT_PUBLIC_WHATSAPP_NUMBER
- OPENAI_API_KEY
- NEXT_SHARP_PATH
- NEXT_TELEMETRY_DISABLED
- PORT
- HOSTNAME
- NODE_ENV=production (sí, production en staging también)
```

### 3. Configurar Branch en Production ⚠️

**Verificar/Configurar**:
```
En Railway Dashboard → Production → neumaticos-del-valle:
1. Settings → Source
2. Verificar que Branch = "main"
3. Si está en otra branch, cambiar a "main"
```

### 4. Configurar Auto-Deploy en Ambos Ambientes ⚠️

**En Production**:
```
Settings → Deploy
- Auto-deploy: ON
- Deploy on push: ON
- Branch: main
```

**En Staging**:
```
Settings → Deploy
- Auto-deploy: ON
- Deploy on push: ON
- Branch: staging
```

### 5. Configurar Dominios

**Production**:
- Domain: www.neumaticosdelvalle.com (ya configurado)
- Verificar que apunta correctamente

**Staging**:
- Usar dominio auto-generado de Railway
- Formato esperado: staging-neumaticos-XXXXX.up.railway.app

## 🔄 WORKFLOW DE DESARROLLO ESPERADO

### Desarrollo Normal
```bash
git checkout development
# hacer cambios
git add .
git commit -m "feat: nueva funcionalidad"
git push origin development
```
**Resultado**: Solo local, no deploya

### Deploy a Staging (Testing)
```bash
git checkout staging
git merge development
git push origin staging
```
**Resultado**: Railway auto-deploya a staging → Muestra sitio completo

### Deploy a Production (Release)
```bash
git checkout main
git merge staging
git push origin main
```
**Resultado**: Railway auto-deploya a production → Muestra Under Construction

### Alternar Modos en Production
```
Railway Dashboard → Production → Variables:
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false  # Muestra sitio completo
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=true   # Muestra Under Construction
```

## 📝 ARCHIVOS CLAVE DEL PROYECTO

### Configuración de Ambiente
- `src/lib/env.ts` - Sistema de detección de ambiente
- `src/app/page.tsx` - Renderizado condicional
- `.env.development` - Variables locales
- `.env.staging.example` - Template para staging
- `.env.production.example` - Template para production

### Componentes
- `src/components/UnderConstruction.tsx` - Página "Under Construction"
- `src/components/TeslaHomePage.tsx` - Sitio completo

### Documentación
- `RAILWAY_MULTI_ENVIRONMENT_SETUP.md` - Guía completa de setup
- `DEPLOYMENT.md` - Guía rápida de deployment
- `RAILWAY_MCP_CONTEXT.md` - Este archivo

### Railway Configuration
- `railway.toml` - Configuración de build y deploy
- `scripts/start-server.js` - Script de inicio optimizado

## 🎯 RESULTADO FINAL ESPERADO

### URLs Funcionales
- ✅ **Local Dev**: http://localhost:3000 → Full Site
- ⚠️ **Staging**: https://staging-neumaticos.up.railway.app → Full Site (PENDIENTE)
- ✅ **Production**: https://www.neumaticosdelvalle.com → Under Construction

### Auto-Deploy Configurado
- ⚠️ Push a `staging` → Auto-deploy a Staging (PENDIENTE)
- ⚠️ Push a `main` → Auto-deploy a Production (VERIFICAR)

### Control de Visualización
- Production puede alternar entre Under Construction y Full Site con un cambio de variable
- Staging siempre muestra Full Site
- Development siempre muestra Full Site

## 🆘 PROBLEMAS CONOCIDOS

### 1. Servicio en Staging No Existe
**Estado**: Ambiente creado pero vacío
**Necesita**: Agregar servicio desde Dashboard

### 2. Branch Configuration
**Verificar**: Que production esté vinculado a `main` y staging a `staging`

### 3. Variables Staging
**Estado**: No configuradas
**Necesita**: Copiar desde production con modificaciones de ambiente

## 📞 INFORMACIÓN DE CONTACTO (Para Under Construction)

- **Teléfono**: 0385 677-1265 (WhatsApp: 5493856771265)
- **Email**: info@neumaticosdelvalle.com
- **Progreso**: 95%
- **Mensaje**: "Mejorando el servicio para el cliente para que puedas gozar de una atención rápida y cómoda"

## 🔗 ENLACES ÚTILES

- **GitHub Repo**: https://github.com/gabrielfontenla1/neumaticos-del-valle
- **Railway Dashboard**: https://railway.app/
- **Production URL**: https://www.neumaticosdelvalle.com
- **Staging URL**: (pendiente de configuración)

---

**Fecha**: 2025-10-18
**Estado**: Configuración multi-ambiente parcialmente completa
**Prioridad**: Completar setup de Staging para workflow completo
