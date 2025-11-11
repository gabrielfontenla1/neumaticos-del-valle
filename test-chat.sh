#!/bin/bash

echo "🧪 Testing AI Chat API..."
echo ""

# Test with a product query
curl -s -X POST http://localhost:6001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hola, necesito 4 neumáticos 205/55R16"}], "stream": false}' \
  | jq '.content' -r

echo ""
echo "✅ Test complete!"