const http = require('http');

console.log('🔍 MONITOR DE WEBHOOKS KOMMO');
console.log('=' + '='.repeat(50));
console.log('Esperando webhooks en http://localhost:6001/api/kommo/webhook');
console.log('Panel de ngrok: http://127.0.0.1:4040');
console.log('=' + '='.repeat(50) + '\n');

// Hacer polling cada 5 segundos para ver el estado
setInterval(async () => {
  try {
    const response = await fetch('http://localhost:6001/api/kommo/webhook');
    const data = await response.json();
    console.log(`[${new Date().toLocaleTimeString()}] Health check: ${data.status}`);
  } catch (error) {
    console.log(`[${new Date().toLocaleTimeString()}] Server check failed`);
  }
}, 5000);

console.log('Presiona Ctrl+C para detener el monitoreo\n');