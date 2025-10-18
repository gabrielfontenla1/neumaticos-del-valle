# Configuración de Resend para Emails

Resend está instalado y configurado en la aplicación. Sigue estos pasos para completar la configuración:

## 1. Obtener API Key de Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta gratuita
2. Verifica tu email
3. En el dashboard, ve a **API Keys**
4. Haz click en **Create API Key**
5. Dale un nombre (ej: "Neumaticos del Valle - Production")
6. Copia la API key (empieza con `re_`)

## 2. Configurar Variables de Entorno

Edita el archivo `.env.local` y actualiza estas variables:

```env
# Email Configuration with Resend
RESEND_API_KEY=re_TU_API_KEY_AQUI
RESEND_FROM_EMAIL=tu-email@tudominio.com
```

**Importante:**
- Reemplaza `re_TU_API_KEY_AQUI` con tu API key real
- Para el email "from", puedes usar:
  - `onboarding@resend.dev` (para testing, gratis)
  - Tu propio dominio después de verificarlo en Resend

## 3. Verificar tu Dominio (Opcional pero Recomendado)

Para enviar desde tu propio dominio (ej: `info@neumaticosdelvalleocr.cl`):

1. Ve a **Domains** en el dashboard de Resend
2. Haz click en **Add Domain**
3. Ingresa tu dominio
4. Agrega los registros DNS que te proporciona Resend
5. Espera la verificación (puede tomar hasta 72 horas)

## 4. Archivos Creados

### `/src/lib/resend.ts`
Configuración e inicialización de Resend

### `/src/lib/email.ts`
Funciones de utilidad para enviar emails:
- `sendAppointmentConfirmation()` - Email de confirmación de turno
- `sendContactFormEmail()` - Email de formulario de contacto
- `sendEmail()` - Función genérica para emails personalizados

### `/src/app/api/send-appointment-email/route.ts`
API route de ejemplo para enviar emails de confirmación

## 5. Cómo Usar

### Desde un API Route:

```typescript
import { sendAppointmentConfirmation } from '@/lib/email'

const result = await sendAppointmentConfirmation({
  to: 'cliente@email.com',
  appointmentId: 'abc123',
  customerName: 'Juan Pérez',
  branchName: 'Sucursal Centro',
  services: ['Alineación', 'Balanceo'],
  date: 'Lunes 15 de Enero',
  time: '10:00'
})

if (result.success) {
  console.log('Email enviado!')
} else {
  console.error('Error:', result.error)
}
```

### Desde el Frontend (llamando al API):

```typescript
const response = await fetch('/api/send-appointment-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'cliente@email.com',
    appointmentId: appointment.id,
    customerName: appointment.customer_name,
    branchName: appointment.branch_name,
    services: appointment.services,
    date: formatDate(appointment.date),
    time: appointment.time
  })
})

const data = await response.json()
```

## 6. Testing

Puedes probar el envío de emails usando:

```bash
curl -X POST http://localhost:3000/api/send-appointment-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "tu-email@test.com",
    "appointmentId": "test123",
    "customerName": "Juan Pérez",
    "branchName": "Sucursal Centro",
    "services": ["Alineación", "Balanceo"],
    "date": "Lunes 15 de Enero",
    "time": "10:00"
  }'
```

## 7. Límites del Plan Gratuito

- **100 emails por día**
- **3,000 emails por mes**
- Perfecto para testing y aplicaciones pequeñas

Para más emails, considera actualizar al plan Pro.

## 8. Recursos Útiles

- [Documentación de Resend](https://resend.com/docs)
- [Verificación de Dominios](https://resend.com/docs/dashboard/domains/introduction)
- [Guía de Next.js](https://resend.com/docs/send-with-nextjs)
- [Plantillas de Email](https://resend.com/docs/dashboard/emails/send-test-email)

## Troubleshooting

### Error: "RESEND_API_KEY is not defined"
- Verifica que el archivo `.env.local` existe
- Reinicia el servidor de desarrollo después de editar `.env.local`

### Emails no llegan
- Verifica que la API key es correcta
- Revisa la carpeta de spam
- Verifica el email "from" (usa `onboarding@resend.dev` para testing)

### Error 400: Invalid from address
- Si usas tu dominio, verifica que esté verificado en Resend
- Usa `onboarding@resend.dev` para testing

---

¿Preguntas? Revisa la [documentación de Resend](https://resend.com/docs) o contacta soporte.
