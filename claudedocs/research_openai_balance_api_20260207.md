# Research Report: OpenAI API - Consulta de Saldo/Balance

**Fecha**: 2026-02-07
**Investigador**: Claude Code
**Nivel de Profundidad**: Standard
**Confianza General**: Alta (95%)

---

## Executive Summary

**Conclusión Principal**: OpenAI **NO proporciona un endpoint oficial** para consultar el saldo/balance restante en USD de una cuenta. Sin embargo, existen endpoints para consultar **costos acumulados** y **uso de tokens** que permiten calcular el gasto indirectamente.

### Respuesta Directa

| Pregunta | Respuesta |
|----------|-----------|
| ¿Puedo ver el saldo restante via API? | ❌ **NO** - No existe endpoint oficial |
| ¿Puedo ver cuánto gasté? | ✅ **SÍ** - Costs API |
| ¿Puedo ver tokens usados? | ✅ **SÍ** - Usage API |
| ¿Puedo ver créditos gratis? | ⚠️ **Parcial** - Credit Grants endpoint (no documentado oficialmente) |

---

## Endpoints Disponibles

### 1. Costs API (Recomendado para gastos)

```
GET https://api.openai.com/v1/organization/costs
```

**Autenticación**: Admin API Key (NO API Key regular)

**Parámetros**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_time` | Unix timestamp | ✅ Sí | Inicio del período |
| `end_time` | Unix timestamp | No | Fin del período |
| `bucket_width` | String | No | Solo `'1d'` soportado |
| `limit` | Integer | No | Cantidad de buckets |
| `project_ids` | Array | No | Filtrar por proyecto |

**Respuesta**: Gastos diarios en USD por proyecto/modelo

**Confianza**: Alta (95%) - Documentación oficial disponible

---

### 2. Usage API (Para tokens y requests)

```
GET https://api.openai.com/v1/organization/usage/completions
GET https://api.openai.com/v1/organization/usage/embeddings
GET https://api.openai.com/v1/organization/usage/images
GET https://api.openai.com/v1/organization/usage/audio
GET https://api.openai.com/v1/organization/usage/moderations
```

**Autenticación**: Admin API Key

**Parámetros**:
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_time` | Unix timestamp | ✅ Sí | Inicio del período |
| `end_time` | Unix timestamp | No | Fin del período |
| `bucket_width` | String | No | `'1m'`, `'1h'`, `'1d'` |
| `group_by` | Array | No | `["model", "project_id"]` |
| `models` | Array | No | Filtrar por modelo |
| `limit` | Integer | No | Cantidad de buckets |
| `page` | String | No | Cursor de paginación |

**Respuesta de ejemplo**:
```json
{
  "data": [
    {
      "object": "bucket",
      "start_time": 1736616660,
      "end_time": 1736640000,
      "results": [
        {
          "input_tokens": 141201,
          "output_tokens": 9756,
          "input_cached_tokens": 0,
          "num_model_requests": 470,
          "model": "gpt-4o"
        }
      ]
    }
  ],
  "next_page": "cursor_string"
}
```

**Confianza**: Alta (95%) - Documentación y Cookbook oficiales

---

### 3. Endpoints Legacy/No Documentados

Estos endpoints aparecen en fuentes de la comunidad pero **no están en documentación oficial**:

```
GET https://api.openai.com/v1/dashboard/billing/subscription
GET https://api.openai.com/v1/dashboard/billing/credit_grants
GET https://api.openai.com/v1/usage?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

**Autenticación**: API Key regular (Bearer token)

**Estado**: ⚠️ No documentados oficialmente, pueden cambiar o dejar de funcionar

**Confianza**: Media (60%) - Solo fuentes comunitarias

---

## Autenticación

### Admin API Key (Requerida para Costs/Usage API)

1. Solo **Organization Owners** pueden crear Admin Keys
2. Crear en: https://platform.openai.com/settings/organization/admin-keys
3. Diferente a la API Key regular

**Header de autenticación**:
```
Authorization: Bearer {OPENAI_ADMIN_KEY}
Content-Type: application/json
```

### API Key Regular

Usada para los endpoints legacy/no documentados:
```
Authorization: Bearer {OPENAI_API_KEY}
```

---

## Limitaciones Confirmadas

### ❌ No existe endpoint para saldo USD restante

**Fuente**: Moderador oficial de OpenAI Community

> "There is no official API endpoint for checking payment system or past usage data. You might also see how it would be helpful to those that might hack leaked API keys to find out the value of the account they have stolen."

**Razón de seguridad**: Prevenir que atacantes con API keys robadas descubran el valor de la cuenta.

### ❌ Prepaid credits no tienen API dedicada

La comunidad ha solicitado esta feature múltiples veces sin respuesta oficial.

---

## Workarounds Recomendados

### Opción 1: Calcular gasto acumulado (Recomendado)

```typescript
// Obtener costos del mes actual
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const response = await fetch(
  `https://api.openai.com/v1/organization/costs?` +
  new URLSearchParams({
    start_time: Math.floor(startOfMonth.getTime() / 1000).toString(),
    bucket_width: '1d'
  }),
  {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_ADMIN_KEY}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
// Sumar costos de todos los buckets
const totalCost = data.data.reduce((sum, bucket) => {
  return sum + bucket.results.reduce((s, r) => s + (r.amount_cents || 0), 0);
}, 0) / 100; // Convertir centavos a dólares
```

### Opción 2: Trackear tokens localmente

Guardar en base de datos cada request con tokens usados y calcular costo estimado usando precios públicos.

### Opción 3: Probar endpoints legacy

```typescript
// ⚠️ No documentado oficialmente, puede fallar
const response = await fetch(
  'https://api.openai.com/v1/dashboard/billing/credit_grants',
  {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  }
);
```

---

## Implementación Sugerida para Dashboard

### Datos que SÍ podés mostrar:
1. **Gasto del mes actual** (Costs API)
2. **Gasto por día** (Costs API con bucket_width='1d')
3. **Tokens usados** (Usage API)
4. **Requests por modelo** (Usage API con group_by)
5. **Gasto por proyecto** (Costs API con project_ids)

### Datos que NO podés mostrar:
1. ❌ Saldo restante en USD
2. ❌ Créditos prepagos restantes (no confiable)
3. ❌ Límite de gasto configurado

### Alternativa UX:
- Mostrar "Gasto este mes: $X.XX"
- Permitir al usuario configurar su límite manualmente
- Calcular "Restante estimado" = Límite manual - Gasto actual

---

## Sources

### Documentación Oficial
- [OpenAI API Reference - Usage](https://platform.openai.com/docs/api-reference/usage)
- [OpenAI Cookbook - Usage & Cost API](https://cookbook.openai.com/examples/completions_usage_api)
- [OpenAI Admin API Keys](https://platform.openai.com/docs/api-reference/admin-api-keys)
- [OpenAI Help Center - Billing](https://help.openai.com/en/collections/3943089-account-login-and-billing)

### Comunidad y Discusiones
- [OpenAI Community - Credit Balance API](https://community.openai.com/t/openai-credit-balance-api/1280067)
- [OpenAI Community - Remaining Credits](https://community.openai.com/t/remaining-credits-or-balance/146806)
- [OpenAI Community - Prepaid Credit API](https://community.openai.com/t/api-for-prepaid-credit-amount-left/1369351)
- [OpenAI Community - Usage API Announcement](https://community.openai.com/t/introducing-the-usage-api-track-api-usage-and-costs-programmatically/1043058)

### Terceros
- [Torii - Monitor OpenAI Spending](https://www.toriihq.com/articles/how-to-monitor-spending-openai)

---

## Recomendaciones

| Prioridad | Acción |
|-----------|--------|
| 🔴 Alta | Obtener Admin API Key de OpenAI |
| 🟡 Media | Implementar Costs API para mostrar gastos del mes |
| 🟢 Baja | Permitir configuración manual de límite para calcular "restante" |

---

## Próximos Pasos (para usuario)

1. **Decisión**: ¿Implementar con Costs API mostrando gastos acumulados?
2. **Si sí**: Usar `/sc:implement` para crear endpoint en dashboard
3. **Requerimiento**: Obtener Admin API Key de OpenAI

---

*Report generated by /sc:research*
