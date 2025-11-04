# Neumáticos del Valle - Codebase Overview

## Project Information

**Project**: Neumáticos del Valle - Online Tire Shop & Service Platform  
**Description**: Full-stack e-commerce platform for a tire distributor in the NOA (Northwest Argentina) region  
**Tech Stack**: Next.js 15.5, React 19, TypeScript, Tailwind CSS, Supabase  
**Primary Language**: Spanish  
**Repository Status**: Development branch (clean git status)

---

## Home Page Architecture

### Current Implementation

The home page has **two versions** that switch based on environment:

1. **TeslaHomePage** (`src/components/TeslaHomePage.tsx`)
   - Modern, minimalist design inspired by Tesla's landing pages
   - Clean white background with strategic use of blacks and yellows
   - Professional, conversion-focused layout
   - Currently used in staging/development

2. **HomePage** (`src/components/HomePage.tsx`)
   - High-contrast black design with yellow accents
   - Bolder, more dynamic animations
   - Alternative design for comparison/testing

**Switch Logic** (`src/app/page.tsx`):
- Uses `shouldShowUnderConstruction()` environment variable
- Can display "Under Construction" page in production
- Allows flexible deployment strategies across environments

### Page Route
- **Path**: `/` (root)
- **File**: `src/app/page.tsx`
- **Component**: Uses `TeslaHomePage` (via `page.tsx` wrapper)

---

## Design System

### Color Palette

**Primary Brand Colors**:
- **Pirelli Yellow**: `#FEE004` / `#FFC700` (both variants used)
  - Primary CTA buttons
  - Accent highlights
  - Active navigation states
  - Icon highlights
- **Black**: `#000000`
  - Headers, navigation
  - Strong contrast backgrounds
  - Professional framing
- **White**: `#FFFFFF`
  - Main content background (TeslaHomePage)
  - Text on dark backgrounds
  - Light mode primary
- **Grays**: `gray-50` through `gray-900`
  - Secondary sections
  - Text hierarchy
  - Borders and dividers

**Tailwind Configuration**:
```js
colors: {
  'pirelli-yellow': '#FFC700',
  'black': '#000000',
  'white': '#FFFFFF'
}
```

### Typography

**Google Fonts**:
1. **Plus Jakarta Sans** (Primary) - Sans-serif
   - Weights: 300, 400, 500, 600, 700, 800
   - Use: Body text, UI elements, navigation

2. **Lora** (Secondary) - Serif
   - Weights: 400, 500, 600, 700
   - Use: Emphasis, quotes, special sections

3. **IBM Plex Mono** (Accent) - Monospace
   - Weights: 400, 500, 600, 700
   - Use: Code, technical specs, data displays

### Component Library

**UI Framework**: shadcn/ui (headless component library)
- Located in: `src/components/ui/`
- 20+ component types available
- Fully typed with TypeScript
- Accessibility-first approach (Radix UI primitives)

**Key Components Used**:
- Buttons, Cards, Inputs, Labels
- Tabs, Accordion, Collapsible
- Dialog, Sheet, Alert Dialog
- Tooltips, Hover Cards
- Carousel (for product/service showcase)
- Select, Radio Group, Checkbox

### Animation Library

**Framer Motion** v12.23.24
- Scroll-based parallax effects
- Stagger animations for grids
- Scale/fade transitions
- Hover state animations
- Smooth page transitions

---

## Home Page Sections

### 1. Navigation Bar
- **Component**: `Navbar` (`src/components/Navbar.tsx`)
- **Style**: Black background with yellow accents
- **Features**:
  - Logo image (SVG) from `/NDV_Logo.svg`
  - Desktop menu links:
    - Inicio
    - Ver Productos
    - Equivalencias
    - Turnos
    - Servicios
    - Sucursales
  - Mobile hamburger menu
  - Active link indicators (yellow underline)
  - Cart badge with item count
  - User profile button (for authenticated users)
  - WhatsApp contact button
- **Behavior**: Fixed position, appears on all pages except `/admin`

### 2. Hero Section
- **Height**: Full viewport (60rem+)
- **Background**: Hero image with gradient overlay
- **Content**:
  - Trust badge: "Distribuidor Oficial Pirelli desde 1984"
  - Main headline: "Neumáticos Premium Con Garantía Total"
  - Subheading: "La mayor red de distribución Pirelli en el NOA..."
  - **CTA Buttons**:
    - Primary: "Reservar Turno" (yellow, direct appointment)
    - Secondary: "Ver Catálogo" (white outline)
  - **Trust Indicators** (with tooltips):
    - 4.9/5 Stars (from 5,000+ Google reviews)
    - +100K Clientes
    - Garantía Total

### 3. Benefits Section
- **Grid**: 4 column layout (responsive: 2 on mobile, 4 on desktop)
- **Background**: Light gray (`bg-gray-50`)
- **Cards** (4 benefits):
  1. Award icon - "40+ Años de Experiencia"
  2. Shield icon - "100% Productos Originales"
  3. Users icon - "100K+ Clientes Satisfechos"
  4. MapPin icon - "6 Sucursales en el NOA"
- **Interaction**: Hover effect scales icon, changes shadow
- **Colors**: White cards with black text on gray background

### 4. Tire Models Showcase
- **Grid**: 3 columns on desktop, carousel on mobile
- **Background**: White
- **Card Type**: Image overlay cards with:
  - Large product image (450px height)
  - Dark gradient overlay (bottom to top)
  - Category badge (yellow text)
  - Model name and description
  - Feature tags (white badges)
  - Two CTAs: "Ver Detalles" + "Cotizar"
- **Hover Effects**: Image zoom (110%), shadow enhancement
- **Mobile**: Embla carousel with prev/next controls
- **Sample Products**:
  - Scorpion Verde (SUV & Camionetas)
  - P Zero (Alta Performance)
  - Cinturato P7 (Autos Premium)

### 5. Premium Services Section
- **Background**: Black (`bg-black`)
- **Text**: White
- **Grid**: 3 columns (responsive)
- **Cards**: Image overlay format with:
  - Full-height service image (350px)
  - Yellow icon badge (top-left)
  - Service title and description (bottom)
  - "Reservar Turno" CTA button
- **Services Highlighted**:
  - Alineación y Balanceo
  - Service Express
  - Diagnóstico Digital

### 6. Statistics Section
- **Background**: Pirelli Yellow (`bg-[#FEE004]`)
- **Text**: Black
- **Grid**: 4 columns (2 on mobile)
- **Stats Displayed**:
  - 33,639+ Neumáticos instalados
  - 10,440+ Services realizados
  - 4.9★ Calificación promedio
  - 98% Clientes satisfechos

### 7. Branches Section
- **Background**: White
- **Grid**: 3 columns on desktop, 2 on tablet, 1 on mobile
- **Card Style**: Image overlay (300px height)
- **Content per Branch**:
  - Branch name
  - Street address
  - MapPin icon with location
  - "Reservar Turno" CTA (yellow)
- **Locations Featured**:
  1. Catamarca
  2. La Banda
  3. San Fernando del Valle
  4. Salta
  5. Santiago del Estero
  6. Tucumán

### 8. Final CTA Section
- **Background**: Black with subtle background image
- **Content**:
  - Headline: "¿Listo para garantizar tu seguridad?"
  - Subtext: "Reserva tu turno online..."
  - **Two Buttons**:
    1. "Agendar Turno" (yellow) - Primary
    2. "WhatsApp" (green) - Secondary WhatsApp link
- **Styling**: Centered, maximum conversions focus

### 9. Footer
- **Background**: Dark gray (`bg-gray-900`)
- **Grid**: 4 columns (responsive)
- **Sections**:
  - Company info + 5-star rating display
  - Quick Links (Catálogo, Turnos, Servicios)
  - Services List (text-only)
  - Contact Info (phone, WhatsApp)
- **Bottom**: Copyright, Admin link, Terms/Privacy links

---

## Key Features & Services

### 1. Product Catalog (`/productos`)
- Browse all tires by:
  - Brand (Pirelli, etc.)
  - Vehicle type (Autos, Camionetas, Camiones)
  - Size/specifications
- Features:
  - Advanced filtering
  - Search functionality
  - Product detail pages
  - Price comparisons
  - Reviews and ratings

### 2. Tire Equivalence Tool (`/equivalencias`)
- Find equivalent tires from different brands
- Vehicle-based recommendations
- Side-by-side comparison
- Compatibility checking

### 3. Appointment Booking (`/turnos`)
- Multi-step wizard for booking:
  - Province selection
  - Branch selection
  - Date and time picker
  - Service selection
  - Contact form
- Features:
  - Real-time availability
  - Automatic confirmations
  - Reminder emails/SMS
  - Calendar integration

### 4. Service Quote/Quotation (`/quotation`)
- Interactive quotation wizard:
  - Vehicle selection (brand, model, year)
  - Tire selection
  - Service selection
  - Contact information
  - Quote generation
  - Email quote delivery

### 5. Shopping Cart (`/carrito`)
- Add tires to cart
- Quantity adjustment
- Price totals
- Checkout integration
- Cart persistence

### 6. Shopping Services (`/servicios`)
- Detailed service pages:
  - Alignment & Balancing
  - Rotation
  - Nitrogen inflation
  - Front-end service
  - Tire repair
  - Custom pricing

### 7. Branch Locations (`/sucursales`)
- Interactive branch directory:
  - Location maps (pending integration)
  - Hours of operation
  - Contact information
  - Services available per location
  - Branch-specific details

### 8. Reviews & Vouchers
- Post-purchase review system
- Voucher generation and management
- Loyalty program integration
- Customer feedback collection

---

## Current Navigation Structure

### Main Navigation Menu
```
Home (/)
├── Productos (/productos)
├── Equivalencias (/equivalencias)
├── Turnos (/turnos)
├── Servicios (/servicios)
├── Sucursales (/sucursales)
└── Admin (/admin/login)
```

### Secondary Pages
```
Shopping
├── Carrito (/carrito)
├── Checkout (/checkout)
├── Checkout Success (/checkout/success)

Content
├── Review (/review) - Post-purchase
├── Quotation (/quotation) - Auto-complete form
├── Vouchers (/vouchers) - Loyalty program
└── Dashboard (/dashboard) - User account
```

### Admin Section (`/admin`)
- Requires authentication (role-based access)
- Pages:
  - Dashboard (analytics)
  - Turnos (manage appointments)
  - Productos (manage inventory)
  - Stock Import (bulk operations)
  - Usuarios (user management)
  - Órdenes (order management)
  - Importar (data import)
  - Setup (initial configuration)

---

## Technology Stack Details

### Frontend
- **Framework**: Next.js 15.5.3
- **React**: 19.1.0 (latest)
- **Styling**: 
  - Tailwind CSS v3.4.1
  - CSS Modules (globals.css)
  - Framer Motion for animations
- **UI Components**: shadcn/ui + Radix UI
- **Carousel**: Embla Carousel React
- **Icons**: Lucide React (540+ icons)
- **Utilities**:
  - clsx (className utility)
  - tailwind-merge (Tailwind conflict resolution)
  - date-fns (date formatting)

### Backend/API
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth v5 beta + Supabase Auth
- **API Routes**: Next.js API routes in `/app/api`
- **File Uploads**: Support for XLSX files (xlsx library)
- **Email**: Resend for transactional emails
- **QR Codes**: react-qr-code library

### Development Tools
- **Type Checking**: TypeScript 5
- **Linting**: ESLint (disabled in production)
- **Testing**: 
  - Playwright for E2E tests
  - Smoke tests available
- **Data Export**: XLSX export functionality
- **Confetti**: Canvas-based celebration animations

### Deployment
- **Platform**: Railway (via MCP)
- **Build**: Next.js build with Turbopack
- **Environment**: Multiple branches strategy
- **Domain**: Custom domain support

---

## Home Page Improvement Opportunities

### Content & Features to Highlight

1. **Trust & Authority**
   - Customer testimonials/case studies
   - Pirelli official partnership badge
   - Certification/compliance details
   - Industry awards

2. **Value Proposition**
   - Fast service (30-min tire change)
   - Competitive pricing comparison
   - Free services (e.g., pressure checks)
   - Warranty terms clarity

3. **User Experience**
   - Video tour of branches
   - Service process timeline
   - Team member profiles
   - Before/after results

4. **Social Proof**
   - Customer reviews carousel
   - Success stories/case studies
   - Social media feed integration
   - User-generated content

5. **Call-to-Action Optimization**
   - Multiple CTA variations per section
   - Sticky CTA header/footer
   - Pop-up or modal promotions
   - Time-limited offers display

6. **Mobile Optimization**
   - Mobile-specific imagery
   - Simplified form fields
   - One-tap WhatsApp contact
   - Geolocation to nearest branch

7. **Performance Features**
   - Customer search by plate number
   - Quick tire finder tool
   - Service availability calendar
   - Live chat integration

8. **Educational Content**
   - Tire care guide
   - When to replace tires
   - Tire maintenance tips
   - Safety information

---

## File Structure (Key Locations)

```
src/
├── app/
│   ├── page.tsx                    # Home page entry point
│   ├── layout.tsx                  # Root layout (fonts, providers)
│   ├── globals.css                 # Global styles
│   ├── productos/                  # Products catalog
│   ├── turnos/                     # Appointment booking
│   ├── quotation/                  # Quote generator
│   ├── servicios/                  # Services detail page
│   ├── sucursales/                 # Branch locations
│   ├── carrito/                    # Shopping cart
│   ├── equivalencias/              # Tire equivalence tool
│   ├── admin/                      # Admin dashboard
│   └── api/                        # Backend endpoints
├── components/
│   ├── TeslaHomePage.tsx           # Main home page (active)
│   ├── HomePage.tsx                # Alternative design
│   ├── Navbar.tsx                  # Navigation component
│   ├── WhatsAppBubble.tsx          # Floating WhatsApp button
│   ├── ThemeManager.tsx            # Dark mode toggle
│   └── ui/                         # shadcn/ui components
├── features/
│   ├── quotation/                  # Quote wizard feature
│   ├── appointments/               # Booking wizard
│   ├── reviews/                    # Review system
│   ├── cart/                       # Shopping cart
│   ├── checkout/                   # Payment flow
│   ├── tire-equivalence/           # Equivalence tool
│   └── admin/                      # Admin features
├── lib/
│   ├── env.ts                      # Environment variables
│   ├── supabase.ts                 # Database client
│   └── api-client.ts               # API helpers
├── providers/
│   ├── CartProvider.tsx            # Cart state management
│   └── SessionProvider.tsx         # Auth state
└── styles/
    └── (global CSS utilities)

tailwind.config.js                  # Tailwind configuration
package.json                        # Dependencies (78 prod + 11 dev)
```

---

## Current Design Decisions

### Why TeslaHomePage is Primary
1. **Professional Appeal**: Clean, minimalist design appeals to B2B aspect
2. **Conversion Focus**: Clear CTAs, reduced cognitive load
3. **Mobile-Friendly**: Better responsive behavior
4. **Modern Aesthetic**: Matches current web design trends
5. **Accessibility**: Better contrast ratios, readable typography

### Color Strategy
- **Yellow**: Brand recognition (Pirelli), action items, warmth
- **Black**: Authority, professionalism, contrast
- **White**: Cleanliness, trustworthiness, space
- **Grays**: Hierarchy, softness, secondary content

### Motion Strategy
- **Parallax scrolling**: Hero section engagement
- **Stagger animations**: List content revelation
- **Hover effects**: Interactive feedback
- **Page transitions**: Smooth navigation feel

---

## Key Statistics (Featured on Page)

- **40+ Años**: Time in business
- **6 Sucursales**: Physical locations in NOA
- **100K+ Clientes**: Served in last 5 years
- **100%**: Original products (authenticity)
- **33,639+**: Tires installed (credibility)
- **10,440+**: Services performed (experience)
- **4.9★**: Average rating (trust)
- **98%**: Customer satisfaction (quality)

---

## Next Steps for Enhancement

### Priority 1: Conversion Optimization
- [ ] A/B test different headline variations
- [ ] Optimize CTA button placement
- [ ] Add customer testimonials
- [ ] Implement form analytics

### Priority 2: Content Enrichment
- [ ] Add video content
- [ ] Expand services descriptions
- [ ] Include team bios
- [ ] Create case studies

### Priority 3: User Experience
- [ ] Mobile app banner (if app exists)
- [ ] FAQ section
- [ ] Live chat integration
- [ ] Service calculator tool

### Priority 4: Analytics & Tracking
- [ ] Google Analytics 4 setup
- [ ] Conversion tracking
- [ ] Heatmap analysis
- [ ] User journey mapping

---

## Dependencies Summary

**Key Production Dependencies** (78 total):
- UI: React, Next.js, Tailwind CSS, shadcn/ui, Framer Motion
- Database: Supabase, PostgreSQL (pg driver)
- Auth: NextAuth, @auth/core
- Data: XLSX, date-fns, QR codes
- Email: Resend
- Visualization: Pixi.js
- Animation: Canvas-confetti

**Key Dev Dependencies** (11 total):
- Testing: @playwright/test
- Build: Tailwind CSS, PostCSS, Autoprefixer
- Code Quality: TypeScript
- Development: shadcn CLI

---

## Notes

- **Current Status**: Active development (development branch)
- **Under Construction**: Can be enabled via `NEXT_PUBLIC_SHOW_UNDER_CONSTRUCTION` env var
- **Responsive**: Mobile-first design approach
- **Accessibility**: WCAG compliance targeted via shadcn/ui + Radix UI
- **Performance**: Turbopack enabled for faster dev builds
- **Analytics**: Ready for integration (metadata and viewport set)
