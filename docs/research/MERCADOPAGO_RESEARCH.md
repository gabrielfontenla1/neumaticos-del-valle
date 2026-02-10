# MercadoPago - Investigación de Payment Gateway

**Fecha de investigación**: Febrero 2026
**Investigador**: teammate "mercadopago"
**Proyecto**: Neumáticos del Valle (e-commerce Next.js 15)
**País objetivo**: Argentina

---

## Resumen Ejecutivo

MercadoPago es la plataforma de pagos líder en Argentina con la mayor penetración de mercado. Ofrece múltiples métodos de integración (Checkout Pro, Checkout Bricks, Checkout API) y soporta todos los medios de pago locales incluyendo tarjetas, efectivo (Rapipago/Pago Fácil), y cuotas sin tarjeta. Las comisiones varían según el plazo de liberación de fondos (1.49% a 6.29% + IVA).

**Veredicto preliminar**: ✅ Altamente recomendado para e-commerce argentino

---

## 1. API y SDK

### 1.1 SDKs Oficiales

| Paquete | Propósito | Instalación |
|---------|-----------|-------------|
| `mercadopago` | SDK Node.js (backend) | `npm install mercadopago` |
| `@mercadopago/sdk-react` | SDK React (frontend) | `npm install @mercadopago/sdk-react` |
| `@mercadopago/sdk-js` | SDK JavaScript vanilla | `npm install @mercadopago/sdk-js` |

**Última actualización del SDK React**: Enero 2026 (mantenimiento activo)

### 1.2 Métodos de Integración

#### Checkout Pro (Recomendado para inicio rápido)
- **Tipo**: Redirección a página de MercadoPago
- **Complejidad**: ⭐ Baja
- **Ventajas**:
  - Implementación más simple
  - Todos los métodos de pago incluidos
  - MercadoPago maneja la seguridad completa
  - Saldo de cuenta MP y Mercado Crédito disponibles
- **Desventajas**:
  - Usuario sale del sitio
  - Menos control sobre UX

#### Checkout Bricks (Recomendado para mejor UX)
- **Tipo**: Componentes embebidos en tu sitio
- **Complejidad**: ⭐⭐ Media
- **Componentes disponibles**:
  - `Payment Brick`: Formulario multi-pago completo
  - `Card Payment Brick`: Solo tarjetas
  - `Wallet Brick`: Botón de pago con cuenta MP
  - `Status Screen Brick`: Estado de transacción
  - `Brand Brick`: Componente de marketing
- **Ventajas**:
  - Usuario no sale del sitio
  - Personalización visual
  - PCI DSS compliance simplificado
  - 3DS 2.0 integrado
- **Desventajas**:
  - Más código a implementar
  - SSR requiere importación dinámica en Next.js

#### Checkout API (Transparente)
- **Tipo**: Control total del frontend
- **Complejidad**: ⭐⭐⭐ Alta
- **Ventajas**: Control total de diseño
- **Desventajas**:
  - Requiere más conocimiento de seguridad
  - Mayor responsabilidad PCI

### 1.3 Webhooks y Notificaciones

**⚠️ IMPORTANTE**: IPN (Instant Payment Notification) está siendo descontinuado. Usar **Webhooks**.

#### Eventos disponibles:
- `orders` - Creación/actualización de pagos
- `payment` - Notificaciones de pago (legacy)
- `subscription_preapproval` - Suscripciones
- `topic_chargebacks_wh` - Contracargos
- `topic_claims_integration_wh` - Reclamos y reembolsos

#### Validación de webhooks:
1. Header `x-signature` contiene `ts` (timestamp) y `v1` (hash)
2. Construir manifest: `"id:[data.id];request-id:[header];ts:[ts];"`
3. Generar HMAC-SHA256 con secret key
4. Comparar con `v1` recibido

### 1.4 Documentación Oficial

- **Portal Developers**: [https://www.mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers/es/docs)
- **SDK React**: [GitHub mercadopago/sdk-react](https://github.com/mercadopago/sdk-react)
- **Ejemplo Next.js**: [GitHub goncy/next-mercadopago](https://github.com/goncy/next-mercadopago)

---

## 2. Costos y Comisiones (Argentina 2025-2026)

### 2.1 Comisiones por Link de Pago y Checkout (e-commerce)

| Plazo de liberación | Comisión | Nota |
|---------------------|----------|------|
| Inmediato | 6.29% + IVA | ~7.61% efectivo |
| 10 días | 4.39% + IVA | ~5.31% efectivo |
| 18 días | 3.39% + IVA | ~4.10% efectivo |
| 35 días | 1.49% + IVA | ~1.80% efectivo |

**Nota**: El IVA sobre la comisión es 21%, por lo que 6.29% + IVA = ~7.61% efectivo.

### 2.2 Comisiones por otros métodos (referencia)

| Método | Débito | Crédito |
|--------|--------|---------|
| Point (inmediato) | 3.25% + IVA | 6.29% + IVA |
| QR (inmediato) | 1.35% + IVA | 6.29% + IVA |
| Dinero en MP (QR) | 0.80% + IVA | N/A |

### 2.3 Costos adicionales

| Concepto | Costo |
|----------|-------|
| Setup inicial | $0 (gratis) |
| Mantenimiento mensual | $0 (gratis) |
| Retiro a cuenta bancaria | $0 (gratis) |
| Retiro en cajero automático | $3,499 (IVA incluido) |

### 2.4 Cuotas

- **Cuotas sin interés**: El vendedor puede ofrecer hasta 12 cuotas sin interés
- **Absorción del costo**: El vendedor absorbe el financiamiento
- **Costo adicional por cuotas**: Varía según cantidad de cuotas y banco

### 2.5 Variación por provincia

Desde julio 2025, las comisiones varían según la provincia debido a diferentes alícuotas de Ingresos Brutos (IIBB). Consultar simulador en panel de MercadoPago.

---

## 3. Métodos de Pago Soportados

### 3.1 Tarjetas de Crédito
| Marca | Cuotas máximas |
|-------|----------------|
| Visa | Hasta 12 |
| Mastercard | Hasta 12 |
| American Express | Hasta 12 |
| Diners Club | Hasta 12 |
| Naranja | Hasta 12 |
| Cabal | Hasta 12 |
| Argencard | Hasta 12 |
| CMR Falabella | Hasta 12 |

### 3.2 Tarjetas de Débito
- Visa Débito
- Mastercard Débito
- Maestro
- Cabal Débito

**Acreditación**: Inmediata

### 3.3 Tarjetas Prepagas
- Mercado Pago Mastercard
- Ualá
- Brubank
- Otras prepagas Visa/Mastercard

### 3.4 Pagos en Efectivo
| Red | Acreditación |
|-----|--------------|
| Rapipago | Inmediata |
| Pago Fácil | 1-2 horas |

### 3.5 Otros métodos
- **Saldo en cuenta Mercado Pago**: Acreditación inmediata
- **Mercado Crédito (Cuotas sin tarjeta)**: Hasta 12 cuotas, acreditación inmediata para vendedor
- **Transferencia bancaria**: Depende del banco

---

## 4. Ventajas para E-commerce Argentino

### 4.1 Penetración de Mercado
- **Líder absoluto** en Argentina con >70% del mercado de pagos online
- Integración nativa con Mercado Libre (cross-selling)
- Alta confianza del consumidor argentino

### 4.2 Experiencia del Usuario
- Los compradores ya tienen cuenta de Mercado Pago
- Métodos de pago guardados (one-click)
- Cuotas sin tarjeta (Mercado Crédito) muy popular

### 4.3 Funcionalidades Avanzadas
- **Split Payments**: Dividir pagos entre múltiples vendedores (marketplace)
- **Suscripciones**: Pagos recurrentes automáticos
- **QR Code**: Para ventas presenciales también
- **Point**: Dispositivos POS integrados

### 4.4 Protección al Vendedor
- Sistema anti-fraude integrado
- Cobertura en algunos casos de contracargo
- Verificación de identidad del comprador

---

## 5. Limitaciones y Consideraciones

### 5.1 Tiempos de Acreditación

| Tipo de empresa | Plazo mínimo |
|-----------------|--------------|
| PyME | 8 días hábiles |
| Empresa mediana | 10 días hábiles |
| Gran empresa | 18 días hábiles |

**Opción de liberación inmediata**: Disponible con mayor comisión (6.29% + IVA)

### 5.2 Retenciones Impositivas

#### Sistema SIRCUPA
El Sistema Informático de Recaudación y Control de Acreditaciones en Cuentas de Pago aplica retenciones de IIBB:
- **Alícuota**: 0.01% a 5% según padrón COMARB
- **Momento**: Al momento de acreditación de fondos
- **Excluidos**: Monotributistas y MiPyMEs inscriptos

#### Cambios 2024-2025
- Eliminadas retenciones de IVA e Impuesto a las Ganancias (Sept 2024)
- Se mantienen retenciones de Ingresos Brutos

### 5.3 Contracargos (Chargebacks)

#### Proceso
1. Comprador disputa el cargo con su banco
2. MercadoPago notifica al vendedor
3. Vendedor tiene plazo para presentar evidencia
4. Resolución generalmente favorece al comprador sin evidencia clara

#### Prevención
- Sistema anti-fraude de MercadoPago
- Validación de identidad del comprador
- Seguimiento de envío con tracking

### 5.4 Requisitos Legales

#### CUIT/CUIL obligatorio
- Necesario para recibir pagos comerciales
- MercadoPago verifica condición fiscal automáticamente

#### Monotributo vs Responsable Inscripto

| Régimen | Tope anual (2026) | Obligaciones |
|---------|-------------------|--------------|
| Monotributo | $82,370,281.28 | Cuota fija mensual |
| Responsable Inscripto | Sin límite | IVA + Ganancias mensual/anual |

**MercadoPago sincroniza automáticamente** con ARCA (ex-AFIP) la condición fiscal.

### 5.5 Limitaciones Técnicas
- SDK React requiere Client Side Rendering
- En Next.js SSR, usar importación dinámica
- No hay SDK oficial para React Server Components

---

## 6. Ejemplo de Integración Next.js

### 6.1 Instalación

```bash
npm install mercadopago @mercadopago/sdk-react
```

### 6.2 Variables de Entorno

```env
# .env.local
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx  # Token privado (backend)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx  # Key pública (frontend)
MERCADOPAGO_WEBHOOK_SECRET=xxx  # Para validar webhooks
```

### 6.3 Crear Preferencia de Pago (API Route)

```typescript
// src/app/api/mercadopago/create-preference/route.ts
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextResponse } from 'next/server';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
});

export async function POST(request: Request) {
  try {
    const { items, payer, externalReference } = await request.json();

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: 'ARS',
        })),
        payer: {
          name: payer.name,
          email: payer.email,
          phone: {
            number: payer.phone
          }
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/failure`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/pending`,
        },
        auto_return: 'approved',
        external_reference: externalReference,
        notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/mercadopago/webhook`,
      }
    });

    return NextResponse.json({
      preferenceId: result.id,
      initPoint: result.init_point
    });
  } catch (error) {
    console.error('Error creating preference:', error);
    return NextResponse.json(
      { error: 'Error al crear preferencia de pago' },
      { status: 500 }
    );
  }
}
```

### 6.4 Webhook Handler

```typescript
// src/app/api/mercadopago/webhook/route.ts
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
});

function validateWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): boolean {
  const parts = xSignature.split(',');
  let ts = '';
  let hash = '';

  parts.forEach(part => {
    const [key, value] = part.split('=');
    if (key.trim() === 'ts') ts = value.trim();
    if (key.trim() === 'v1') hash = value.trim();
  });

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const generatedHash = createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  return generatedHash === hash;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const xSignature = request.headers.get('x-signature') || '';
    const xRequestId = request.headers.get('x-request-id') || '';

    // Validar firma
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      const isValid = validateWebhookSignature(
        xSignature,
        xRequestId,
        body.data?.id?.toString() || '',
        process.env.MERCADOPAGO_WEBHOOK_SECRET
      );

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Procesar según tipo de evento
    if (body.type === 'payment') {
      const paymentId = body.data.id;
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: paymentId });

      switch (paymentInfo.status) {
        case 'approved':
          // Actualizar orden como pagada
          await updateOrderStatus(paymentInfo.external_reference, 'paid');
          break;
        case 'pending':
          // Marcar como pendiente
          await updateOrderStatus(paymentInfo.external_reference, 'pending');
          break;
        case 'rejected':
          // Marcar como rechazado
          await updateOrderStatus(paymentInfo.external_reference, 'rejected');
          break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}

async function updateOrderStatus(orderId: string, status: string) {
  // Implementar actualización en Supabase
  console.log(`Updating order ${orderId} to status ${status}`);
}
```

### 6.5 Componente de Checkout (Client)

```typescript
// src/components/checkout/MercadoPagoCheckout.tsx
'use client';

import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { useEffect, useState } from 'react';

// Inicializar SDK (una vez)
initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, {
  locale: 'es-AR'
});

interface Props {
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
  }>;
  payer: {
    name: string;
    email: string;
    phone: string;
  };
}

export function MercadoPagoCheckout({ items, payer }: Props) {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createPreference() {
      try {
        const response = await fetch('/api/mercadopago/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            payer,
            externalReference: `order_${Date.now()}`,
          }),
        });

        if (!response.ok) throw new Error('Error al crear preferencia');

        const data = await response.json();
        setPreferenceId(data.preferenceId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    createPreference();
  }, [items, payer]);

  if (loading) {
    return <div className="animate-pulse h-12 bg-gray-200 rounded" />;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div id="wallet_container">
      {preferenceId && (
        <Wallet
          initialization={{ preferenceId }}
          customization={{ texts: { valueProp: 'smart_option' } }}
        />
      )}
    </div>
  );
}
```

### 6.6 Usando Checkout Bricks (Payment Brick)

```typescript
// src/components/checkout/PaymentBrick.tsx
'use client';

import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { useEffect, useState } from 'react';

initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!, {
  locale: 'es-AR'
});

interface Props {
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: any) => void;
}

export function PaymentBrick({ amount, onSuccess, onError }: Props) {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  useEffect(() => {
    // Crear preferencia para el monto
    async function init() {
      const res = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: 'order', title: 'Compra', quantity: 1, price: amount }],
          payer: { name: '', email: '', phone: '' }
        })
      });
      const data = await res.json();
      setPreferenceId(data.preferenceId);
    }
    init();
  }, [amount]);

  if (!preferenceId) return <div>Cargando...</div>;

  return (
    <Payment
      initialization={{
        amount,
        preferenceId,
      }}
      customization={{
        paymentMethods: {
          creditCard: 'all',
          debitCard: 'all',
          mercadoPago: 'all',
        },
      }}
      onSubmit={async ({ formData }) => {
        // Procesar pago
        const res = await fetch('/api/mercadopago/process-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const payment = await res.json();

        if (payment.status === 'approved') {
          onSuccess(payment.id);
        } else {
          onError(payment);
        }
      }}
      onError={onError}
    />
  );
}
```

---

## 7. Comparación Rápida de Integraciones

| Aspecto | Checkout Pro | Checkout Bricks | Checkout API |
|---------|--------------|-----------------|--------------|
| Tiempo de implementación | 1-2 días | 3-5 días | 1-2 semanas |
| UX/Branding | Bajo control | Alto control | Total control |
| Mantenimiento | Bajo | Medio | Alto |
| PCI Compliance | Automático | Simplificado | Manual |
| Métodos de pago | Todos | Todos | Seleccionables |
| Recomendado para | MVP, inicio rápido | Mejor UX | Apps complejas |

---

## 8. Recomendación para Neumáticos del Valle

### Fase 1: MVP (Recomendado iniciar)
- **Usar Checkout Pro** para validar el flujo de pago online
- Tiempo estimado: 1-2 días de desarrollo
- Costo: Solo comisiones por transacción

### Fase 2: Mejora de UX
- **Migrar a Checkout Bricks** (Payment Brick + Wallet Brick)
- Usuario no sale del sitio
- Mejor conversión esperada

### Configuración sugerida de comisiones:
- **Liberación a 10 días** (4.39% + IVA) - Balance entre liquidez y costo
- Evaluar 35 días (1.49% + IVA) si el flujo de caja lo permite

---

## 9. Fuentes

- [SDK JS React - Mercado Pago Developers](https://www.mercadopago.com.ar/developers/es/docs/sdks-library/client-side/sdk-js-react-installation)
- [GitHub - mercadopago/sdk-react](https://github.com/mercadopago/sdk-react)
- [Comisiones y cargos - Mercado Pago](https://www.mercadopago.com.ar/ayuda/26748)
- [Medios de pago disponibles](https://www.mercadopago.com.ar/ayuda/Medios-de-pago-y-acreditaci-n_221)
- [Checkout Bricks Overview](https://www.mercadopago.com.ar/developers/en/docs/checkout-bricks/overview)
- [Webhooks - Notificaciones](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks)
- [GitHub - goncy/next-mercadopago](https://github.com/goncy/next-mercadopago)
- [Retenciones en Mercado Pago](https://www.mercadopago.com.ar/ayuda/17753)
- [Cómo gestionar disputas de contracargos](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/additional-content/chargebacks/how-to-manage)

---

**Documento preparado para**: teammate "comparador"
**Próximo paso**: Comparar con otras opciones (Stripe, PayPal, etc.)
