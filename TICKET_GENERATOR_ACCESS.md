# 🔒 Generador de Tickets Fiscales - Acceso Privado

## 📍 URL de Acceso

**URL COMPLETA (Copiar exactamente):**
```
https://neumaticos-del-valle.com/sys/9a1aee4115cd34e4bb9d389a667a53f7/fbe996200c65179ff7961829/ticket-gen
```

**⚠️ IMPORTANTE - INFORMACIÓN CONFIDENCIAL:**
- Esta URL es **PRIVADA** y **CONFIDENCIAL**
- **NO compartir públicamente** ni en redes sociales
- **NO enlazar** desde otras páginas del sitio
- **NO publicar** en foros, blogs o sitios públicos
- Guardar en favoritos o password manager para acceso rápido

---

## 🎯 Descripción

Herramienta interna para generar tickets fiscales en formato PDF con diseño térmico de 80mm.

**Características:**
- ✅ Formulario completo de datos del negocio
- ✅ Gestión de items (productos/servicios)
- ✅ Aplicación de descuentos y promociones
- ✅ Múltiples medios de pago
- ✅ Preview en tiempo real
- ✅ Generación de PDF descargable
- ✅ Formato térmico 80mm profesional
- ✅ Sin conexión a AFIP (solo visual)

---

## 🚀 Cómo Usar

### Paso 1: Acceder
1. Abrir la URL en el navegador
2. La página carga automáticamente (no requiere autenticación adicional)

### Paso 2: Completar Datos
1. **Datos del Comprobante**: Tipo de factura, punto de venta, número
2. **Items**: Agregar productos/servicios con cantidad, descripción, precio
3. **Promociones** (opcional): Agregar descuentos aplicados
4. **Medios de Pago**: Seleccionar tipo y monto

### Paso 3: Vista Previa
- El panel derecho muestra el ticket en tiempo real
- Revisa que todos los datos sean correctos

### Paso 4: Generar PDF
- Click en "Generar PDF"
- El archivo se descarga automáticamente
- Nombre: `Ticket_[PuntoVenta]_[Numero]_[Fecha].pdf`

### Paso 5: Imprimir
- Abrir el PDF descargado
- Configurar impresora térmica (80mm)
- Imprimir

---

## 💾 Características de Persistencia

La herramienta guarda automáticamente:
- ✅ Configuración del negocio (pre-cargada)
- ✅ Último número de comprobante utilizado
- ✅ Preferencias de usuario

Guardado en: LocalStorage del navegador (sin envío de datos a servidor)

---

## 🔐 Seguridad y Privacidad

### Capas de Protección Implementadas:

**1. URL Oculta**
- Hash de 64 caracteres (prácticamente imposible de adivinar)
- Sin enlaces desde ninguna página pública
- No incluida en sitemap.xml

**2. Bloqueo de Crawlers**
- robots.txt bloquea `/sys/` de todos los bots
- Meta tags `noindex, nofollow` en la página
- HTTP Headers `X-Robots-Tag: noindex`

**3. Headers de Seguridad**
- No cacheable (Cache-Control: no-store)
- No referrer (Referrer-Policy: no-referrer)
- Protección contra indexación

**4. Sin Tracking**
- No se incluye en Google Analytics
- No se registra en logs públicos
- Privacidad total

---

## 📱 Acceso Rápido

### Opción 1: Favoritos del Navegador
1. Abrir la URL
2. Click en ⭐ (estrella) para agregar a favoritos
3. Nombrar: "Generador Tickets Interno"
4. Guardar

### Opción 2: Acceso Directo Escritorio (PWA)
1. Abrir la URL en navegador
2. Menú → "Instalar aplicación" (si disponible)
3. Crear icono en escritorio
4. Abrir como app independiente

### Opción 3: Password Manager
1. Guardar en 1Password / Bitwarden / LastPass
2. Categoría: "Herramientas Internas"
3. Auto-login con extensión del navegador

---

## 🔧 Solución de Problemas

### Problema: "Página no encontrada"
**Solución:** Verificar que la URL esté completa y exacta

### Problema: "No genera el PDF"
**Solución:**
- Asegurarse de tener al menos 1 item agregado
- Verificar que los precios sean mayores a 0
- Revisar consola del navegador (F12) para errores

### Problema: "El ticket se ve mal al imprimir"
**Solución:**
- Configurar impresora en modo "80mm térmico"
- Ajustar márgenes a 0
- Verificar orientación: Portrait (vertical)

### Problema: "Perdí mis datos"
**Solución:**
- Los datos se guardan en localStorage
- Si limpió caché del navegador, se pierden
- Exportar configuración periódicamente (feature futuro)

---

## 📊 Datos Pre-cargados

La herramienta viene con los datos del negocio pre-configurados:

```
Razón Social: LIBERTAD S.A.
CUIT: 30-61292994-5
Domicilio Fiscal: Fray Luis Beltrán y M. Cardoñosa
Domicilio Comercial: Fray Luis Beltrán y M. Cardoñosa
Ingresos Brutos: 904-231046-2
Condición IVA: Responsable Inscripto
Fecha Inicio: 1995-06-29
Agente IIBB: 30001040406
```

Estos datos son editables en el formulario si necesitas cambiarlos.

---

## 🚫 Qué NO Hacer

❌ **NO compartir la URL en:**
- Redes sociales (Facebook, Twitter, Instagram, LinkedIn)
- Foros públicos
- Grupos de WhatsApp masivos
- Emails a contactos no autorizados
- Documentos públicos (Google Docs compartidos)
- README del repositorio público
- Comentarios en código público

❌ **NO:**
- Crear links hacia esta página desde el sitio público
- Incluir en buscadores o directorios
- Capturar pantalla y publicar con URL visible
- Compartir sin autorización

---

## ✅ Cómo Compartir Correctamente

Si necesitas dar acceso a alguien nuevo:

### Opción 1: Email Directo (Recomendado)
```
Asunto: Acceso Herramienta Generador de Tickets

Hola [Nombre],

Te comparto el acceso a la herramienta de generación de tickets.

URL: [La URL completa aquí]

⚠️ Esta herramienta es privada, por favor no compartir públicamente.

Guárdala en tus favoritos para acceso rápido.

Saludos,
[Tu nombre]
```

### Opción 2: WhatsApp 1-a-1
- Solo chat privado directo
- Sin grupos grandes
- Mensaje que no se reenvíe

### Opción 3: Password Manager Compartido
- Vault compartido del equipo
- Solo miembros autorizados tienen acceso

---

## 📞 Soporte

Si tienes problemas o necesitas ayuda:

**Contacto Interno:**
- Email: [tu-email@neumaticos-del-valle.com]
- WhatsApp: [tu-numero]
- Horario: Lunes a Viernes 9:00 AM - 6:00 PM

---

## 🔄 Actualizaciones

**Versión Actual:** 1.0.0
**Última Actualización:** 13/01/2025

### Próximas Funcionalidades (Roadmap):
- [ ] Guardar plantillas de productos
- [ ] Historial de tickets generados
- [ ] Exportar/importar configuración
- [ ] Temas visuales personalizables
- [ ] Atajos de teclado
- [ ] Modo offline completo (PWA)

---

## ⚠️ Recordatorio Final

**Esta URL es como una llave maestra. Protégela.**

Si crees que la URL fue comprometida o compartida públicamente:
- Contactar inmediatamente al administrador
- Se generará una nueva URL
- Se bloqueará la anterior

---

**Generado el:** 13 de Enero 2025
**Documento Confidencial** - Uso Interno Exclusivo
