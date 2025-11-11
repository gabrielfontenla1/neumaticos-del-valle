#!/usr/bin/env node

// Test script for AI Chat API
const fetch = require('node-fetch');

async function testChat() {
  console.log('🧪 Testing AI Chat API...\n');

  const messages = [
    {
      role: 'user',
      content: 'Hola, necesito 4 neumáticos 205/55R16'
    }
  ];

  try {
    const response = await fetch('http://localhost:6001/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        stream: false // Use non-streaming for simpler testing
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', response.status, error);
      return;
    }

    const data = await response.json();
    console.log('✅ Response received!\n');
    console.log('📝 AI Response:', data.content);
    console.log('\n📊 Metadata:');
    console.log('- Model:', data.model);
    console.log('- Tokens used:', data.usage);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testChat();