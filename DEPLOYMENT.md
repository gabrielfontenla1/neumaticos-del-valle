# 🚀 Quick Deployment Guide

## Ambientes

| Ambiente | Branch | URL | Estado |
|----------|--------|-----|--------|
| **Production** | `main` | https://neumaticosdelvallesrl.com | 🟡 Under Construction |
| **Staging** | `staging` | https://staging-neumaticos.up.railway.app | 🟢 Full Site |
| **Development** | `development` | http://localhost:3000 | 🟢 Full Site |

## 🎯 Pasar de Dev → Prod

### 1. Desarrollo Local (Development)
```bash
git checkout development
# hacer cambios
git add .
git commit -m "feat: nueva funcionalidad"
git push origin development
```

### 2. Deploy a Staging (Testing)
```bash
git checkout staging
git merge development
git push origin staging
# Auto-deploy a Staging en Railway
# Verificar en: https://staging-neumaticos.up.railway.app
```

### 3. Deploy a Production
```bash
# Después de verificar staging
git checkout main
git merge staging
git push origin main
# Auto-deploy a Production en Railway
# Verificar en: https://neumaticosdelvallesrl.com
```

## 🔧 Control de Visualización

### Mostrar Under Construction
```bash
# En Railway Dashboard → Production → Variables
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=true
```

### Mostrar Sitio Completo
```bash
# En Railway Dashboard → Production → Variables
NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false
```

## 📚 Documentación Completa

Ver: **[RAILWAY_MULTI_ENVIRONMENT_SETUP.md](./RAILWAY_MULTI_ENVIRONMENT_SETUP.md)**
