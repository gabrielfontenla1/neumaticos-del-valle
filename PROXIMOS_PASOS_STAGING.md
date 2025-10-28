# 🚀 Próximos Pasos para Completar Staging

## ✅ Estado Actual

- ✅ Ambiente `staging` creado en Railway
- ✅ Branches `main`, `staging`, `development` listos en GitHub
- ✅ Script de configuración automática listo
- ✅ Documentación completa disponible
- ⚠️ **PENDIENTE**: Crear servicio en ambiente staging (requiere Dashboard)

## 🎯 Paso 1: Crear Servicio en Railway Dashboard

### Instrucciones Rápidas

1. **Abre Railway Dashboard**: https://railway.app/
2. **Selecciona** el proyecto **"angelic-truth"**
3. **Cambia al ambiente** "staging" (selector arriba)
4. **Click en "+ New"** → **"GitHub Repo"**
5. **Selecciona**: `gabrielfontenla1/neumaticos-del-valle`
6. **⚠️ CONFIGURACIÓN CRÍTICA**:
   ```
   Service Name: neumaticos-del-valle
   Branch: staging          ← ¡MUY IMPORTANTE!
   Root Directory: /
   Build Command: npm run build
   Start Command: npm start
   ```
7. **Click "Deploy"**

### ⏸️ Opcional: Cancelar Primer Deploy

Si quieres configurar variables antes del primer deploy:
- Ve a **Deployments**
- Click en el deployment → Tres puntos → **Cancel**
- Esto está bien, deployaremos después de configurar variables

---

## 🎯 Paso 2: Configurar Variables Automáticamente

Una vez creado el servicio, ejecuta:

```bash
cd /Users/gabrielfontenla/Desktop/Proyectos/Apps/NeumaticosDelValle/neumaticos-del-valle
./scripts/configure-staging.sh
```

Este script configurará automáticamente **TODAS** las variables necesarias:
- Variables de ambiente (staging, no under construction)
- Supabase (URL, keys, database)
- Resend (email)
- OpenAI (API key)
- WhatsApp
- Performance (PORT, hostname, sharp)

---

## 🎯 Paso 3: Verificar Configuración

### Auto-Deploy

Verifica en Dashboard → Staging → neumaticos-del-valle → Settings → Deploy:
```
✅ Auto-deploy: ON
✅ Deploy on push: ON
✅ Branch: staging
```

### Variables

Verifica que todas las variables estén configuradas:
```bash
railway environment staging
railway variables
```

Deberías ver aproximadamente 17-18 variables, incluyendo:
- `NEXT_PUBLIC_ENVIRONMENT=staging`
- `NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false`
- Todas las de Supabase, Resend, etc.

---

## 🎯 Paso 4: Probar el Deployment

### Ver Logs del Deploy

```bash
railway environment staging
railway logs
```

Deberías ver:
```
✓ Build successful
✓ Container started
✓ Ready in ~800ms
```

### Obtener URL de Staging

En Dashboard → Settings → Domains, verás algo como:
```
https://staging-neumaticos-XXXXX.up.railway.app
```

### Verificar que Funciona

Abre la URL de staging en el navegador:
- ✅ Debería mostrar el **sitio completo** (NO "Under Construction")
- ✅ Todas las páginas deberían funcionar

---

## 🎯 Paso 5: Probar el Workflow Completo

### Test Auto-Deploy a Staging

```bash
# Asegúrate de estar en development
git checkout development

# Hacer un cambio pequeño
echo "\n## Test Auto-Deploy" >> README.md

# Commit y push
git add .
git commit -m "test: verificar auto-deploy staging"
git push origin development

# Merge a staging
git checkout staging
git merge development
git push origin staging

# Ver que Railway deploya automáticamente
railway environment staging
railway logs
```

---

## 📊 Resultado Final Esperado

### URLs Funcionales

| Ambiente | URL | Muestra | Auto-Deploy |
|----------|-----|---------|-------------|
| **Production** | https://www.neumaticosdelvalle.com | Under Construction ✅ | Sí (branch: main) |
| **Staging** | https://staging-neumaticos-XXXXX.up.railway.app | Sitio Completo ✅ | Sí (branch: staging) |
| **Development** | http://localhost:3000 | Sitio Completo | No (local) |

### Workflow de Desarrollo

```bash
# Desarrollo diario
git checkout development
# ... hacer cambios ...
git push origin development

# Testing en Staging
git checkout staging
git merge development
git push origin staging
# → Railway auto-deploya a staging

# Release a Production
git checkout main
git merge staging
git push origin main
# → Railway auto-deploya a production
```

---

## 📚 Documentación Adicional

Si necesitas más detalles:

1. **RAILWAY_DASHBOARD_SETUP.md** - Guía paso a paso completa (500+ líneas)
2. **RAILWAY_MCP_CONTEXT.md** - Contexto técnico completo (341 líneas)
3. **RAILWAY_SETUP_COMPLETE.md** - Resumen del setup completo
4. **DEPLOYMENT.md** - Guía de workflow diario

---

## ⏱️ Tiempo Estimado

- **Paso 1** (Dashboard): 3-5 minutos
- **Paso 2** (Script): 1 minuto
- **Paso 3** (Verificación): 2 minutos
- **Paso 4** (Testing): 5 minutos
- **Paso 5** (Workflow): 5 minutos

**TOTAL: ~15-20 minutos**

---

## ❓ ¿Problemas?

### El servicio no aparece después de crearlo

- Refresca el Dashboard
- Verifica que seleccionaste el branch "staging"
- Verifica permisos de GitHub

### El script falla

- Verifica que estés autenticado: `railway whoami`
- Verifica que el servicio esté creado
- Ejecuta línea por línea manualmente si es necesario

### Build falla

- Verifica que todas las variables estén configuradas
- Especialmente: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Re-deploya después de agregar variables

### Staging muestra "Under Construction"

- Verifica: `NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false`
- Verifica: `NEXT_PUBLIC_ENVIRONMENT=staging`
- Re-deploya para aplicar cambios

---

## 🎉 ¡Éxito!

Una vez completados todos los pasos, tendrás:

- ✅ Sistema multi-ambiente completamente funcional
- ✅ Auto-deploy en staging y production
- ✅ Workflow de desarrollo → staging → production
- ✅ Production con Under Construction
- ✅ Staging con sitio completo para testing

**¡Listo para desarrollar profesionalmente!** 🚀
