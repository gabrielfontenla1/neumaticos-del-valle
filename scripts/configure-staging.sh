#!/bin/bash

# Script para configurar el ambiente de Staging en Railway
# Ejecutar DESPUÉS de crear el servicio en Staging desde el Dashboard

echo "🚀 Configurando ambiente Staging en Railway..."
echo ""

# Cambiar a ambiente staging
echo "📍 Cambiando a ambiente staging..."
railway environment staging

# Vincular servicio (asumiendo que ya fue creado en el Dashboard)
echo "🔗 Vinculando servicio neumaticos-del-valle..."
railway service neumaticos-del-valle

# Configurar variables de entorno
echo "⚙️  Configurando variables de entorno..."

# Variables de control de ambiente (específicas de staging)
railway variables \
  --set "NODE_ENV=production" \
  --set "NEXT_PUBLIC_ENVIRONMENT=staging" \
  --set "NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION=false" \
  --set "NEXT_PUBLIC_SITE_URL=https://staging-neumaticos.up.railway.app" \
  --set "NEXT_PUBLIC_URL=https://staging-neumaticos.up.railway.app"

echo ""
echo "📦 Configurando variables de Supabase..."

# Supabase (copiar de production)
railway variables \
  --set "NEXT_PUBLIC_SUPABASE_URL=https://oyiwyzmaxgnzyhmmkstr.supabase.co" \
  --set "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aXd5em1heGduenlobW1rc3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODIzNzksImV4cCI6MjA3NTg1ODM3OX0.H7Hmb4fVQA17UdDGp5ZaWsXLXO1fYs0ZY280NZNDUQM" \
  --set "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95aXd5em1heGduenlobW1rc3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDI4MjM3OSwiZXhwIjoyMDc1ODU4Mzc5fQ.i6FMnZo-QsCYH6oQUQcrLtK6naPu5HdE-_3FXhwgWbM" \
  --set "DATABASE_URL=postgresql://postgres.oyiwyzmaxgnzyhmmkstr:xesti0-sejgyb-Kepvym@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

echo ""
echo "✉️  Configurando variables de Email y servicios..."

# Email, WhatsApp, AI
railway variables \
  --set "RESEND_API_KEY=your_resend_api_key_here" \
  --set "RESEND_FROM_EMAIL=info@neumaticosdelvalle.com" \
  --set "NEXT_PUBLIC_WHATSAPP_NUMBER=5493856771265" \
  --set "OPENAI_API_KEY=your_openai_api_key_here"

echo ""
echo "⚡ Configurando variables de Performance..."

# Performance
railway variables \
  --set "NEXT_SHARP_PATH=/tmp/node_modules/sharp" \
  --set "NEXT_TELEMETRY_DISABLED=1" \
  --set "PORT=8080" \
  --set "HOSTNAME=0.0.0.0"

echo ""
echo "✅ Configuración completada!"
echo ""
echo "📊 Verificando estado..."
railway status

echo ""
echo "🎯 Próximos pasos:"
echo "1. Verifica que todas las variables estén configuradas: railway variables"
echo "2. Haz push al branch staging para deployar: git push origin staging"
echo "3. Monitorea el deployment: railway logs"
echo ""
