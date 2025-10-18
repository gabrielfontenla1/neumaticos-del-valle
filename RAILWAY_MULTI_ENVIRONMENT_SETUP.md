# 🚂 Railway Multi-Environment Setup Guide

Guía completa para configurar ambientes de Development, Staging y Production en Railway.

---

## 📋 Tabla de Contenidos

1. [Estructura de Branches](#estructura-de-branches)
2. [Configurar Railway](#configurar-railway)
3. [Variables de Entorno](#variables-de-entorno)
4. [Workflow de Desarrollo](#workflow-de-desarrollo)
5. [Comandos Útiles](#comandos-útiles)
6. [Troubleshooting](#troubleshooting)

---

## 🌳 Estructura de Branches

```
main (producción)     →  Production Environment   (Under Construction)
  ↓
staging (pre-prod)    →  Staging Environment      (Full Site)
  ↓
development (trabajo) →  Local Development        (Full Site)
  ↓
feature/* branches    →  Feature Development      (Local only)
```

### **Branch Purposes:**

- **`main`**: Producción real con usuarios → Muestra "Under Construction"
- **`staging`**: Testing pre-producción → Muestra sitio completo
- **`development`**: Desarrollo activo → Local

---

## 🚀 Configurar Railway

### **Paso 1: Crear Ambientes en Railway**

1. Ve a tu proyecto en Railway Dashboard
2. Click en **"Settings"** → **"Environments"**
3. Click **"New Environment"**

**Crear 2 ambientes:**

#### **Environment 1: Production**
- **Name:** `production`
- **Branch:** `main`
- **Domain:** Tu dominio custom (neumaticosdelvallesrl.com)

#### **Environment 2: Staging**
- **Name:** `staging`
- **Branch:** `staging`
- **Domain:** Auto-generado (staging-neumaticos.up.railway.app)

---

### **Paso 2: Configurar Auto-Deploy**

Para cada ambiente:

1. Click en el ambiente
2. Ve a **"Settings"** → **"Deploy"**
3. Configura:
   ```
   ✅ Auto-deploy: ON
   📌 Branch: [main/staging según ambiente]
   🔄 Deploy on push: ON
   ```

---

### **Paso 3: Configurar Variables de Entorno**

#### **🟢 PRODUCTION Environment**

En Railway Dashboard → Production → Variables:

```bash
# Environment Control
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=true
NEXT_PUBLIC_SITE_URL=https://neumaticosdelvallesrl.com

# Supabase (Production Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-prod-service-role-key
DATABASE_URL=postgresql://postgres:...@db.your-prod-project.supabase.co:5432/postgres

# Email (Production)
RESEND_API_KEY=re_...your-prod-resend-key
RESEND_FROM_EMAIL=info@neumaticosdelvalle.com

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=5493856771265

# Performance
NEXT_SHARP_PATH=/tmp/node_modules/sharp
NEXT_TELEMETRY_DISABLED=1
PORT=8080
```

#### **🟡 STAGING Environment**

En Railway Dashboard → Staging → Variables:

```bash
# Environment Control
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false
NEXT_PUBLIC_SITE_URL=https://staging-neumaticos.up.railway.app

# Supabase (Staging Database - SEPARATE!)
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-staging-service-role-key
DATABASE_URL=postgresql://postgres:...@db.your-staging-project.supabase.co:5432/postgres

# Email (Staging - can be same or test account)
RESEND_API_KEY=re_...your-staging-resend-key
RESEND_FROM_EMAIL=staging@neumaticosdelvalle.com

# WhatsApp (same or test number)
NEXT_PUBLIC_WHATSAPP_NUMBER=5493856771265

# Performance
NEXT_SHARP_PATH=/tmp/node_modules/sharp
NEXT_TELEMETRY_DISABLED=1
PORT=8080
```

---

## 🔄 Workflow de Desarrollo

### **Desarrollo Normal**

```bash
# 1. Trabajar en development branch
git checkout development
git pull origin development

# 2. Crear feature branch (opcional)
git checkout -b feature/nombre-feature

# 3. Hacer cambios y commits
git add .
git commit -m "feat: nueva funcionalidad"

# 4. Subir a development
git checkout development
git merge feature/nombre-feature
git push origin development
```

### **Deploy a Staging**

```bash
# 1. Asegurar que development esté actualizado
git checkout development
git pull origin development

# 2. Merge a staging
git checkout staging
git pull origin staging
git merge development

# 3. Push - Auto-deploy a Railway Staging
git push origin staging

# 4. Verificar en: https://staging-neumaticos.up.railway.app
```

### **Deploy a Production**

```bash
# 1. Verificar que staging funciona correctamente
# Hacer testing en staging environment

# 2. Merge staging → main
git checkout main
git pull origin main
git merge staging

# 3. Push - Auto-deploy a Railway Production
git push origin main

# 4. Verificar en: https://neumaticosdelvallesrl.com
```

---

## 📊 URLs de Ambientes

| Ambiente | Branch | URL | Muestra |
|----------|--------|-----|---------|
| **Development** | `development` | `http://localhost:3000` | Full Site |
| **Staging** | `staging` | `https://staging-neumaticos.up.railway.app` | Full Site |
| **Production** | `main` | `https://neumaticosdelvallesrl.com` | Under Construction |

---

## 🎯 Cómo Alternar Entre Modos

### **Mostrar Sitio Completo en Production**

En Railway Dashboard → Production → Variables:

```bash
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false
```

Guarda y espera el redeploy automático.

### **Mostrar Under Construction en Staging** (para testing)

En Railway Dashboard → Staging → Variables:

```bash
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=true
```

---

## 💡 Comandos Útiles

### **Branches**

```bash
# Ver todas las branches
git branch -a

# Cambiar entre branches
git checkout development
git checkout staging
git checkout main

# Crear nueva feature branch
git checkout -b feature/nombre-feature

# Ver status de branch actual
git status
```

### **Sincronización**

```bash
# Actualizar branch desde GitHub
git pull origin development

# Subir cambios
git push origin development

# Ver diferencias entre branches
git diff development staging
git diff staging main
```

### **Railway CLI (opcional)**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Ver logs en tiempo real
railway logs -e production
railway logs -e staging

# Ejecutar comandos en ambiente
railway run -e staging npm run migrate
```

---

## 🔧 Troubleshooting

### **Error: Variables de entorno no funcionan**

**Solución:**
1. Verificar en Railway Dashboard → [Environment] → Variables
2. Asegurarse que la variable comienza con `NEXT_PUBLIC_` si se usa en el cliente
3. Hacer redeploy manual: Railway Dashboard → [Environment] → Deployments → "Redeploy"

### **Error: Página muestra contenido incorrecto**

**Verificar:**
```bash
# En desarrollo local
console.log('Environment:', process.env.NEXT_PUBLIC_ENVIRONMENT)
console.log('Show Under Construction:', process.env.NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION)
```

**En Railway:**
1. Railway Dashboard → [Environment] → Logs
2. Buscar: "🌍 Environment:"

### **Error: Auto-deploy no funciona**

**Solución:**
1. Railway Dashboard → Settings → Deploy
2. Verificar que "Auto-deploy" está ON
3. Verificar que el Branch correcto está configurado
4. Hacer un commit vacío para forzar deploy:
   ```bash
   git commit --allow-empty -m "chore: trigger deploy"
   git push origin [branch]
   ```

### **Error: Supabase connection failed**

**Verificar:**
1. Variables de Supabase están configuradas en Railway
2. Usar bases de datos separadas para staging/production
3. Verificar que las URLs y keys son correctas

---

## 📝 Checklist de Setup

- [ ] Crear branches: `development`, `staging`
- [ ] Configurar ambientes en Railway
- [ ] Configurar variables de entorno para Production
- [ ] Configurar variables de entorno para Staging
- [ ] Configurar auto-deploy para ambos ambientes
- [ ] Hacer primer push a `staging`
- [ ] Verificar que staging funciona
- [ ] Hacer primer push a `main`
- [ ] Verificar que production muestra Under Construction
- [ ] Documentar URLs de ambientes
- [ ] Testear workflow completo

---

## 🎓 Buenas Prácticas

1. **Nunca hacer push directo a `main`** - Siempre pasar por staging primero
2. **Testear en staging antes de production** - Es para eso
3. **Usar feature branches** para desarrollo de funcionalidades grandes
4. **Commits descriptivos** siguiendo Conventional Commits
5. **Rollback rápido** si algo falla en production:
   ```bash
   git checkout main
   git reset --hard HEAD~1
   git push origin main --force
   ```

---

## 🆘 Soporte

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Next.js Docs**: https://nextjs.org/docs

---

## ✅ Verificación Final

Después de completar el setup, verificar:

1. ✅ Development local funciona: `npm run dev`
2. ✅ Staging URL muestra sitio completo
3. ✅ Production URL muestra Under Construction
4. ✅ Push a staging auto-deploys
5. ✅ Push a main auto-deploys
6. ✅ Variables de entorno funcionan correctamente

---

**¡Setup completo!** 🎉

Ahora tienes un workflow profesional con ambientes separados.
