# Guía de Prueba de Webhook Kommo

## 1. Probar con un Lead nuevo (más simple)

En Kommo, configura el webhook para recibir eventos de "Lead creado":
1. En la configuración del webhook, marca: "Lead añadido" o "Lead created"
2. Guarda los cambios
3. Crea un nuevo lead manualmente en Kommo
4. Verifica si llega el webhook

## 2. Verificar la configuración de WhatsApp Business en Kommo

Para que los mensajes de WhatsApp disparen webhooks:

1. **WhatsApp Business debe estar conectado** en Kommo:
   - Configuración → Integraciones → WhatsApp Business
   - Debe mostrar "Conectado" o "Connected"

2. **El canal de WhatsApp debe estar activo**:
   - Verifica que puedas enviar y recibir mensajes en Kommo

3. **Los permisos deben incluir mensajes**:
   - En la integración privada, verifica los scopes/permisos
   - Debe incluir permisos para leer mensajes/chats

## 3. Configuración de Automatización para WhatsApp

En Kommo, crea esta automatización:

```
TRIGGER: Mensaje entrante de WhatsApp
↓
CONDICIÓN (opcional): Si el mensaje contiene "neumático" o "llanta"
↓
ACCIÓN 1: Enviar webhook a: https://62e371e93e00.ngrok-free.app/api/kommo/webhook
↓
ACCIÓN 2 (opcional): Añadir etiqueta "Bot IA" al lead
```

## 4. Verificar con CURL directamente

Prueba que tu webhook funciona correctamente:

```bash
curl -X POST https://62e371e93e00.ngrok-free.app/api/kommo/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "add": [{
        "id": "test123",
        "chat_id": "chat456",
        "contact_id": 789,
        "text": "Test desde CURL",
        "origin": "whatsapp",
        "created_at": 1699999999,
        "author": {
          "name": "Test User",
          "type": "contact"
        }
      }]
    }
  }'
```

## 5. Revisar los Logs de Kommo

En Kommo, busca si hay logs de webhooks:
1. Configuración → Historial de webhooks
2. O en la sección de la integración privada
3. Busca errores o intentos fallidos

## 6. Verificar el Token de Autenticación

Algunas integraciones de Kommo requieren un token:
1. En tu integración privada, copia el "Secret Key" o "Token"
2. Podrías necesitar agregarlo como header en el webhook

## Troubleshooting

### Si los webhooks no llegan:

1. **Verifica ngrok**: Asegúrate de que ngrok no haya expirado (sesión de 2 horas en plan gratuito)
2. **Revisa el firewall**: Kommo podría estar bloqueado
3. **Prueba con webhook.site**: Usa https://webhook.site para verificar si Kommo envía algo
4. **Contacta soporte de Kommo**: Podrían necesitar activar algo en tu cuenta

### Logs para revisar:

- Panel de ngrok: http://127.0.0.1:4040
- Logs del servidor: En la terminal donde corre `npm run dev`
- Monitor de webhooks: El script `monitor-webhooks.js`