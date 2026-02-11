# Legal Pages Redesign - UX/UI Design Specifications

## Overview

Premium redesign of Privacy Policy (`/privacidad`) and Terms of Service (`/terminos`) pages for Neumaticos del Valle SRL. These pages replace the current single-column card layout with a modern document-reader experience featuring scroll-spy navigation, reading progress tracking, and responsive sidebar layout.

**Design Philosophy**: Clean, professional legal document reader that maintains the site's dark premium aesthetic while maximizing readability and navigation efficiency.

---

## 1. Layout Architecture

### Page Structure (Top to Bottom)

```
+-----------------------------------------------------------+
| [ReadingProgressBar] - fixed top, full width, z-60        |
+-----------------------------------------------------------+
| [LegalHeader] - sticky top below progress bar, z-50       |
|   Logo (link home) | Page Title | Back Button             |
+-----------------------------------------------------------+
|                                                            |
|  +-------------+  +------------------------------------+  |
|  | [TableOf    |  | [LegalContent]                     |  |
|  |  Contents]  |  |                                    |  |
|  |             |  |   Hero Section (title, date, intro) |  |
|  | sticky      |  |                                    |  |
|  | left sidebar|  |   Section 1                        |  |
|  |             |  |   Section 2                        |  |
|  | - Item 1    |  |   Section 3                        |  |
|  | > Item 2 *  |  |   ...                              |  |
|  | - Item 3    |  |   Section N                        |  |
|  | - Item 4    |  |                                    |  |
|  |             |  +------------------------------------+  |
|  +-------------+                                           |
|                                                            |
+-----------------------------------------------------------+
| [LegalFooter] - page-specific footer                       |
|   Cross-navigation | Last Updated | Contact               |
+-----------------------------------------------------------+
```

### No Global Navbar/Footer

These pages opt out of the global `ConditionalLayout` (Navbar + Footer). The `ConditionalNav` component must be updated to exclude `/privacidad` and `/terminos` routes, rendering only `{children}` for those paths (same pattern as `/admin` and `/sys/`).

### Custom Minimal Header (`LegalHeader`)

- **Position**: `sticky top-0 z-50` (sits below the progress bar)
- **Height**: `h-16` (64px)
- **Background**: `bg-black/80 backdrop-blur-xl border-b border-white/5`
- **Layout**: Flex row, `justify-between items-center`
- **Left**: Logo image (`/NDV_Logo.svg`, height 32px, links to `/`)
- **Center**: Page title text (`text-sm font-medium text-gray-400`)
- **Right**: Back button (ArrowLeft icon + "Volver" text, links to `/`, `text-gray-500 hover:text-white`)
- **Padding**: `px-4 sm:px-6 lg:px-8` within `max-w-7xl mx-auto`

### Sidebar - Table of Contents (`TableOfContents`)

- **Position**: `sticky top-20` (below header, accounts for header height 64px + 16px gap)
- **Width**: `w-64` fixed on desktop
- **Max Height**: `max-h-[calc(100vh-6rem)]` with `overflow-y-auto`
- **Background**: Transparent (no card, clean integration)
- **Content**: Ordered list of section titles, each clickable to smooth-scroll to section
- **Top label**: `text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4` reading "Contenido"
- **Items**: `text-sm text-gray-500 hover:text-white transition-colors py-2 pl-4 border-l-2 border-white/5`
- **Active item**: `text-white border-l-2 border-[#FEE004] bg-white/[0.02]` (yellow left border, white text)
- **Scrollbar**: Custom thin scrollbar (`scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`)

### Main Content Area (`LegalContent`)

- **Width**: `flex-1 max-w-3xl`
- **Layout**: Vertical stack of sections with consistent spacing
- **Section gap**: `space-y-16` (64px between major sections)
- **Padding**: `py-12 px-4 sm:px-6 lg:px-0`

### Page-Specific Footer (`LegalFooter`)

- **Background**: `bg-black border-t border-white/5`
- **Padding**: `py-8`
- **Max Width**: `max-w-7xl mx-auto`
- **Layout**: Three-row centered layout
  - **Row 1**: Cross-navigation links
    - When on `/privacidad`: Show link to "Terminos y Condiciones" with ArrowRight icon
    - When on `/terminos`: Show link to "Politica de Privacidad" with ArrowRight icon
    - Style: `text-sm text-gray-400 hover:text-[#FEE004] transition-colors inline-flex items-center gap-2`
  - **Row 2**: "Ultima actualizacion: Febrero 2026" in `text-xs text-gray-600`
  - **Row 3**: Contact line: "Consultas: WhatsApp +54 9 385 585-4741" with link, `text-xs text-gray-600`

### Reading Progress Bar (`ReadingProgressBar`)

- **Position**: `fixed top-0 left-0 z-60` (above everything)
- **Height**: `h-0.5` (2px) - thin, unobtrusive
- **Background track**: Transparent
- **Fill**: `bg-[#FEE004]` (Pirelli yellow)
- **Width**: Dynamic, 0% to 100% based on scroll position relative to content area
- **Transition**: `transition-none` for smooth real-time tracking (no CSS transition delay)
- **Behavior**: Tracks scroll progress of the main content area only (not the full page height)

---

## 2. Responsive Behavior

### Desktop (1024px and above - `lg:`)

```
+--------------------------------------------------+
| [Header - full width]                            |
+--------------------------------------------------+
|  [Sidebar 256px]  |  [Content max-w-3xl]         |
|  sticky           |  scrollable                   |
|  visible          |                               |
+--------------------------------------------------+
| [Footer - full width]                            |
+--------------------------------------------------+
```

- Sidebar always visible, sticky positioned
- Content area takes remaining width
- Container: `max-w-7xl mx-auto flex gap-8 lg:gap-12`
- Sidebar: `hidden lg:block w-64 flex-shrink-0`
- Content: `flex-1 min-w-0 max-w-3xl`

### Tablet (768px to 1023px - `md:`)

```
+--------------------------------------------------+
| [Header] + [TOC Toggle Button on right]          |
+--------------------------------------------------+
|  [Content - full width, max-w-3xl centered]      |
|                                                   |
|  (Sidebar hidden, togglable overlay)              |
+--------------------------------------------------+
| [Footer]                                         |
+--------------------------------------------------+
```

- Sidebar hidden by default
- Header gains a TOC toggle button (List icon, right side)
- Toggle reveals sidebar as slide-in panel from right
- Panel: `fixed top-16 right-0 w-72 h-[calc(100vh-4rem)] bg-black/95 backdrop-blur-xl border-l border-white/10 z-40`
- Panel animation: `translateX(100%) -> translateX(0)` with 200ms ease-out
- Backdrop overlay: `fixed inset-0 bg-black/40 z-30` (click to close)

### Mobile (below 768px - default/`sm:`)

```
+--------------------------------------------------+
| [Header compact] + [Hamburger TOC button]        |
+--------------------------------------------------+
|  [Content - full width, padded]                  |
|                                                   |
|  (Sidebar as slide-in overlay from right)         |
+--------------------------------------------------+
| [Footer - stacked]                               |
+--------------------------------------------------+
```

- Header: Logo smaller (height 28px), center title hidden, back button icon-only
- TOC button: Hamburger-style icon (List from lucide) in header right area
- Slide-in panel: `fixed top-0 right-0 w-[85vw] max-w-sm h-full bg-black/95 backdrop-blur-xl z-50`
- Panel has its own close button (X icon) at top right
- Panel items animate in with stagger: `opacity: 0 -> 1, translateX(16px) -> 0`, 50ms stagger per item
- Backdrop: `fixed inset-0 bg-black/60 z-40`, click to close
- Content: `px-4` padding, sections use full width
- Footer: Stack all rows vertically with `space-y-4`

---

## 3. Visual Design

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `bg-black` (#000000) | Page background |
| `--bg-secondary` | `bg-gray-950` (#030712) | Alternate section bg |
| `--bg-card` | `bg-white/5` | Glassmorphism card base |
| `--border-card` | `border-white/10` | Card borders |
| `--border-subtle` | `border-white/5` | Dividers, footer borders |
| `--text-heading` | `text-white` (#FFFFFF) | H1, H2 headings |
| `--text-body` | `text-gray-300` (#D1D5DB) | Body text, paragraphs |
| `--text-secondary` | `text-gray-500` (#6B7280) | Dates, captions, extras |
| `--text-muted` | `text-gray-600` (#4B5563) | Footer credits |
| `--accent` | `#FEE004` | Active states, links, progress, bullets |
| `--accent-bg` | `bg-[#FEE004]/10` | Icon backgrounds |
| `--accent-border` | `border-[#FEE004]/20` | Icon container borders |

### Typography Scale

| Element | Tailwind Classes | Notes |
|---------|-----------------|-------|
| Page Title (H1) | `text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent` | Gradient text, hero |
| Section Title (H2) | `text-xl sm:text-2xl font-semibold text-white` | Section headings |
| Intro Paragraph | `text-lg text-gray-400 leading-relaxed` | Below H1 |
| Body Text | `text-base text-gray-300 leading-relaxed` | Main content |
| List Items | `text-sm text-gray-300 leading-relaxed` | Bulleted lists |
| Extra/Note Text | `text-sm text-gray-500 leading-relaxed italic` | Additional notes |
| Sidebar Items | `text-sm` | TOC navigation |
| Sidebar Label | `text-xs font-semibold text-gray-600 uppercase tracking-wider` | "Contenido" label |
| Last Updated | `text-sm text-gray-500` | Date below title |
| Legal Badge | `text-sm font-medium text-[#FEE004] tracking-wider uppercase` | "Legal" tag |

### Card/Section Styling

Each content section uses a glassmorphism card:

```
bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8
```

- Corner radius: `rounded-2xl` (16px)
- Padding: `p-6` mobile, `p-8` desktop
- Hover: No hover effect on cards (they are content containers, not interactive)

### Icon Treatment

- Icon containers: `w-10 h-10 rounded-xl bg-[#FEE004]/10 border border-[#FEE004]/20 flex items-center justify-center`
- Icon size: `w-5 h-5 text-[#FEE004]`
- Each section has a unique Lucide icon (same as current implementation)

### Bullet Points

- Yellow dot: `w-1.5 h-1.5 rounded-full bg-[#FEE004] mt-2 flex-shrink-0`
- List container: `space-y-2.5`
- Item layout: `flex items-start gap-3`

### Spacing System

| Context | Value | Tailwind |
|---------|-------|----------|
| Between sections (major) | 64px | `space-y-16` |
| Inside card (elements) | 16px | `space-y-4` |
| List item spacing | 10px | `space-y-2.5` |
| Header-to-content gap | 48px | `pt-12` |
| Section padding horizontal | 24px / 32px | `p-6 sm:p-8` |
| Sidebar-to-content gap | 32px / 48px | `gap-8 lg:gap-12` |

---

## 4. Interactive Elements

### Scroll-Spy Behavior

**Mechanism**: IntersectionObserver on each section element.

- Observer config: `{ rootMargin: '-20% 0px -80% 0px', threshold: 0 }`
- This ensures the section is considered "active" when its top crosses 20% from the viewport top
- When a section enters the observed area, update active section ID in state
- Sidebar item matching active section gets active styles
- Smooth transition: sidebar items use `transition-all duration-200` for border/color changes

**Active state styling**:
```
Default:    text-gray-500 border-l-2 border-white/5 pl-4 py-2
Active:     text-white border-l-2 border-[#FEE004] pl-4 py-2 bg-white/[0.02]
Hover:      text-gray-300 (non-active items only)
```

**Click behavior**: Clicking a sidebar item smooth-scrolls to that section using `element.scrollIntoView({ behavior: 'smooth', block: 'start' })` with an offset accounting for the sticky header height (80px).

### Reading Progress Bar

**Calculation**:
```typescript
const scrollProgress = (scrollTop - contentTop) / (contentHeight - viewportHeight)
const clampedProgress = Math.min(Math.max(scrollProgress, 0), 1)
```

- Uses `window.scrollY` and content container's `offsetTop` / `scrollHeight`
- Updates on `scroll` event with `requestAnimationFrame` for performance
- No CSS transitions (direct width manipulation for real-time feel)
- Fades in after scrolling past the hero section (opacity 0 -> 1)

### Section Reveal Animations (Framer Motion)

Each section card animates in on viewport entry:

```typescript
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
}
```

- Triggered via `whileInView` with `viewport={{ once: true, margin: '-50px' }}`
- `once: true` ensures animation fires only once per page load
- The hero section uses staggered children: `staggerChildren: 0.1`

### Hover & Interaction States

| Element | Default | Hover | Active/Focus |
|---------|---------|-------|--------------|
| Back button | `text-gray-500` | `text-white` | - |
| Sidebar items | `text-gray-500 border-white/5` | `text-gray-300` | `text-white border-[#FEE004]` |
| Footer cross-nav link | `text-gray-400` | `text-[#FEE004]` | - |
| Mobile menu toggle | `text-gray-400` | `text-white` | - |
| Logo link | normal | `opacity-80` | - |

All transitions: `transition-colors duration-200` unless otherwise specified.

### Mobile Menu Animations

**Panel slide-in**:
```typescript
// Panel container
const panelVariants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'tween', duration: 0.25, ease: 'easeOut' } },
  exit: { x: '100%', transition: { type: 'tween', duration: 0.2, ease: 'easeIn' } }
}
```

**Item stagger** (inside panel):
```typescript
const itemVariants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0 }
}

const containerVariants = {
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
}
```

**Backdrop**:
```typescript
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
}
```

Use `AnimatePresence` for exit animations on both backdrop and panel.

---

## 5. Component Inventory

### `ReadingProgressBar`

**File**: `src/components/legal/ReadingProgressBar.tsx`

**Props**:
```typescript
interface ReadingProgressBarProps {
  contentRef: RefObject<HTMLDivElement>  // ref to the scrollable content container
}
```

**States**:
- `progress: number` (0 to 1)
- `visible: boolean` (false until scroll past hero)

**Visual States**:
- Invisible: `opacity-0` (before user scrolls past hero)
- Visible: `opacity-100 h-0.5 bg-[#FEE004]` width = `${progress * 100}%`

---

### `LegalHeader`

**File**: `src/components/legal/LegalHeader.tsx`

**Props**:
```typescript
interface LegalHeaderProps {
  title: string           // "Politica de Privacidad" or "Terminos y Condiciones"
  onToggleSidebar: () => void  // mobile/tablet TOC toggle
  showMenuButton: boolean      // true on tablet/mobile
}
```

**States**:
- Default: Sticky header with logo, title, back button
- Mobile: Center title hidden, menu button visible

**Visual States**:
- Normal: `bg-black/80 backdrop-blur-xl border-b border-white/5`
- At top (no scroll): Same appearance (consistent)

---

### `TableOfContents`

**File**: `src/components/legal/TableOfContents.tsx`

**Props**:
```typescript
interface TableOfContentsProps {
  sections: Array<{ id: string; title: string; icon: LucideIcon }>
  activeSection: string    // currently active section ID
  onSectionClick: (id: string) => void
}
```

**States**:
- Desktop: Sticky sidebar, always visible
- Tablet/Mobile: Hidden, shown as overlay panel when toggled

**Visual States per Item**:
- Default: `text-gray-500 border-l-2 border-white/5`
- Hover: `text-gray-300`
- Active: `text-white border-l-2 border-[#FEE004] bg-white/[0.02]`

---

### `MobileTableOfContents`

**File**: `src/components/legal/MobileTableOfContents.tsx`

**Props**:
```typescript
interface MobileTableOfContentsProps {
  sections: Array<{ id: string; title: string; icon: LucideIcon }>
  activeSection: string
  isOpen: boolean
  onClose: () => void
  onSectionClick: (id: string) => void
}
```

**States**:
- Closed: Not rendered (AnimatePresence exit)
- Open: Slide-in panel from right + backdrop overlay

**Visual States**:
- Backdrop: `bg-black/60` (click to close)
- Panel: `bg-black/95 backdrop-blur-xl border-l border-white/10`
- Close button: `text-gray-500 hover:text-white` (X icon)
- Items: Same as `TableOfContents` items with stagger animation

---

### `LegalSection`

**File**: `src/components/legal/LegalSection.tsx`

**Props**:
```typescript
interface LegalSectionProps {
  id: string
  icon: LucideIcon
  index: number          // section number (1-based for display)
  title: string
  content: string[]      // array of paragraphs
  list?: string[]        // optional bulleted list
  extra?: string         // optional italic footnote
}
```

**States**:
- Hidden: `opacity: 0, y: 20` (before viewport entry)
- Visible: `opacity: 1, y: 0` (after animation)

**Visual Structure**:
```
+-----------------------------------------------------+
| [Icon Container]  [Number]. [Title]                  |
|                                                       |
|     [Paragraph text]                                  |
|                                                       |
|     * [List item 1]                                   |
|     * [List item 2]                                   |
|     * [List item 3]                                   |
|                                                       |
|     [Extra note in italic]                            |
+-----------------------------------------------------+
```

Card: `bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8`

---

### `LegalHero`

**File**: `src/components/legal/LegalHero.tsx`

**Props**:
```typescript
interface LegalHeroProps {
  icon: LucideIcon        // Shield for privacy, FileText for terms
  title: string           // Page heading
  description: string     // Intro paragraph
  lastUpdated: string     // "Febrero 2026"
}
```

**Visual Structure**:
```
[Legal Badge]  "LEGAL"
[H1 Title]     gradient text
[Date]         "Ultima actualizacion: Febrero 2026"
[Description]  intro paragraph
```

Animation: Stagger container with fadeIn children.

---

### `LegalFooter`

**File**: `src/components/legal/LegalFooter.tsx`

**Props**:
```typescript
interface LegalFooterProps {
  currentPage: 'privacidad' | 'terminos'
}
```

**Visual Structure**:
```
-------------------------------------------
  [ArrowRight] Ver Terminos y Condiciones   (or Politica de Privacidad)

  Ultima actualizacion: Febrero 2026

  Consultas: WhatsApp +54 9 385 585-4741
-------------------------------------------
```

**Visual States**:
- Cross-nav link: `text-gray-400 hover:text-[#FEE004]`
- Date/contact: `text-gray-600`

---

### `LegalPageLayout`

**File**: `src/components/legal/LegalPageLayout.tsx`

**Purpose**: Orchestrator component that assembles the full layout and manages state.

**Props**:
```typescript
interface LegalPageLayoutProps {
  page: 'privacidad' | 'terminos'
  icon: LucideIcon
  title: string
  description: string
  lastUpdated: string
  sections: Array<{
    id: string
    icon: LucideIcon
    title: string
    content: string[]
    list?: string[]
    extra?: string
  }>
}
```

**Internal State**:
- `activeSection: string` - managed by scroll-spy hook
- `sidebarOpen: boolean` - mobile/tablet sidebar toggle
- `contentRef: RefObject<HTMLDivElement>` - for progress bar calculation

**Responsibilities**:
- Renders `ReadingProgressBar`, `LegalHeader`, sidebar + content layout, `LegalFooter`
- Manages scroll-spy via custom hook `useScrollSpy`
- Manages mobile sidebar open/close
- Passes active section state to `TableOfContents` and `MobileTableOfContents`

---

### `useScrollSpy` (Custom Hook)

**File**: `src/components/legal/useScrollSpy.ts`

```typescript
function useScrollSpy(sectionIds: string[], offset?: number): string
```

**Parameters**:
- `sectionIds`: Array of DOM element IDs to observe
- `offset`: Pixel offset for activation point (default: 100)

**Returns**: Currently active section ID string

**Implementation**:
- Creates IntersectionObserver with `rootMargin: '-20% 0px -80% 0px'`
- Observes all section elements
- Returns the ID of the most recently intersecting section
- Cleanup on unmount

---

## 6. Page Route Implementation

### Privacy Page (`src/app/privacidad/page.tsx`)

Imports `LegalPageLayout` and passes privacy-specific data (sections array with icons, titles, content). Marked as `'use client'`.

### Terms Page (`src/app/terminos/page.tsx`)

Imports `LegalPageLayout` and passes terms-specific data (sections array with icons, titles, content). Marked as `'use client'`.

### ConditionalNav Update (`src/components/layout/ConditionalNav.tsx`)

Add legal routes to the exclusion list:

```typescript
const isLegalRoute = pathname === '/privacidad' || pathname === '/terminos'

if (isAdminRoute || isSysRoute || isLegalRoute) {
  return <>{children}</>
}
```

This removes the global Navbar and Footer from legal pages so the custom `LegalHeader` and `LegalFooter` take over.

---

## 7. Accessibility Requirements

- All interactive elements must be keyboard navigable (Tab, Enter, Escape)
- Sidebar items must have `role="navigation"` with `aria-label="Tabla de contenidos"`
- Active sidebar item: `aria-current="true"`
- Mobile panel: `role="dialog"`, `aria-modal="true"`, `aria-label="Tabla de contenidos"`
- Escape key closes mobile sidebar panel
- Focus trap within mobile sidebar when open
- Progress bar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- Section headings use proper `h1` (page title) and `h2` (section titles) hierarchy
- Color contrast: gray-300 on black exceeds WCAG AA (ratio ~12:1)
- Skip-to-content link hidden but focusable for screen readers

---

## 8. Performance Considerations

- Scroll event listeners use `requestAnimationFrame` throttling
- IntersectionObserver for scroll-spy (no scroll listener needed)
- `once: true` on Framer Motion `whileInView` prevents re-animation
- Sidebar rendered once, not re-rendered on scroll (only active state changes)
- Mobile panel uses `AnimatePresence` with `mode="wait"` for clean mount/unmount
- No layout shifts: all containers have explicit dimensions or constraints
- Images: Only the logo SVG, already optimized with Next.js Image component

---

## 9. Data Architecture

Both pages share the same component structure. The only difference is the data passed to `LegalPageLayout`. Section data remains defined as constants in each page file (same pattern as current implementation), keeping the content co-located with the route.

Section IDs are generated from a slugified version of the title (e.g., `informacion-que-recopilamos`, `uso-de-la-informacion`) to enable scroll-spy and deep linking via URL hash.

---

## 10. File Structure Summary

```
src/components/legal/
  DESIGN_SPECS.md           -- This file
  LegalPageLayout.tsx       -- Orchestrator layout component
  LegalHeader.tsx           -- Custom sticky header
  LegalHero.tsx             -- Hero section (title, date, intro)
  LegalSection.tsx          -- Individual content section card
  LegalFooter.tsx           -- Custom page footer with cross-nav
  TableOfContents.tsx       -- Desktop sticky sidebar TOC
  MobileTableOfContents.tsx -- Mobile/tablet slide-in TOC panel
  ReadingProgressBar.tsx    -- Top reading progress indicator
  useScrollSpy.ts           -- Scroll-spy custom hook
```

Pages consume these components:
```
src/app/privacidad/page.tsx -- Privacy policy (imports LegalPageLayout)
src/app/terminos/page.tsx   -- Terms of service (imports LegalPageLayout)
```

Layout exclusion:
```
src/components/layout/ConditionalNav.tsx -- Add /privacidad, /terminos to exclusion list
```
