# Sistema de Cotización Pirelli - Mobile First 🚗

Sistema de cotización de neumáticos Pirelli con interfaz estilo Typeform, optimizado para dispositivos móviles y completamente en español argentino.

## 🎯 Características Principales

### Interfaz Typeform Mobile-First
- **Una pregunta por pantalla** - Experiencia conversacional simple
- **Diseño optimizado para móvil** - Botones grandes, navegación táctil
- **Transiciones suaves** - Animaciones fluidas con Framer Motion
- **Progreso visual** - Barra de progreso en cada paso
- **100% en español argentino** - Usando el "vos" informal

### Flujo de Cotización (10 Pantallas)

1. **Bienvenida** - Logo Pirelli y botón "Empezar"
2. **Marca del vehículo** - Selección con botones grandes
3. **Modelo** - Lista filtrable con búsqueda
4. **Año** - Grid de años disponibles
5. **Selección de neumáticos** - Tarjetas deslizables con especificaciones
6. **Cantidad** - Selector numérico con opciones rápidas (2 o 4)
7. **Servicios adicionales** - Uno por pantalla con Sí/No
8. **Datos de contacto** - Un campo por pantalla (nombre, email, teléfono)
9. **Resumen** - Vista completa con opción de editar
10. **Éxito** - Confirmación con número de referencia

## 🚀 Tecnologías

- **Next.js 15.5** - Framework React con App Router
- **TypeScript** - Type safety completo
- **Tailwind CSS** - Estilos utility-first
- **Framer Motion** - Animaciones suaves
- **React 19** - Última versión estable

## 📱 Optimizaciones Mobile

- **Touch-friendly** - Áreas táctiles mínimas de 48px
- **Sin zoom en iOS** - Font-size de 16px en inputs
- **Gestos nativos** - Swipe para navegar entre neumáticos
- **Teclado optimizado** - Soporte para Enter y Escape
- **100vh seguro** - Manejo correcto del viewport en móviles

## 💰 Formato de Precios

Todos los precios se muestran en formato argentino:
- Símbolo: `$`
- Separador de miles: `.` (punto)
- Ejemplo: `$95.000`

## 🎨 Diseño Visual

### Colores Pirelli
- **Amarillo Pirelli**: #FFC700 (principal)
- **Negro**: #000000 (texto)
- **Blanco**: #FFFFFF (fondo)

### Tipografía
- **Títulos**: 24px+ en móvil
- **Cuerpo**: 18px mínimo
- **Sistema**: SF Pro, Segoe UI, system fonts

## 📦 Instalación

```bash
# Clonar repositorio
git clone [url-del-repo]

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar producción
npm start
```

## 🔧 Estructura del Proyecto

```
src/features/quotation/
├── api.ts                    # Datos y funciones (español)
├── types.ts                  # TypeScript interfaces
├── hooks/
│   └── useQuotation.ts      # Lógica de negocio
└── components/
    ├── MobileWizard.tsx     # Contenedor principal
    └── screens/             # Pantallas individuales
        ├── WelcomeScreen.tsx
        ├── BrandScreen.tsx
        ├── ModelScreen.tsx
        ├── YearScreen.tsx
        ├── TireScreen.tsx
        ├── QuantityScreen.tsx
        ├── ServicesScreen.tsx
        ├── ContactScreen.tsx
        ├── SummaryScreen.tsx
        └── SuccessScreen.tsx
```

## 📊 Datos de Neumáticos

### Modelos Disponibles
- **Cinturato P7** - Premium, bajo ruido
- **Scorpion Verde** - SUV ecológico
- **P Zero** - Alto rendimiento deportivo
- **P1** - Económico urbano
- **Scorpion ATR** - Todo terreno
- **Formula Energy** - Eficiente en combustible

### Servicios Adicionales
- **Instalación Profesional** - $2.500 por neumático
- **Alineación Computarizada** - $8.000 precio único
- **Envío a Domicilio** - $3.500 precio único

## 🌐 URLs y Endpoints

- **Desarrollo**: http://localhost:3000
- **API de cotización**: `/api/quotation` (simulada)

## 📱 Compatibilidad

- **iOS**: Safari 12+, Chrome
- **Android**: Chrome 80+, Firefox
- **Desktop**: Todos los navegadores modernos

## 🔄 Estados del Sistema

### Navegación
- Botón "Volver" siempre visible (excepto bienvenida y éxito)
- Progreso guardado durante la sesión
- Validación en tiempo real

### Manejo de Errores
- Validación de campos inline
- Mensajes de error en español
- Estados de carga animados

## 🚦 Próximas Mejoras

- [ ] Integración con WhatsApp Business API
- [ ] Generación de PDF de cotización
- [ ] Base de datos real para cotizaciones
- [ ] Sistema de notificaciones push
- [ ] Modo offline con Service Workers
- [ ] Múltiples sucursales/ubicaciones

## 📄 Licencia

Distribuidor Oficial Pirelli - Argentina

---

**Desarrollado para Neumáticos del Valle** 🇦🇷