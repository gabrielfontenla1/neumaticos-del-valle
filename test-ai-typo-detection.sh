#!/bin/bash

echo "🧪 Testing AI Typo Detection for Tire Sizes..."
echo ""

# Test 1: Common typo - 176 instead of 175
echo "TEST 1: Typo Detection - 176/65R14"
echo "================================="
curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hola, necesito neumáticos 176/65R14 para un Polo"}
    ],
    "stream": false
  }' | jq '.content' -r

echo ""
echo ""

# Test 2: Another typo - 186 instead of 185
echo "TEST 2: Typo Detection - 186/60R15"
echo "================================="
curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Busco 186/60R15, tienen stock?"}
    ],
    "stream": false
  }' | jq '.content' -r

echo ""
echo ""

# Test 3: Valid size - should not suggest correction
echo "TEST 3: Valid Size - 185/60R14"
echo "================================"
curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Necesito 4 neumáticos 185/60R14"}
    ],
    "stream": false
  }' | jq '.content' -r

echo ""
echo ""

# Test 4: Another typo - 206 instead of 205
echo "TEST 4: Typo Detection - 206/55R16"
echo "=================================="
curl -s -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Precio de 206/55R16?"}
    ],
    "stream": false
  }' | jq '.content' -r

echo ""
echo "✅ Tests complete!"