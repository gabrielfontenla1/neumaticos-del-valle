# 🚀 Deployment Guide - Neumáticos del Valle

This guide covers the complete deployment process for the Neumáticos del Valle web application to Railway with Supabase backend.

## 📋 Pre-Deployment Checklist

### 1. Code Readiness
- [ ] All features from FASE 0-6 are complete
- [ ] Code passes TypeScript checks: `npm run type-check`
- [ ] No console errors in development
- [ ] All tests passing: `npm test`

### 2. Environment Setup
- [ ] `.env.local` file exists with development variables
- [ ] `.env.example` is up to date
- [ ] `.gitignore` includes sensitive files
- [ ] No secrets committed to repository

### 3. Database Setup
- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] Initial data seeded
- [ ] RLS policies configured

## 🔧 Setup Instructions

### Step 1: Supabase Configuration

1. **Create Supabase Project**
   ```bash
   # Go to https://app.supabase.io
   # Create new project
   # Save your project URL and keys
   ```

2. **Apply Database Schema**
   ```bash
   # Run migration script
   npm run migrate
   ```

3. **Configure RLS Policies**
   - Go to Supabase Dashboard > Authentication > Policies
   - Ensure policies are set for:
     - `products` - Public read
     - `services` - Public read
     - `appointments` - Public write, admin read
     - `reviews` - Public write, public read
     - `admin_users` - Admin only

### Step 2: Railway Setup

1. **Create Railway Account**
   - Sign up at [railway.app](https://railway.app)
   - Connect GitHub account

2. **Create New Project**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli

   # Login to Railway
   railway login

   # Initialize project
   railway init
   ```

3. **Connect GitHub Repository**
   - In Railway dashboard, click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `main` branch

### Step 3: Environment Variables

Set these in Railway Dashboard > Variables:

#### Required Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Site
NEXT_PUBLIC_SITE_URL=https://your-app.up.railway.app
NEXT_PUBLIC_WHATSAPP_NUMBER=5491122334455

# Database (for migrations)
DATABASE_URL=postgresql://...
```

#### Optional Variables
```env
# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Performance
NEXT_SHARP_PATH=/tmp/node_modules/sharp
NEXT_TELEMETRY_DISABLED=1
```

### Step 4: Deploy

1. **Initial Deployment**
   ```bash
   # Commit all changes
   git add .
   git commit -m "Ready for production deployment"

   # Push to GitHub
   git push origin main
   ```

2. **Railway will automatically:**
   - Detect Next.js app
   - Install dependencies
   - Build the application
   - Start the server

3. **Monitor Deployment**
   - Watch build logs in Railway dashboard
   - Check for any errors
   - Wait for "Deployment successful" status

## 🧪 Testing Deployment

### Run Deployment Check
```bash
npm run deploy:check
```

### Run Smoke Tests
```bash
# Against production
NEXT_PUBLIC_SITE_URL=https://your-app.up.railway.app npm test
```

### Manual Testing Checklist
- [ ] Home page loads
- [ ] Products catalog displays
- [ ] WhatsApp links work
- [ ] Appointment form submits
- [ ] Review submission works
- [ ] Admin login protected
- [ ] Images load correctly
- [ ] Mobile responsive

## 📊 Monitoring

### Setup Monitoring

1. **Railway Metrics**
   - CPU usage
   - Memory usage
   - Request count
   - Response times

2. **Supabase Dashboard**
   - Database connections
   - API requests
   - Storage usage
   - Auth events

3. **Google Analytics** (if configured)
   - User sessions
   - Page views
   - Conversion events
   - Performance metrics

## 🔄 Continuous Deployment

### Automatic Deployments
Railway automatically deploys when you push to `main` branch:

```bash
# Make changes
git add .
git commit -m "Update: description"
git push origin main
# Railway deploys automatically
```

### Manual Deployment
```bash
# Using Railway CLI
railway up

# Or trigger in dashboard
# Railway Dashboard > Deployments > Deploy
```

## 🐛 Troubleshooting

### Common Issues

#### Build Fails
```bash
# Check logs
railway logs

# Common fixes:
# 1. Clear cache in Railway dashboard
# 2. Check package-lock.json is committed
# 3. Verify all dependencies are listed
```

#### Environment Variables Missing
```bash
# Verify in Railway dashboard
# Settings > Variables

# Test locally with production vars
NODE_ENV=production npm run build
```

#### Database Connection Issues
```bash
# Check Supabase status
# Verify DATABASE_URL format
# Test connection locally
npm run migrate
```

#### Performance Issues
```bash
# Enable caching
# Check image optimization
# Review API calls
# Use Railway metrics
```

## 🚨 Rollback Procedure

If deployment causes issues:

1. **Immediate Rollback**
   ```bash
   # In Railway Dashboard
   # Deployments > Select previous deployment > Redeploy
   ```

2. **Git Rollback**
   ```bash
   # Revert last commit
   git revert HEAD
   git push origin main
   ```

3. **Database Rollback**
   ```sql
   -- In Supabase SQL Editor
   -- Run rollback migration if needed
   ```

## 📝 Post-Deployment Checklist

### Immediate (First Hour)
- [ ] Site accessible via public URL
- [ ] Run smoke tests: `npm test`
- [ ] Check error logs
- [ ] Test critical user paths
- [ ] Verify WhatsApp integration

### First Day
- [ ] Monitor performance metrics
- [ ] Check database queries
- [ ] Review user feedback
- [ ] Test all forms
- [ ] Verify email notifications

### First Week
- [ ] Analyze traffic patterns
- [ ] Optimize slow queries
- [ ] Review error reports
- [ ] Update documentation
- [ ] Plan next improvements

## 🔐 Security Checklist

- [ ] Environment variables secure
- [ ] No secrets in code
- [ ] HTTPS enabled (Railway default)
- [ ] RLS policies active
- [ ] Admin routes protected
- [ ] Input validation working
- [ ] SQL injection prevention
- [ ] XSS protection headers

## 📞 Support Contacts

### Railway
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Supabase
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Status: https://status.supabase.com

## 🎉 Launch Steps

1. **Final Testing**
   ```bash
   npm run deploy:check
   npm test
   npm run test:e2e
   ```

2. **Deploy to Production**
   ```bash
   git push origin main
   ```

3. **Verify Deployment**
   - Check Railway dashboard
   - Test production URL
   - Monitor metrics

4. **Announce Launch**
   - Update DNS records (if custom domain)
   - Share with stakeholders
   - Begin monitoring

## 📅 Maintenance Schedule

### Daily
- Check error logs
- Monitor performance
- Review user feedback

### Weekly
- Database backups
- Security updates check
- Performance analysis

### Monthly
- Dependency updates
- Full backup
- Performance optimization
- Security audit

---

**Remember:** Always test in development first, maintain backups, and have a rollback plan ready.

For urgent issues, check Railway and Supabase status pages first.