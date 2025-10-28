# 🚂 Guía Paso a Paso: Railway Dashboard Setup

**Proyecto**: Neumáticos del Valle
**Railway Project**: angelic-truth
**Fecha**: 2025-10-18

---

## 📋 Tabla de Contenidos

1. [Vista General](#vista-general)
2. [Paso 1: Verificar Production](#paso-1-verificar-production)
3. [Paso 2: Crear Servicio en Staging](#paso-2-crear-servicio-en-staging)
4. [Paso 3: Configurar Variables](#paso-3-configurar-variables)
5. [Paso 4: Verificar Auto-Deploy](#paso-4-verificar-auto-deploy)
6. [Paso 5: Probar el Flujo](#paso-5-probar-el-flujo)
7. [Troubleshooting](#troubleshooting)

---

## Vista General

### 🎯 Objetivo Final

Configurar 2 ambientes en Railway que funcionan automáticamente:

| Ambiente | Branch | URL | Muestra | Status |
|----------|--------|-----|---------|--------|
| **Production** | `main` | neumaticosdelvallesrl.com | Under Construction | ✅ Listo |
| **Staging** | `staging` | staging-neumaticos.up.railway.app | Sitio Completo | ⚠️ Pendiente |

### ✅ Ya Completado

- ✅ Código multi-ambiente implementado
- ✅ Branches creados (main, staging, development)
- ✅ Ambiente Production funcionando
- ✅ Variables Production configuradas
- ✅ Ambiente Staging creado (vacío)

### 🚨 Falta Completar

- ⚠️ Crear servicio en Staging
- ⚠️ Configurar variables en Staging
- ⚠️ Verificar branches configuration
- ⚠️ Probar auto-deploy

---

## Paso 1: Verificar Production

### 1.1 Acceder al Dashboard

1. Ve a https://railway.app/
2. Login con tu cuenta de Maria Gomez
3. Busca el proyecto **"angelic-truth"**
4. Click para abrirlo

### 1.2 Verificar Ambiente Production

1. En el selector de ambiente (arriba), selecciona **"production"**
2. Deberías ver un servicio llamado **"neumaticos-del-valle"**
3. Click en el servicio

### 1.3 Verificar Branch

1. Dentro del servicio, ve a **Settings** → **Source**
2. Verifica que el **Branch** sea `main`
3. Si no es `main`:
   - Click en el dropdown de Branch
   - Selecciona `main`
   - Click **Save**

### 1.4 Verificar Auto-Deploy

1. En Settings → **Deploy**
2. Asegúrate de que esté configurado:
   ```
   ✅ Auto-deploy: ON
   ✅ Deploy on push: ON
   ✅ Branch: main
   ```

### 1.5 Verificar Variables (Opcional)

1. Ve a **Variables**
2. Deberías ver:
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_ENVIRONMENT=production`
   - `NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=true`
   - Todas las variables de Supabase, Resend, etc.

✅ **Production verificado y listo**

---

## Paso 2: Crear Servicio en Staging

### 2.1 Cambiar a Ambiente Staging

1. En el selector de ambiente (arriba), cambia a **"staging"**
2. Deberías ver un ambiente vacío (sin servicios)

### 2.2 Agregar Nuevo Servicio

1. Click en el botón **"+ New"**
2. Selecciona **"GitHub Repo"**

### 2.3 Conectar Repositorio

1. Busca y selecciona: **gabrielfontenla1/neumaticos-del-valle**
2. Si no aparece, click en "Configure GitHub App" y otorga permisos

### 2.4 Configurar Servicio

**⚠️ IMPORTANTE - Configuración Crítica:**

```yaml
Service Name: neumaticos-del-valle
Branch: staging          # ⚠️ MUY IMPORTANTE
Root Directory: /
Build Command: npm run build
Start Command: npm start
```

### 2.5 Crear Servicio

1. Click **"Deploy"**
2. Railway comenzará a crear el servicio
3. **NO lo dejaremos deployar todavía** - necesitamos las variables primero

### 2.6 Cancelar Primer Deploy (Opcional)

Si el deploy ya empezó:
1. Ve a **Deployments**
2. Click en el deployment en progreso
3. Click en los tres puntos → **Cancel**
4. Esto está bien - configuraremos las variables y deployaremos de nuevo

✅ **Servicio en Staging creado**

---

## Paso 3: Configurar Variables

Ahora configuraremos TODAS las variables necesarias en Staging.

### Opción A: Usar Script Automatizado (Recomendado)

Desde tu terminal, ejecuta:

```bash
cd /Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle
./scripts/configure-staging.sh
```

Este script configurará automáticamente todas las variables.

### Opción B: Configurar Manualmente desde Dashboard

Si prefieres hacerlo manual:

#### 3.1 Variables de Control de Ambiente

En Staging → neumaticos-del-valle → Variables, agrega:

```bash
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false
NEXT_PUBLIC_SITE_URL=https://staging-neumaticos.up.railway.app
NEXT_PUBLIC_URL=https://staging-neumaticos.up.railway.app
```

#### 3.2 Variables de Supabase

```bash
NEXT_PUBLIC_SUPABASE_URL=https://oyiwyzmaxgnzyhmmkstr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aXd5em1heGduenlobW1rc3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODIzNzksImV4cCI6MjA3NTg1ODM3OX0.H7Hmb4fVQA17UdDGp5ZaWsXLXO1fYs0ZY280NZNDUQM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aXd5em1heGduenlobW1rc3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4MjM3OSwiZXhwIjoyMDc1ODU4Mzc5fQ.i6FMnZo-QsCYH6oQUQcrLtK6naPu5HdE-_3FXhwgWbM
DATABASE_URL=postgresql://postgres.oyiwyzmaxgnzyhmmkstr:xesti0-sejgyb-Kepvym@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### 3.3 Variables de Servicios

```bash
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=info@neumaticosdelvalle.com
NEXT_PUBLIC_WHATSAPP_NUMBER=5493856771265
OPENAI_API_KEY=your_openai_api_key_here
```

#### 3.4 Variables de Performance

```bash
NEXT_SHARP_PATH=/tmp/node_modules/sharp
NEXT_TELEMETRY_DISABLED=1
PORT=8080
HOSTNAME=0.0.0.0
```

### 3.5 Verificar Variables

1. Ve a Variables
2. Deberías tener aproximadamente 17-18 variables configuradas
3. Verifica que `NEXT_PUBLIC_ENVIRONMENT=staging` ✅

✅ **Variables en Staging configuradas**

---

## Paso 4: Verificar Auto-Deploy

### 4.1 Staging Auto-Deploy

1. En Staging → neumaticos-del-valle
2. Ve a Settings → **Deploy**
3. Configura:
   ```
   ✅ Auto-deploy: ON
   ✅ Deploy on push: ON
   ✅ Branch: staging
   ```

### 4.2 Trigger Manual Deploy

1. Ve a **Deployments**
2. Click **"Deploy"** → **"Trigger Deploy"**
3. Railway deployará staging automáticamente

### 4.3 Monitorear Deploy

1. Ve a **Deployments**
2. Click en el deployment activo
3. Monitorea los logs - deberías ver:
   ```
   ✓ Build successful
   ✓ Container started
   ✓ Ready in ~800ms
   ```

### 4.4 Obtener URL de Staging

1. Una vez deployado, ve a **Settings** → **Domains**
2. Verás un dominio auto-generado como:
   `staging-neumaticos-XXXXX.up.railway.app`
3. Copia esta URL

✅ **Auto-deploy configurado y primer deploy exitoso**

---

## Paso 5: Probar el Flujo

### 5.1 Verificar URLs

Abre en tu navegador:

1. **Production**: https://www.neumaticosdelvalle.com
   - Debería mostrar: **Under Construction** ✅

2. **Staging**: https://staging-neumaticos-XXXXX.up.railway.app
   - Debería mostrar: **Sitio Completo** ✅

### 5.2 Probar Auto-Deploy a Staging

Desde tu terminal:

```bash
# Asegúrate de estar en development
git checkout development

# Hacer un cambio pequeño (ej: editar README)
echo "\n## Test" >> README.md

# Commit y push
git add .
git commit -m "test: verificar auto-deploy staging"
git push origin development

# Merge a staging
git checkout staging
git merge development
git push origin staging

# Ver logs de Railway
railway environment staging
railway logs
```

Deberías ver que Railway detecta el push y deploya automáticamente.

### 5.3 Probar Auto-Deploy a Production

⚠️ **Solo cuando estés listo para producción:**

```bash
git checkout main
git merge staging
git push origin main

# Ver logs
railway environment production
railway logs
```

✅ **Flujo de trabajo verificado y funcionando**

---

## Troubleshooting

### Problema: Servicio no aparece en Staging

**Solución**:
1. Verifica que el repositorio esté conectado
2. Verifica que Railway tenga permisos en GitHub
3. Intenta desconectar y reconectar el repo

### Problema: Build falla con "Missing env variables"

**Solución**:
1. Verifica que TODAS las variables estén configuradas
2. Especialmente verifica:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Re-deploya después de agregar las variables

### Problema: Staging muestra Under Construction

**Solución**:
1. Verifica que `NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false`
2. Verifica que `NEXT_PUBLIC_ENVIRONMENT=staging`
3. Re-deploya para aplicar cambios

### Problema: Auto-deploy no funciona

**Solución**:
1. Verifica Settings → Deploy → Auto-deploy: ON
2. Verifica que el branch correcto esté configurado
3. Verifica permisos de GitHub
4. Prueba un deploy manual primero

### Problema: Error 502 en Staging

**Solución**:
1. Verifica que `PORT=8080` esté configurado
2. Verifica que `HOSTNAME=0.0.0.0` esté configurado
3. Verifica los logs: `railway logs`

---

## ✅ Checklist Final

Marca cada item cuando lo completes:

### Production
- [ ] Ambiente production existe
- [ ] Servicio neumaticos-del-valle vinculado
- [ ] Branch = `main`
- [ ] Variables configuradas correctamente
- [ ] Auto-deploy: ON
- [ ] URL funciona y muestra Under Construction

### Staging
- [ ] Ambiente staging existe
- [ ] Servicio neumaticos-del-valle creado
- [ ] Branch = `staging`
- [ ] Todas las variables configuradas
- [ ] `NEXT_PUBLIC_ENVIRONMENT=staging`
- [ ] `NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false`
- [ ] Auto-deploy: ON
- [ ] URL funciona y muestra Sitio Completo

### Workflow
- [ ] Push a staging → auto-deploya
- [ ] Push a main → auto-deploya
- [ ] Staging muestra sitio completo
- [ ] Production muestra under construction

---

## 🎉 Setup Completado

Una vez que todos los checkboxes estén marcados, tu setup multi-ambiente está completo y listo para usar.

### Workflow Diario

**Desarrollo**:
```bash
git checkout development
# hacer cambios
git push origin development
```

**Testing en Staging**:
```bash
git checkout staging
git merge development
git push origin staging  # Auto-deploya a staging
```

**Release a Production**:
```bash
git checkout main
git merge staging
git push origin main  # Auto-deploya a production
```

---

**Última actualización**: 2025-10-18
**Autor**: Claude Code
**Proyecto**: Neumáticos del Valle
