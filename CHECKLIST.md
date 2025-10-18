# ✅ Deployment Checklist - Neumáticos del Valle

## 📋 Pre-Deployment

### Code Quality
- [ ] TypeScript compiles without errors: `npm run type-check`
- [ ] No console.log statements in production code
- [ ] All TODOs resolved or documented
- [ ] Code formatted: `npm run format`

### Testing
- [ ] Smoke tests pass: `npm test`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] Manual testing completed on localhost
- [ ] Mobile responsive testing done

### Environment
- [ ] `.env.local` configured for development
- [ ] `.env.example` is up to date
- [ ] No secrets in code or repository
- [ ] All environment variables documented

### Database
- [ ] Supabase project created
- [ ] Database migrations applied: `npm run migrate`
- [ ] RLS policies configured
- [ ] Initial data seeded (if needed)

## 🚀 Deployment Steps

### 1. Final Checks
```bash
# Run deployment readiness check
npm run deploy:check

# Build locally to verify
npm run build:prod
```

### 2. Git Operations
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Ready for production deployment - FASE 6 complete"

# Push to GitHub
git push origin main
```

### 3. Railway Setup
- [ ] Railway account created
- [ ] New project created in Railway
- [ ] GitHub repository connected
- [ ] Auto-deploy from main branch enabled

### 4. Environment Variables (Railway Dashboard)

#### Required
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL` (use Railway domain)
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER`

#### Database
- [ ] `DATABASE_URL` (if using migrations)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

#### Optional
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` (Google Analytics)
- [ ] `NEXT_SHARP_PATH=/tmp/node_modules/sharp`
- [ ] `NEXT_TELEMETRY_DISABLED=1`

### 5. Deploy
- [ ] Push triggers automatic deployment
- [ ] Monitor build logs in Railway dashboard
- [ ] Wait for "Deployment successful" status
- [ ] Note the deployment URL

## 🧪 Post-Deployment Testing

### Immediate (First 15 minutes)
- [ ] Site loads: https://your-app.up.railway.app
- [ ] Health check: https://your-app.up.railway.app/api/health
- [ ] Run smoke tests against production:
  ```bash
  NEXT_PUBLIC_SITE_URL=https://your-app.up.railway.app npm test
  ```

### Critical Paths
- [ ] **Home Page**: Loads correctly with hero and features
- [ ] **Products**: Catalog displays, filters work
- [ ] **WhatsApp**: Links open WhatsApp correctly
- [ ] **Services**: Service list displays
- [ ] **Appointments**: Form submits successfully
- [ ] **Reviews**: Can submit review, voucher generates
- [ ] **Admin**: Login page accessible, protected routes work

### Performance
- [ ] Page load time < 3 seconds
- [ ] Images load and optimize correctly
- [ ] No console errors in browser
- [ ] Mobile responsive on real devices

## 📊 Monitoring

### Railway Dashboard
- [ ] CPU usage normal (< 50% average)
- [ ] Memory usage stable
- [ ] No crash/restart loops
- [ ] Response times acceptable

### Supabase Dashboard
- [ ] Database connections healthy
- [ ] No failed queries
- [ ] Storage usage normal
- [ ] Auth events logging

### Application Logs
- [ ] Check Railway logs for errors
- [ ] Monitor health endpoint
- [ ] Review any warning messages

## 🔧 Common Issues & Fixes

### Build Fails
```bash
# Clear Railway cache and redeploy
# Check package-lock.json is committed
# Verify all dependencies in package.json
```

### Environment Variables
```bash
# Double-check in Railway dashboard
# Ensure no typos or missing values
# Check for proper formatting (no quotes)
```

### Database Connection
```bash
# Verify DATABASE_URL format
# Check Supabase is not paused
# Test connection locally with same credentials
```

### Performance Issues
```bash
# Check image sizes and optimization
# Review API query efficiency
# Enable caching headers
# Check for memory leaks in logs
```

## 🎉 Launch Ready

### Final Steps
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (Railway provides)
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] Team notified of go-live

### Documentation
- [ ] README.md updated
- [ ] DEPLOYMENT.md reviewed
- [ ] Admin credentials secured
- [ ] Support contacts documented

## 📞 Emergency Contacts

### Quick Rollback
```bash
# In Railway Dashboard:
# Deployments > Select previous > Redeploy

# Or via Git:
git revert HEAD
git push origin main
```

### Support
- Railway Discord: https://discord.gg/railway
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: [Your repository]

---

**Remember**: Take screenshots of successful deployment for documentation!

**Celebrate**: You've successfully deployed Neumáticos del Valle! 🎊