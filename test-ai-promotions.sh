#!/bin/bash

echo "🧪 Testing AI Promotions for November 2024..."
echo ""

# Test 1: General product inquiry - should include promotions
echo "TEST 1: Product inquiry with promotions"
echo "========================================"
curl -s -X POST http://localhost:6001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Necesito 4 neumáticos 185/60R14, ¿qué opciones tienen?"}
    ],
    "stream": false
  }' | jq '.content' -r

echo ""
echo ""

# Test 2: Payment methods inquiry
echo "TEST 2: Payment methods and financing"
echo "====================================="
curl -s -X POST http://localhost:6001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "¿Qué opciones de pago tienen? ¿Puedo pagar en cuotas?"}
    ],
    "stream": false
  }' | jq '.content' -r

echo ""
echo ""

# Test 3: Wednesday promotion inquiry
echo "TEST 3: Wednesday special promotion"
echo "===================================="
curl -s -X POST http://localhost:6001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "¿Tienen alguna promoción especial los miércoles?"}
    ],
    "stream": false
  }' | jq '.content' -r

echo ""
echo ""

# Test 4: Specific card inquiry
echo "TEST 4: Naranja card options"
echo "============================="
curl -s -X POST http://localhost:6001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "¿Qué planes tienen con Naranja?"}
    ],
    "stream": false
  }' | jq '.content' -r

echo ""
echo "✅ Tests complete!"