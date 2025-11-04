# 🖼️ Gestión de Imágenes de Neumáticos

## 📁 Ubicación Actual

Todas las imágenes están en la carpeta `public/` del proyecto.

---

## 🎯 Imágenes Actualmente en Uso en el Home

### 1. **Scorpion Verde** (SUV & Camionetas)
- **Archivo**: `/Scorpion-Verde-1505470074533 (1).webp`
- **Tamaño**: 58 KB
- **Formato**: WebP (optimizado)
- **Ubicación en código**: `src/components/TeslaHomePage.tsx:46`

### 2. **P Zero** (Alta Performance)
- **Archivo**: `/Pzero-Nuovo-1505470072726.webp`
- **Tamaño**: 46 KB
- **Formato**: WebP (optimizado)
- **Ubicación en código**: `src/components/TeslaHomePage.tsx:55`

### 3. **Cinturato P7** (Autos Premium)
- **Archivo**: `/Cinturato-P1-Verde-1505470090255.webp`
- **Tamaño**: 66 KB
- **Formato**: WebP (optimizado)
- **Ubicación en código**: `src/components/TeslaHomePage.tsx:64`

---

## 🔄 Cómo Reemplazar Imágenes

### Opción 1: Reemplazar Archivo Directamente
```bash
# 1. Elimina la imagen antigua
rm public/Scorpion-Verde-1505470074533\ \(1\).webp

# 2. Copia tu nueva imagen con el mismo nombre
cp /ruta/a/tu/imagen.webp public/Scorpion-Verde-1505470074533\ \(1\).webp
```

### Opción 2: Cambiar Referencia en Código
```tsx
// En src/components/TeslaHomePage.tsx

const tireModels = [
  {
    id: 1,
    name: 'Scorpion Verde',
    category: 'SUV & Camionetas',
    image: '/tu-nueva-imagen.webp',  // ← Cambia aquí
    // ...
  }
]
```

---

## ➕ Cómo Agregar Más Modelos de Neumáticos

### Paso 1: Añadir la Imagen
```bash
# Copia tu imagen a public/
cp /ruta/a/tu/neumatico.webp public/
```

### Paso 2: Agregar al Array de Modelos
```tsx
// En src/components/TeslaHomePage.tsx

const tireModels = [
  // Modelos existentes...

  // Nuevo modelo
  {
    id: 4,  // ← Incrementa el ID
    name: 'Scorpion HT',
    category: 'Pick-ups & Camionetas',
    image: '/Scorpion-HT-4505525112686.webp',
    description: 'Perfectos para camionetas y uso mixto',
    price: 'Consultar',
    features: ['Durabilidad extrema', 'Tracción superior', 'Bajo desgaste']
  }
]
```

---

## 📸 Imágenes Disponibles en Public

Tienes estas imágenes de Pirelli disponibles para usar:

### Scorpion
- ✅ `Scorpion-Verde-1505470074533 (1).webp` (En uso)
- ✅ `Scorpion-HT-4505525112686.webp`
- ✅ `Scorpion-4505525112390.webp`
- ✅ `Scorpion-Zero-All-Season-1505470086399.webp`
- ✅ `Pirelli-Scorpion-Verde-All-Season-off-low-01-1505470075906.webp`

### P Zero
- ✅ `Pzero-Nuovo-1505470072726.webp` (En uso)
- ✅ `Pzero-Corsa-System-Direzionale-1505470088408.webp`
- ✅ `Pzero-Corsa-PZC4-1505470090635.webp`

### Cinturato
- ✅ `Cinturato-P1-Verde-1505470090255.webp` (En uso)

### Otros Pirelli
- ✅ `P400Evo_review_3-4.webp`
- ✅ `tire.webp` (genérico)

---

## 🎨 Recomendaciones de Imágenes

### Características Ideales
- ✅ **Formato**: WebP (mejor compresión)
- ✅ **Tamaño**: 40-80 KB (balance calidad/velocidad)
- ✅ **Dimensiones**: 800x600px mínimo
- ✅ **Fondo**: Blanco o transparente
- ✅ **Ángulo**: 3/4 frontal (muestra el dibujo de la banda)

### Cómo Convertir a WebP
```bash
# Usando cwebp (instalar con brew install webp)
cwebp -q 80 imagen-original.jpg -o imagen-optimizada.webp
```

### Herramientas Online
- [Squoosh.app](https://squoosh.app) - Comprimir y convertir
- [TinyPNG](https://tinypng.com) - Optimizar PNG/JPG
- [CloudConvert](https://cloudconvert.com) - Convertir a WebP

---

## 🚀 Ejemplo Completo: Añadir Scorpion HT

### 1. Verificar que tienes la imagen
```bash
ls -lh public/Scorpion-HT-4505525112686.webp
# -rw-r--r--  1 user  staff  XXK  fecha  public/Scorpion-HT-4505525112686.webp
```

### 2. Editar TeslaHomePage.tsx
```tsx
const tireModels = [
  {
    id: 1,
    name: 'Scorpion Verde',
    category: 'SUV & Camionetas',
    image: '/Scorpion-Verde-1505470074533 (1).webp',
    description: 'Máximo rendimiento para SUVs de alta gama',
    price: 'Consultar',
    features: ['Todo terreno', 'Bajo ruido', 'Eco-friendly']
  },
  {
    id: 2,
    name: 'P Zero',
    category: 'Alta Performance',
    image: '/Pzero-Nuovo-1505470072726.webp',
    description: 'El neumático elegido por los mejores autos deportivos',
    price: 'Consultar',
    features: ['Ultra High Performance', 'Máxima adherencia', 'Control preciso']
  },
  {
    id: 3,
    name: 'Cinturato P7',
    category: 'Autos Premium',
    image: '/Cinturato-P1-Verde-1505470090255.webp',
    description: 'Confort, seguridad y eficiencia para tu auto',
    price: 'Consultar',
    features: ['Bajo consumo', 'Gran durabilidad', 'Confort acústico']
  },
  // ⬇️ NUEVO MODELO
  {
    id: 4,
    name: 'Scorpion HT',
    category: 'Pick-ups & Camionetas',
    image: '/Scorpion-HT-4505525112686.webp',
    description: 'Perfectos para camionetas y uso mixto',
    price: 'Consultar',
    features: ['Durabilidad extrema', 'Tracción superior', 'Bajo desgaste']
  }
]
```

### 3. Verificar en desarrollo
```bash
npm run dev
# Abre http://localhost:3000 y desplázate a la sección de neumáticos
```

---

## ⚠️ Problemas Comunes

### Imagen no se muestra
**Causa**: Ruta incorrecta
**Solución**:
```tsx
// ❌ Incorrecto
image: 'public/imagen.webp'

// ✅ Correcto
image: '/imagen.webp'  // Next.js sirve desde /public automáticamente
```

### Imagen muy pesada
**Causa**: No está optimizada
**Solución**:
```bash
# Comprimir con cwebp
cwebp -q 80 imagen-pesada.jpg -o imagen-ligera.webp
```

### Espacios en nombre de archivo
**Causa**: Nombres con espacios causan problemas
**Solución**:
```bash
# Renombrar archivo
mv "Scorpion Verde (1).webp" "Scorpion-Verde-1.webp"

# O escapar en código
image: '/Scorpion-Verde-1505470074533 (1).webp'  // Next.js maneja espacios
```

---

## 📊 Optimización de Imágenes

### Current Performance
| Imagen | Tamaño | Formato | Estado |
|--------|--------|---------|--------|
| Scorpion Verde | 58 KB | WebP | ✅ Óptimo |
| P Zero | 46 KB | WebP | ✅ Óptimo |
| Cinturato P7 | 66 KB | WebP | ✅ Óptimo |

### Target Performance
- ✅ **Total**: 170 KB (excelente)
- ✅ **Formato**: WebP (mejor que JPG/PNG)
- ✅ **Lazy Loading**: Activado (Next.js Image)
- ✅ **Responsive**: Múltiples tamaños automáticos

---

## 🎯 Checklist de Calidad de Imagen

Antes de añadir una imagen, verifica:

- [ ] Formato WebP o PNG de alta calidad
- [ ] Tamaño < 100 KB
- [ ] Dimensiones mínimas 800x600px
- [ ] Fondo blanco o transparente
- [ ] Buena iluminación
- [ ] Enfoque nítido en el dibujo de la banda
- [ ] Sin marcas de agua
- [ ] Nombre descriptivo sin espacios especiales

---

## 🔗 Referencias Útiles

- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image)
- [WebP Format](https://developers.google.com/speed/webp)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)

---

## 📞 Soporte

Si necesitas ayuda con las imágenes:
- 📧 Email: dev@neumaticosdelvallle.com.ar
- 💬 WhatsApp: +54 9 299 504-4430

---

**Última actualización**: 2024
**Mantenedor**: Equipo de Desarrollo Neumáticos del Valle
