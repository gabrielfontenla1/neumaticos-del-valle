#!/bin/bash

echo "🧪 Testing AI Configuration System"
echo "=================================="
echo ""

# Test health endpoint
echo "1. Testing health check..."
curl -s http://localhost:6001/api/admin/settings/ai/health | jq '.status' || echo "⚠️  Server not running"
echo ""

# Test configurations load
echo "2. Testing configuration endpoints..."
echo "   - Models config..."
curl -s http://localhost:6001/api/admin/settings/ai/models | jq '.success' || echo "⚠️  Failed"
echo "   - Prompts config..."
curl -s http://localhost:6001/api/admin/settings/ai/prompts | jq '.success' || echo "⚠️  Failed"
echo "   - Bot config..."
curl -s http://localhost:6001/api/admin/settings/ai/whatsapp-bot | jq '.success' || echo "⚠️  Failed"
echo "   - Function tools..."
curl -s http://localhost:6001/api/admin/settings/ai/function-tools | jq '.success' || echo "⚠️  Failed"
echo ""

echo "✅ Basic tests completed"
echo ""
echo "To test the UI:"
echo "1. Start dev server: npm run dev"
echo "2. Navigate to: http://localhost:6001/admin/chats"
echo "3. Click on 'Configuración IA' tab"
