# Neumáticos del Valle - Home Page Visual Structure

## Page Hierarchy & Layout Map

```
┌─────────────────────────────────────────────────────────────────┐
│  NAVIGATION BAR (Fixed, Black background, Yellow accents)      │
│  [Logo] [Inicio|Productos|Equivalencias|Turnos|Servicios] [CTA]│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         HERO SECTION                             │
│                   [Background Image + Overlay]                   │
│                                                                   │
│     "Neumáticos Premium Con Garantía Total"                      │
│     [Trust Badge: Distribuidor Oficial Pirelli desde 1984]      │
│     [Primary CTA: Reservar Turno] [Secondary CTA: Ver Catálogo] │
│                                                                   │
│     ★★★★★ 4.9/5 Stars | +100K Clientes | Garantía Total        │
│     [Scroll indicator]                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  BENEFITS SECTION (Light Gray Background)                       │
│                                                                   │
│  [Card 1]           [Card 2]           [Card 3]       [Card 4]  │
│  40+ Años      100% Original       100K+ Clientes   6 Sucursales│
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TIRE MODELS SECTION (White Background)                         │
│                                                                   │
│  "Neumáticos Pirelli"                                           │
│  Tecnología italiana de clase mundial...                         │
│                                                                   │
│  [Model 1 Image Card] [Model 2 Image Card] [Model 3 Image Card] │
│   Scorpion Verde        P Zero            Cinturato P7           │
│   [Ver Detalles]        [Cotizar]          ...                  │
│                                                                   │
│  [View Full Catalog Button]                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SERVICES SECTION (Black Background, White Text)               │
│                                                                   │
│  "Servicios Premium"                                            │
│                                                                   │
│  [Service 1 Image]  [Service 2 Image]  [Service 3 Image]       │
│   Alineación y      Service Express    Diagnóstico Digital     │
│   Balanceo                                                       │
│   [Reserve]         [Reserve]          [Reserve]               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  STATISTICS SECTION (Pirelli Yellow Background, Black Text)    │
│                                                                   │
│  33,639+              10,440+              4.9★               98%│
│  Neumáticos           Services             Calificación      Clientes│
│  instalados           realizados           promedio          satisfechos│
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  BRANCHES SECTION (White Background)                            │
│                                                                   │
│  "Nuestras Sucursales"                                          │
│  6 sucursales estratégicamente ubicadas en el NOA               │
│                                                                   │
│  [Branch 1] [Branch 2] [Branch 3]                              │
│   Catamarca  La Banda   San Fernando...                         │
│                                                                   │
│  [Branch 4] [Branch 5] [Branch 6]                              │
│   Salta    Santiago...  Tucumán                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FINAL CTA SECTION (Black Background)                           │
│                                                                   │
│  "¿Listo para garantizar tu seguridad?"                         │
│  Reserva tu turno online y evita esperas...                     │
│                                                                   │
│  [Agendar Turno - Yellow] [WhatsApp - Green]                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FOOTER (Dark Gray Background, White Text)                      │
│                                                                   │
│  [Company Info]  [Quick Links]  [Services]  [Contact]           │
│   Logo + About    Catálogo      List of      Phone              │
│   Description     Turnos        services     WhatsApp           │
│                   Servicios                  Email              │
│                                                                   │
│  Copyright © 2024 | Admin | Terms | Privacy                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design System Colors

### Primary Palette
```
Brand Yellow:   #FEE004 / #FFC700  ████████ Pirelli official color
Pure Black:     #000000             ████████ Authority, contrast
Pure White:     #FFFFFF             ████████ Clean, trustworthy
Dark Gray:      #111827 - #1F2937   ████████ Content backgrounds
Light Gray:     #F3F4F6 - #F9FAFB   ████████ Section backgrounds
```

### Usage Patterns
- **CTAs & Actions**: Always yellow (primary), green (WhatsApp)
- **Headers**: Black on white, white on dark
- **Body Text**: Dark gray (almost black) on light backgrounds
- **Borders**: Light gray for subtle separation
- **Hover States**: Slight darkening or color intensification

---

## Typography Hierarchy

```
Level 1 (Hero Headline)
  Font: Plus Jakarta Sans Bold (700-800)
  Size: 3.5rem - 4.5rem (56px - 72px)
  Line: 1.2
  Example: "Neumáticos Premium Con Garantía Total"

Level 2 (Section Headings)
  Font: Plus Jakarta Sans Bold (700)
  Size: 2.25rem - 3rem (36px - 48px)
  Line: 1.3
  Example: "¿Por qué elegirnos?"

Level 3 (Card Titles / Subheadings)
  Font: Plus Jakarta Sans Semibold (600)
  Size: 1.25rem - 1.5rem (20px - 24px)
  Line: 1.4
  Example: "40+ Años de Experiencia"

Level 4 (Body Text)
  Font: Plus Jakarta Sans Regular (400)
  Size: 1rem - 1.125rem (16px - 18px)
  Line: 1.5-1.6
  Example: "Distribuidor oficial Pirelli..."

Level 5 (Small Text / UI)
  Font: Plus Jakarta Sans Regular (400)
  Size: 0.875rem - 1rem (14px - 16px)
  Line: 1.5
  Example: "Selecciona tu sucursal"

Level 6 (Captions / Metadata)
  Font: Plus Jakarta Sans Regular (400)
  Size: 0.75rem - 0.875rem (12px - 14px)
  Line: 1.4
  Example: "Basado en 5,000+ reseñas"
```

---

## Component Inventory

### Header Components
- `Navbar`: Fixed navigation with logo, menu, cart, user profile
- `Logo`: SVG image (180x48px)
- `NavLink`: Active state indicator with yellow underline

### Hero Components
- `HeroSection`: Full viewport height with parallax
- `TrustBadge`: Yellow-outlined pill with icon
- `CTAButton`: Primary (yellow) and secondary (outlined) variants
- `TrustIndicators`: Tooltips with detailed information

### Content Components
- `BenefitCard`: Icon + title + description, hover effect
- `TireModelCard`: Image overlay with gradient, features, CTAs
- `ServiceCard`: Image overlay with icon badge
- `StatBlock`: Large number + label
- `BranchCard`: Image overlay with location info

### Footer Components
- `FooterColumn`: Sections of links and info
- `SocialLinks`: Contact methods (phone, WhatsApp, email)
- `Copyright`: Legal text and admin link

---

## Responsive Breakpoints

```
Mobile: 0-640px
├─ Single column layouts
├─ Full-width cards
├─ Carousel for multi-item sections
├─ Hamburger menu for navigation
└─ Simplified forms

Tablet: 641-1024px
├─ 2-column grids
├─ Wider cards with padding
├─ Desktop menu appears
└─ Reduced spacing

Desktop: 1025px+
├─ 3-4 column grids
├─ Full featured layouts
├─ Hover animations active
└─ Maximum spacing optimization
```

---

## Animation Specifications

### Entrance Animations
- **Fade In + Up**: 0.5-0.6s duration, ease-out
- **Scale In**: 0.4-0.5s duration, 0.95 starting scale
- **Stagger**: 0.1s delay between items

### Hover Animations
- **Icon Rotation**: 0.6s ease-in-out, 360°
- **Image Zoom**: 0.7s, 110% scale
- **Card Lift**: 0.2s, -8px Y offset
- **Scale Up**: 0.2s, 110% scale

### Scroll Animations
- **Parallax Hero**: Y transform from 0 to 150px
- **Opacity Fade**: From 1 to 0 at scroll position
- **Scroll Indicator**: Continuous bounce animation

---

## Key Numbers & Statistics

**Trust Signals** (displayed prominently):
- 40+ Years in business
- 100,000+ Customers served
- 100% Original products
- 6 Physical locations
- 4.9/5 Star rating

**Performance Metrics** (yellow section):
- 33,639+ Tires installed
- 10,440+ Services completed
- 98% Customer satisfaction
- 4.9★ Average rating

---

## CTA Placement Strategy

### Primary CTAs (Conversion Focus)
1. Hero: "Reservar Turno" (appointment booking)
2. Services: "Reservar Turno" buttons on each service
3. Final CTA: Large "Agendar Turno" button

### Secondary CTAs (Navigation)
1. Hero: "Ver Catálogo" (product browsing)
2. Benefits Cards: Links to specific features
3. Branches: "Reservar Turno" per location

### Tertiary CTAs (Contact)
1. Navbar: WhatsApp button
2. Footer: Phone, WhatsApp, Email
3. Throughout: Hover tooltips with contact info

---

## Mobile-Specific Optimizations

```
Change from Desktop → Mobile:

Hero Section:
  - Height reduced slightly
  - Font sizes reduced proportionally
  - Trust indicators become simpler text

Grid Layouts:
  - 4 col → 2 col → 1 col responsively
  - Card padding reduced
  - Carousel replaces grid (Product section)

Navigation:
  - Links move to hamburger menu
  - Logo maintained at 100%
  - Touch-friendly tap targets (48px minimum)

Images:
  - Reduced image heights (300-400px)
  - Optimized image sizes per breakpoint
  - Lazy loading enabled

Forms:
  - Full-width input fields
  - Larger tap targets
  - Simplified field counts
  - Mobile keyboard optimization
```

---

## Accessibility Features

### Built In
- Semantic HTML structure
- ARIA labels on interactive elements
- Color contrast ratios ≥ 4.5:1
- Keyboard navigation support
- Focus indicators on buttons
- Tooltip descriptions for icons

### Radix UI Components
- All components follow WAI-ARIA patterns
- Screen reader friendly
- Keyboard accessible
- Focus management
- Announcement support

### Testing
- Manual accessibility audit recommended
- Lighthouse accessibility score target: 95+
- WCAG 2.1 AA compliance target
- Screen reader testing (NVDA, VoiceOver)

---

## Performance Optimization

### Image Strategy
- Unsplash images for hero/showcase (optimized)
- Next.js Image component with lazy loading
- Responsive image sizes per breakpoint
- WebP format support

### Code Splitting
- Framer Motion animations load separately
- Carousel component lazy loaded
- Form components code-split

### Caching
- Service worker for offline capability (optional)
- Browser caching headers set
- API response caching

### Bundle Size
- Target: Initial JS ≤ 200KB
- CSS: ≤ 50KB (with Tailwind purge)
- Images: Optimized ≤ 500KB total

---

## SEO & Meta Information

### Meta Tags
- Title: "Neumáticos del Valle - Distribuidor Oficial NOA Argentino"
- Description: "Obtén tu cotización personalizada de neumáticos en 2 minutos..."
- Keywords: "Pirelli, neumáticos, cotización, NOA, Argentina, Salta, Tucumán, Santiago del Estero, Catamarca"
- OG Image: Hero image or branded image
- Canonical: Absolute URL to home page

### Structured Data
- Schema.org LocalBusiness
- Organization schema
- BreadcrumbList (if multiple sections)
- Product schema (for tire listings)

### Analytics
- Google Analytics 4 tracking codes
- Conversion tracking setup
- Event tracking (CTA clicks, form submissions)
- Heat map integration (optional)

