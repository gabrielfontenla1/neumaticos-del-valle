#!/bin/bash

echo "🧪 Testing AI Context with specific questions..."
echo ""

# Test 1: Business info
echo "TEST 1: Pregunta sobre el negocio"
echo "================================"
curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "¿Dónde están ubicados y cuáles son sus horarios?"}
    ],
    "stream": false
  }' | jq '.content' -r

echo ""
echo ""

# Test 2: Product search
echo "TEST 2: Búsqueda de productos específicos"
echo "========================================="
curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Necesito 4 neumáticos 205/55R16, ¿qué opciones tienen?"}
    ],
    "stream": false
  }' | jq '.content' -r

echo ""
echo ""

# Test 3: Technical question
echo "TEST 3: Pregunta técnica"
echo "========================"
curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "¿Qué significa el código 91H en un neumático?"}
    ],
    "stream": false
  }' | jq '.content' -r

echo ""
echo "✅ Tests complete!"