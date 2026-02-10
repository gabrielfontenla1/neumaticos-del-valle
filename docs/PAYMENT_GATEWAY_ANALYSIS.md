# Análisis Comparativo de Payment Gateways
## Neumáticos del Valle - Decisión de Pasarela de Pagos

**Fecha**: Febrero 2026
**Preparado por**: Equipo de Research
**Objetivo**: Seleccionar la mejor pasarela de pagos para el e-commerce

---

## Resumen Ejecutivo

Tras analizar las principales opciones de payment gateways para Argentina, **recomendamos implementar Mercado Pago** como solución primaria, con la posibilidad de agregar **Mobbex** como alternativa secundaria en el futuro.

**Razón principal**: Mercado Pago ofrece la mejor combinación de confianza del consumidor argentino, métodos de pago locales (especialmente cuotas), y facilidad de integración para el perfil específico de Neumáticos del Valle.

---

## Contexto del Negocio

| Aspecto | Detalle |
|---------|---------|
| **Tipo de negocio** | E-commerce de neumáticos |
| **Ubicación** | Argentina |
| **Ticket promedio** | $50,000 - $500,000+ ARS |
| **Clientes** | B2C (retail) + B2B (agrícola/camiones) |
| **Stack técnico** | Next.js 15 + Supabase |
| **Checkout actual** | WhatsApp (manual) |
| **Necesidad crítica** | Cuotas sin tarjeta |

---

## Análisis de Opciones

### 1. Mercado Pago ✅ RECOMENDADO

#### Costos (Argentina 2025-2026)

| Plazo de Liberación | Comisión | Comisión + IVA |
|---------------------|----------|----------------|
| Inmediato | 6.29% | ~7.61% |
| 10 días | 4.39% | ~5.31% |
| 18 días | 3.39% | ~4.10% |
| 35 días | 1.49% | ~1.80% |

#### Métodos de Pago Disponibles
- ✅ Todas las tarjetas de crédito (Visa, Mastercard, Amex, Naranja, Cabal)
- ✅ Tarjetas de débito y prepagas
- ✅ Efectivo (Rapipago, Pago Fácil)
- ✅ Mercado Crédito (cuotas SIN tarjeta) ⭐ CRÍTICO
- ✅ Saldo en cuenta de Mercado Pago
- ✅ MODO y billeteras bancarias

#### Opciones de Integración

| Método | Complejidad | Tiempo | Mejor para |
|--------|-------------|--------|------------|
| **Checkout Pro** | Baja | 1-2 días | MVP rápido |
| **Checkout Bricks** | Media | 3-5 días | Mejor UX |
| **Checkout API** | Alta | 1-2 semanas | Control total |

#### Ventajas Específicas para Neumáticos del Valle

| Ventaja | Impacto |
|---------|---------|
| **Cuotas sin tarjeta** | Tickets altos ($500K+) accesibles para más clientes |
| **>70% market share** | Clientes ya confían y tienen cuenta |
| **Anti-fraude integrado** | Reduce chargebacks en tickets altos |
| **Mercado Crédito** | Financiación sin costo para el comercio |
| **SDK React** | Compatible con Next.js (requiere CSR) |

#### Consideraciones

| Aspecto | Detalle |
|---------|---------|
| Tiempo de acreditación | 8-18 días hábiles (según plan) |
| Retenciones IIBB | Automáticas (simplifica contabilidad) |
| SDK React | Requiere componentes Client-Side en Next.js |
| Soporte | Puede ser lento, pero hay buena documentación |

---

### 2. Stripe ❌ NO VIABLE

#### Estado: No disponible directamente en Argentina

| Aspecto | Realidad |
|---------|----------|
| **Operación directa** | ❌ No disponible |
| **Vía LLC USA** | Posible pero complejo |
| **Costo LLC** | $300-500/año + contabilidad binacional |
| **Moneda** | Solo USD (sin ARS) |
| **Cuotas argentinas** | ❌ No disponible |
| **Débito argentino** | ❌ No disponible |
| **Efectivo** | ❌ No disponible |

#### Veredicto
Stripe tiene excelente developer experience, pero **no es viable** para un e-commerce B2C argentino que necesita cuotas y métodos de pago locales.

---

### 3. Mobbex 🟡 ALTERNATIVA INTERESANTE

#### Perfil
Fintech cordobesa especializada en PyMEs argentinas con enfoque en flexibilidad.

#### Costos

| Plan | Comisión | Incluye |
|------|----------|---------|
| **Mobbex Ready** | 4% + IVA | Todo incluido, sin costos fijos |
| **Mobbex Direct** | 1% + IVA | + costo del procesador (ej: 1% débito) |

**Acreditación**: 5 días hábiles (mejor que MP)

#### Métodos de Pago
- ✅ Tarjetas crédito/débito (todas)
- ✅ Rapipago, Pago Fácil, PagoMisCuentas
- ✅ Transferencias bancarias y DEBIN
- ✅ QR
- ✅ Criptomonedas
- ⚠️ Cuotas propias (requiere configuración manual)

#### Integración Next.js

```javascript
// SDK Embebido v1.2.0
<script src="https://api.mobbex.com/p/embed/1.2.0/lib.js"></script>
<div id="mbbx-container"></div>

// Inicialización
var embed = window.MobbexEmbed.init({
  onPayment: (data) => { /* manejo de pago */ },
  onClose: (cancelled) => { /* cierre de modal */ }
});
embed.open({ type: 'checkout', id: 'CHECKOUT_ID' });
```

#### Ventajas
| Ventaja | Detalle |
|---------|---------|
| **Cuotas personalizables** | Por producto, día o monto |
| **Mejor acreditación** | 5 días vs 8-18 de MP |
| **Comisión competitiva** | 4% vs 4.39%+ de MP |
| **Soporte PyME** | Más personalizado |

#### Desventajas
| Desventaja | Impacto |
|------------|---------|
| **Menor reconocimiento** | Clientes no conocen Mobbex |
| **Sin "Mercado Crédito"** | No tiene cuotas sin tarjeta propias |
| **Menor ecosistema** | Sin billetera de consumidor |
| **Integración manual** | No hay SDK React oficial |

---

### 4. Ualá Bis 🟡 ALTERNATIVA EMERGENTE

#### Perfil
Solución de cobros de Ualá, creciendo rápidamente en Argentina.

#### Costos

| Método de Pago | Comisión |
|----------------|----------|
| Tarjeta crédito | 4.4% + IVA |
| Tarjeta débito | 2.9% + IVA |
| QR/Transferencia | 0.6% + IVA |

**Acreditación**: Inmediata ⭐

#### Integración

- **SDK Node.js**: ✅ Disponible
- **SDK PHP**: ✅ Disponible
- **SDK Python/Java**: 🔜 Próximamente
- **Documentación**: [developers.ualabis.com.ar](https://developers.ualabis.com.ar/sdks)

#### Ventajas
| Ventaja | Detalle |
|---------|---------|
| **Acreditación inmediata** | Mejor liquidez |
| **Menor fee en débito** | 2.9% vs 4%+ de otros |
| **SDK Node.js** | Compatible con Next.js backend |
| **Crecimiento fuerte** | Inversión en mejoras |

#### Desventajas
| Desventaja | Impacto |
|------------|---------|
| **Menor reconocimiento** | Marca joven vs MP |
| **Sin cuotas sin tarjeta** | Depende de bancos |
| **SDK limitado** | Solo backend, no React |
| **Ecosistema en desarrollo** | Menos maduro |

---

### 5. Payway ⚪ NO APLICA

#### Perfil
Gateway orientado a empresas grandes con alto volumen.

| Aspecto | Detalle |
|---------|---------|
| **Target** | Empresas grandes |
| **PyMEs** | Generalmente no acepta cuentas pequeñas |
| **Acreditación** | 24 horas hábiles |

**Veredicto**: No es target para Neumáticos del Valle. Enfocado en retailers grandes.

---

## Tabla Comparativa Final

| Característica | Mercado Pago | Mobbex | Ualá Bis | Stripe |
|----------------|--------------|--------|----------|--------|
| **Disponible en Argentina** | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No |
| **Reconocimiento consumidor** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | N/A |
| **Cuotas sin tarjeta** | ✅ Mercado Crédito | ❌ No | ❌ No | ❌ No |
| **Cuotas con tarjeta** | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No |
| **Débito argentino** | ✅ Sí | ✅ Sí | ✅ Sí | ❌ No |
| **Efectivo** | ✅ Sí | ✅ Sí | ❌ No | ❌ No |
| **Fee promedio** | ~4-6% | ~4-5% | ~3-5% | ~3-5% USD |
| **Acreditación** | 8-18 días | 5 días | Inmediata | 2 días |
| **SDK React/JS** | ✅ Oficial | ⚠️ Vanilla JS | ⚠️ Node.js | ✅ Excelente |
| **Integración Next.js** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Anti-fraude** | ✅ Integrado | ✅ Integrado | ✅ Básico | ✅ Excelente |
| **Soporte** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Análisis de Impacto en el Negocio

### Escenario: Venta de $200,000 ARS

| Gateway | Fee Estimado | Neto Comercio | Acreditación |
|---------|--------------|---------------|--------------|
| Mercado Pago (10 días) | $10,620 | $189,380 | 10 días |
| Mercado Pago (35 días) | $3,600 | $196,400 | 35 días |
| Mobbex Ready | $9,680 | $190,320 | 5 días |
| Ualá Bis (crédito) | $10,648 | $189,352 | Inmediato |
| Ualá Bis (débito) | $7,018 | $192,982 | Inmediato |

### Factor Clave: Cuotas Sin Tarjeta

Para tickets de $300,000+ ARS, muchos clientes argentinos NO tienen tarjeta de crédito con ese límite. **Mercado Crédito** permite:

- Financiación hasta 12 cuotas sin tarjeta
- El comercio cobra al contado
- El cliente financia con su cuenta MP
- Tasa la paga el consumidor, no el comercio

**Esto es un diferenciador crítico** para vender neumáticos de camión/agrícolas.

---

## Recomendación Final

### Fase 1: Implementar Mercado Pago (Inmediato)

**Método**: Checkout Bricks (mejor UX que Pro, más simple que API)

**Justificación**:
1. **Confianza del consumidor**: >70% del mercado argentino
2. **Cuotas sin tarjeta**: Mercado Crédito es crítico para tickets altos
3. **Integración probada**: SDK React con buena documentación
4. **Menor fricción**: Usuarios ya tienen cuenta de MP
5. **Riesgo bajo**: Líder del mercado, no va a desaparecer

**Configuración recomendada**:
- Liberación en 10 días (balance costo/liquidez)
- Habilitar todos los métodos de pago
- Activar Mercado Crédito
- Anti-fraude en modo automático

### Fase 2: Evaluar Mobbex (3-6 meses después)

**Cuándo considerar**:
- Si Mercado Pago sube comisiones significativamente
- Si necesitan tiempos de acreditación más cortos
- Si quieren ofrecer cuotas personalizadas por producto
- Como backup/diversificación

### NO Recomendado

| Opción | Razón |
|--------|-------|
| **Stripe** | No viable sin LLC USA, sin métodos locales |
| **Payway** | No acepta PyMEs, enfocado en enterprise |
| **Solo Ualá Bis** | Falta Mercado Crédito, menor reconocimiento |

---

## Plan de Implementación Sugerido

### Semana 1-2: Setup Mercado Pago

```
1. Crear cuenta Mercado Pago Vendedor
2. Verificar documentación comercial
3. Configurar Checkout Bricks en ambiente sandbox
4. Integrar con Next.js (componentes CSR)
5. Configurar webhooks para actualizar órdenes
```

### Semana 3: Testing

```
1. Pruebas de todos los métodos de pago
2. Flujo completo: carrito → pago → confirmación
3. Webhooks: pago aprobado, rechazado, pendiente
4. Testing de Mercado Crédito
```

### Semana 4: Go Live

```
1. Migración a producción
2. Prueba con transacción real pequeña
3. Comunicar a clientes la nueva opción
4. Mantener WhatsApp como alternativa
```

---

## Consideraciones Contables

| Aspecto | Detalle |
|---------|---------|
| **Retenciones IIBB** | Mercado Pago retiene automáticamente |
| **Facturación** | Facturar al cliente, no a MP |
| **Comprobante MP** | Usar como respaldo contable |
| **IVA sobre comisión** | Deducible como gasto |

---

## Métricas de Éxito

| Métrica | Objetivo 30 días | Objetivo 90 días |
|---------|------------------|------------------|
| % pagos online vs WhatsApp | 20% | 50% |
| Conversión checkout | >70% | >80% |
| Chargebacks | <1% | <0.5% |
| Tickets con cuotas | >40% | >50% |

---

## Conclusión

**Mercado Pago es la elección correcta** para Neumáticos del Valle porque:

1. ✅ Los clientes argentinos confían en MP y ya tienen cuenta
2. ✅ Mercado Crédito permite vender productos de ticket alto a clientes sin tarjeta
3. ✅ La integración con Next.js está bien documentada
4. ✅ El anti-fraude protege transacciones grandes
5. ✅ Es el estándar del mercado argentino

La única desventaja (tiempos de acreditación) se compensa con la mayor tasa de conversión por la confianza del consumidor.

---

## Fuentes

- [Mercado Pago - Costos](https://www.mercadopago.com.ar/costs-section)
- [Mobbex - Plataforma](https://www.mobbex.com/)
- [Mobbex - Documentación Técnica](https://mobbex.dev/integracion-embebida)
- [Ualá Bis - E-commerce](https://www.ualabis.com.ar/ecommerce)
- [Ualá Bis - Developers](https://developers.ualabis.com.ar/sdks)
- [Tiendanube - Alternativas a Mercado Pago](https://www.tiendanube.com/blog/alternativas-a-mercado-pago/)
- [Rebill - Top 8 Payment Gateways Argentina 2025](https://www.rebill.com/en/blog/payment-gateways-argentina)
- [Rebill - Alternativas a Mercado Pago](https://www.rebill.com/en/blog/alternativas-a-mercado-pago)

---

**Documento preparado para la toma de decisión ejecutiva.**
**Próximo paso**: Aprobar e iniciar implementación de Mercado Pago Checkout Bricks.
