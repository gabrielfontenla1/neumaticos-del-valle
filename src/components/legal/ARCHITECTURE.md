# Legal Pages - Frontend Architecture

Technical architecture document for the redesigned legal pages (`/privacidad`, `/terminos`).

---

## 1. Navbar Hiding Strategy

**Approach**: Modify `ConditionalNav.tsx` to exclude legal routes from the standard Navbar + Footer layout.

This is the simplest and most maintainable approach. No new layouts, route groups, or providers needed.

### Exact Code Change

**File**: `src/components/layout/ConditionalNav.tsx`

```diff
 export function ConditionalLayout({ children }: ConditionalLayoutProps) {
   const pathname = usePathname()

   // Don't show navigation components on admin or system pages
   const isAdminRoute = pathname.startsWith('/admin')
   const isSysRoute = pathname.startsWith('/sys/')
+  const isLegalRoute = pathname === '/privacidad' || pathname === '/terminos'

-  if (isAdminRoute || isSysRoute) {
+  if (isAdminRoute || isSysRoute || isLegalRoute) {
     return <>{children}</>
   }
```

**Rationale**:
- Only 2 legal routes exist (exact match, not prefix). Using `===` prevents false matches on hypothetical subroutes.
- Legal pages render their own `LegalHeader` and `LegalFooter` components, so the global Navbar/Footer must not render.
- No `pt-16` padding needed since the legal pages control their own header height.
- The WhatsApp bubble, Toaster, and other providers from `layout.tsx` remain active since they are outside `ConditionalLayout`.

---

## 2. Component Architecture

### File Structure

```
src/components/legal/
├── ARCHITECTURE.md          # This document
├── LegalLayout.tsx          # Full-page layout: header + sidebar + content + footer
├── LegalHeader.tsx          # Minimal top bar: logo + page title + back button
├── LegalSidebar.tsx         # Desktop sticky TOC with scroll-spy highlighting
├── LegalContent.tsx         # Content area wrapper with section rendering
├── LegalSection.tsx         # Individual section with anchor id
├── LegalProgressBar.tsx     # Reading progress indicator (fixed top)
├── LegalFooter.tsx          # Custom minimal footer for legal pages
├── LegalMobileMenu.tsx      # Mobile overlay with TOC navigation
├── useLegalScrollSpy.ts     # Custom hook: IntersectionObserver-based scroll spy
├── types.ts                 # Shared TypeScript interfaces
└── index.ts                 # Barrel exports
```

### Dependency Graph

```
LegalLayout (orchestrator)
├── LegalProgressBar        (standalone, uses useScroll from framer-motion)
├── LegalHeader             (receives: title, icon)
│   └── LegalMobileMenu     (receives: sections, activeSection, onClose)
├── LegalSidebar            (receives: sections, activeSection)
├── LegalContent            (receives: sections, intro)
│   └── LegalSection        (receives: single section data)
└── LegalFooter             (standalone)

useLegalScrollSpy           (used by LegalLayout, feeds activeSection to Sidebar + MobileMenu)
```

---

## 3. TypeScript Interfaces

**File**: `src/components/legal/types.ts`

```typescript
import type { LucideIcon } from 'lucide-react'

/** Single section of a legal page (privacy or terms). */
export interface LegalSectionData {
  /** Unique slug used as the HTML id anchor (e.g. "informacion-que-recopilamos") */
  id: string
  /** Lucide icon component rendered beside the section title */
  icon: LucideIcon
  /** Section heading text (without the index number) */
  title: string
  /** One or more paragraphs of body text */
  content: string[]
  /** Optional bullet-point list */
  list?: string[]
  /** Optional italic footnote / extra note */
  extra?: string
}

/** Page-level metadata passed to LegalLayout. */
export interface LegalPageConfig {
  /** The page title rendered in h1 (e.g. "Politica de Privacidad") */
  title: string
  /** Short subtitle / last-updated line */
  subtitle: string
  /** Introductory paragraph shown above sections */
  intro: string
  /** Lucide icon for the header badge */
  icon: LucideIcon
  /** Label for the header badge (e.g. "Legal") */
  badge: string
  /** All sections for this page */
  sections: LegalSectionData[]
}
```

---

## 4. Component Props Interfaces

### LegalLayout

```typescript
interface LegalLayoutProps {
  config: LegalPageConfig
}
```

This is the single entry point. Each page (`/privacidad`, `/terminos`) passes its `LegalPageConfig` and the layout handles everything: header, sidebar, content, footer, scroll-spy, progress bar.

`'use client'` -- this is the client boundary. It orchestrates:
1. Calls `useLegalScrollSpy` with section ids
2. Manages mobile menu open/close state
3. Renders all sub-components

### LegalHeader

```typescript
interface LegalHeaderProps {
  title: string
  icon: LucideIcon
  onMobileMenuToggle: () => void
  isMobileMenuOpen: boolean
}
```

- Fixed top bar (`h-14`), `bg-black/80 backdrop-blur-xl border-b border-white/5`
- Left: Back arrow link to `/` with "Volver" text
- Center: Icon + page title (truncated on mobile)
- Right: Hamburger button (visible only below `lg` breakpoint)

### LegalSidebar

```typescript
interface LegalSidebarProps {
  sections: LegalSectionData[]
  activeSection: string | null
}
```

- Renders inside a `<nav aria-label="Tabla de contenidos">`
- Each item is an `<a href="#section-id">` with smooth scroll behavior
- Active item: `text-[#FEE004]` with left border accent, `aria-current="true"`
- Inactive item: `text-gray-500 hover:text-gray-300`
- Sticky position: `sticky top-20` (below the header)

### LegalContent

```typescript
interface LegalContentProps {
  config: LegalPageConfig
}
```

- Renders the intro paragraph and maps over `config.sections` rendering `LegalSection` for each.

### LegalSection

```typescript
interface LegalSectionProps {
  section: LegalSectionData
  index: number
}
```

- Wraps in `<section id={section.id} className="scroll-mt-20">`
- `scroll-mt-20` ensures the anchor scroll lands below the fixed header
- Renders: icon + numbered title (h2), content paragraphs, optional list, optional extra note
- Framer Motion fade-in animation via `whileInView` (once: true)

### LegalProgressBar

```typescript
// No props - standalone component
```

- Uses `useScroll()` from framer-motion to get `scrollYProgress`
- Renders a fixed-top (`top-0`) thin bar with `scaleX` driven by scroll progress
- `bg-[#FEE004]` with `h-0.5` height, `origin-left`
- `z-[60]` to sit above the header

### LegalFooter

```typescript
// No props - standalone component
```

- Minimal footer with:
  - Copyright line
  - Cross-link to the other legal page ("Terminos" on the privacy page and vice versa)
  - "Volver al inicio" link
  - Developer credit (same as main Footer)
- Styling consistent with the main Footer's bottom bar

### LegalMobileMenu

```typescript
interface LegalMobileMenuProps {
  sections: LegalSectionData[]
  activeSection: string | null
  isOpen: boolean
  onClose: () => void
}
```

- Full-screen overlay (`fixed inset-0 z-[55] bg-black/95 backdrop-blur-xl`)
- AnimatePresence + motion.div for slide-in from right
- Close button (X icon) top-right
- Section list identical to sidebar but larger touch targets (`py-3`)
- Clicking a section: smooth-scrolls to anchor, then calls `onClose()`
- Keyboard: Escape key closes menu

---

## 5. Scroll-Spy Implementation

**File**: `src/components/legal/useLegalScrollSpy.ts`

```typescript
import { useState, useEffect, useRef } from 'react'

/**
 * Tracks which section is currently visible in the viewport using IntersectionObserver.
 *
 * @param sectionIds - Array of HTML element ids to observe
 * @returns The id of the currently active (most visible) section, or null
 */
export function useLegalScrollSpy(sectionIds: string[]): string | null {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Disconnect previous observer if section ids change
    observerRef.current?.disconnect()

    const callback: IntersectionObserverCallback = (entries) => {
      // Find the first intersecting entry (topmost visible section)
      const intersecting = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

      if (intersecting.length > 0) {
        setActiveSection(intersecting[0].target.id)
      }
    }

    observerRef.current = new IntersectionObserver(callback, {
      // rootMargin: negative top margin accounts for the fixed header (56px)
      // and adds overlap so the section activates slightly before reaching the top
      rootMargin: '-80px 0px -60% 0px',
    })

    // Observe each section element
    sectionIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [sectionIds])

  return activeSection
}
```

**Key design decisions**:
- `rootMargin: '-80px 0px -60% 0px'`: The top `-80px` accounts for the fixed header. The bottom `-60%` means a section must be in the top 40% of the viewport to be considered "active". This creates a natural reading-position trigger.
- Sorting by `boundingClientRect.top` ensures the topmost visible section wins when multiple sections are in view.
- The `sectionIds` array is stable (defined in page data), so the effect only runs once per page.
- `useRef` for the observer avoids recreating it on every render.

---

## 6. Content Data Strategy

Content remains as TypeScript arrays -- the same pattern already used in the current pages. No MDX, no CMS, no markdown parsing.

### Migration from Current Data

The existing `sections` arrays in `src/app/privacidad/page.tsx` and `src/app/terminos/page.tsx` must be updated to include `id` fields. Example transformation:

**Before** (current):
```typescript
const sections = [
  {
    icon: Database,
    title: 'Informacion que Recopilamos',
    content: [...],
    list: [...],
  },
]
```

**After** (new):
```typescript
const sections: LegalSectionData[] = [
  {
    id: 'informacion-que-recopilamos',
    icon: Database,
    title: 'Informacion que Recopilamos',
    content: [...],
    list: [...],
  },
]
```

The `id` is a kebab-case slug derived from the title. It serves as the anchor target for TOC links and the scroll-spy observer.

### Page Data Location

Each page file keeps its own data and config:

```
src/app/privacidad/page.tsx  --> defines privacidadConfig: LegalPageConfig
src/app/terminos/page.tsx    --> defines terminosConfig: LegalPageConfig
```

Both pages import `LegalLayout` and pass their config:

```typescript
import { LegalLayout } from '@/components/legal'
import { privacidadConfig } from './data'   // or inline

export default function PrivacidadPage() {
  return <LegalLayout config={privacidadConfig} />
}
```

---

## 7. Responsive Strategy

### Breakpoints

| Breakpoint | Sidebar | Mobile Menu | Content Width |
|------------|---------|-------------|---------------|
| < 1024px (below `lg`) | Hidden | Hamburger available | Full width |
| >= 1024px (`lg`) | Visible, 260px fixed | Hidden | `flex-1`, max-width 720px |

### Desktop Layout (>= lg)

```
+---------------------------------------------------+
| LegalProgressBar (fixed top, full width)           |
+---------------------------------------------------+
| LegalHeader (fixed, full width, h-14)              |
+---------------------------------------------------+
|           |                                        |
| Sidebar   |  Content Area                          |
| 260px     |  flex-1 (max-w-3xl)                    |
| sticky    |                                        |
| top-20    |  [Intro paragraph]                     |
|           |  [Section 1]                           |
| [TOC      |  [Section 2]                           |
|  items]   |  [Section 3]                           |
|           |  ...                                   |
|           |                                        |
+---------------------------------------------------+
| LegalFooter (full width)                           |
+---------------------------------------------------+
```

**CSS structure** (LegalLayout):
```
div.min-h-screen.bg-black
  LegalProgressBar            // fixed top-0
  LegalHeader                 // fixed top-0 (below progress bar via z-index)
  div.flex.pt-14              // pt-14 compensates for fixed header
    aside.hidden.lg:block     // Sidebar container, w-[260px], sticky
      LegalSidebar
    main.flex-1.max-w-3xl     // Content area
      LegalContent
  LegalFooter
```

### Mobile Layout (< lg)

```
+---------------------------------------------------+
| LegalProgressBar (fixed top)                       |
+---------------------------------------------------+
| LegalHeader (fixed, hamburger icon on right)       |
+---------------------------------------------------+
|                                                    |
|  Content Area (full width, px-4)                   |
|                                                    |
|  [Intro paragraph]                                 |
|  [Section 1]                                       |
|  [Section 2]                                       |
|  ...                                               |
|                                                    |
+---------------------------------------------------+
| LegalFooter                                        |
+---------------------------------------------------+

// When hamburger is tapped:
+---------------------------------------------------+
| LegalMobileMenu (fixed overlay, z-[55])            |
|   [X close button]                                 |
|   [Section 1 link]                                 |
|   [Section 2 link]                                 |
|   ...                                              |
+---------------------------------------------------+
```

### Padding and Spacing

- Desktop content: `px-8 py-12`
- Mobile content: `px-4 py-8`
- Sidebar inner padding: `px-6 py-8`
- Section gap: `space-y-8` (desktop), `space-y-6` (mobile)
- Sidebar to content gap: `gap-8` on the flex container

---

## 8. Accessibility

### Landmark Roles

```html
<!-- LegalHeader -->
<header role="banner">...</header>

<!-- LegalSidebar -->
<nav aria-label="Tabla de contenidos">
  <ul>
    <li><a href="#section-id" aria-current="true">Active Section</a></li>
    <li><a href="#section-id">Other Section</a></li>
  </ul>
</nav>

<!-- LegalContent -->
<main id="legal-content" role="main">
  <section id="section-id" aria-labelledby="section-id-heading">
    <h2 id="section-id-heading">Section Title</h2>
    ...
  </section>
</main>

<!-- LegalFooter -->
<footer role="contentinfo">...</footer>
```

### Skip-to-Content Link

Rendered as the first child inside `LegalLayout`:

```html
<a
  href="#legal-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2
         focus:z-[70] focus:bg-[#FEE004] focus:text-black focus:px-4 focus:py-2
         focus:rounded-lg focus:font-medium"
>
  Saltar al contenido
</a>
```

### Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | Anywhere | Navigate focusable elements in natural order |
| `Escape` | Mobile menu open | Close the mobile menu |
| `Enter` / `Space` | Focused TOC link | Smooth-scroll to the section |
| `Enter` / `Space` | Hamburger button | Toggle mobile menu |

### ARIA Attributes

- **Mobile menu toggle**: `aria-expanded={isOpen}`, `aria-controls="legal-mobile-menu"`, `aria-label="Abrir menu de navegacion"`
- **Mobile menu container**: `id="legal-mobile-menu"`, `role="dialog"`, `aria-modal="true"`, `aria-label="Tabla de contenidos"`
- **Active TOC item**: `aria-current="true"`
- **Progress bar**: `role="progressbar"`, `aria-label="Progreso de lectura"`, `aria-valuemin={0}`, `aria-valuemax={100}`

### Focus Management

- When mobile menu opens: focus moves to the close button
- When mobile menu closes: focus returns to the hamburger button
- Use `useRef` to store the trigger element reference

---

## 9. Animations

All animations use **Framer Motion** (already a project dependency).

### Progress Bar
```typescript
// Uses useScroll() + motion.div with scaleX
const { scrollYProgress } = useScroll()
<motion.div style={{ scaleX: scrollYProgress }} />
```

### Header
- Fade in on mount: `initial={{ opacity: 0 }} animate={{ opacity: 1 }}`
- No exit animation needed (page-level component)

### Sidebar TOC Items
- Staggered fade-in: `variants` with `staggerChildren: 0.05`
- Active indicator: `layoutId="active-section"` for smooth position transitions between items

### Content Sections
- `whileInView` with `once: true` for a single fade-in per section:
  ```typescript
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
  ```
- Note: project convention is fade-in only (per commit `f3b5931`), but a subtle `y: 12` is acceptable for legal pages since they are separate from the product catalog.

### Mobile Menu
- AnimatePresence for mount/unmount
- Overlay backdrop: fade in `opacity: 0 -> 1`
- Menu panel: slide from right `x: '100%' -> '0%'`
- Menu items: staggered fade-in

---

## 10. Performance

### No Lazy Loading Required

Legal pages are static text with minimal interactivity. The entire component tree renders on initial load. Code-splitting at the route level (Next.js default) is sufficient.

### Memoization

- `useLegalScrollSpy`: The `sectionIds` array should be defined outside the component or wrapped in `useMemo` to prevent the observer from reinitializing on every render.
- Sidebar TOC items: No memoization needed -- the list is small (8-9 items) and re-renders are cheap.

### CSS Optimizations

- `will-change: transform` on the progress bar (animated continuously on scroll)
- `contain: content` on each `LegalSection` to limit layout recalculation scope
- `backdrop-blur` only on header and mobile menu (not on sections) to avoid GPU overhead

### Bundle Impact

No new dependencies. Everything uses existing packages:
- `framer-motion` (already in bundle)
- `lucide-react` (already in bundle, tree-shakes per icon)
- `next/link` (framework)

---

## 11. SEO

### generateMetadata

Each page exports a `generateMetadata` function (server-side, defined in the page file before the default export):

```typescript
// src/app/privacidad/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politica de Privacidad | Neumaticos del Valle',
  description: 'Conoce como recopilamos, usamos y protegemos tu informacion personal en Neumaticos del Valle SRL.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://neumaticosdelvallesrl.com/privacidad',
  },
}
```

```typescript
// src/app/terminos/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terminos y Condiciones | Neumaticos del Valle',
  description: 'Terminos y condiciones de uso del sitio web y servicios de Neumaticos del Valle SRL.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://neumaticosdelvallesrl.com/terminos',
  },
}
```

### Heading Hierarchy

Each page has exactly one `<h1>` (the page title in the intro/hero area, rendered by `LegalContent`), and each section uses `<h2>`. No `<h3>` is needed since sections are flat.

```
h1: "Politica de Privacidad"
  h2: "1. Informacion que Recopilamos"
  h2: "2. Uso de la Informacion"
  h2: "3. WhatsApp y Comunicaciones"
  ...
```

### Structured Data

Not required for legal pages. Standard meta tags are sufficient.

---

## 12. Theming and Visual Design

### Color Palette (Dark Theme Only)

Legal pages always render in dark mode. No theme switching needed.

| Element | Color | Tailwind |
|---------|-------|----------|
| Page background | `#000000` | `bg-black` |
| Card/section background | `rgba(255,255,255,0.03)` | `bg-white/[0.03]` |
| Section border | `rgba(255,255,255,0.06)` | `border-white/[0.06]` |
| Section border hover | `rgba(255,255,255,0.1)` | `hover:border-white/10` |
| Primary accent | `#FEE004` | `text-[#FEE004]` |
| Heading text | `#FFFFFF` | `text-white` |
| Body text | `#9CA3AF` | `text-gray-400` |
| Muted text | `#6B7280` | `text-gray-500` |
| Sidebar active text | `#FEE004` | `text-[#FEE004]` |
| Sidebar inactive text | `#6B7280` | `text-gray-500` |
| Sidebar active border | `#FEE004` | `border-l-[#FEE004]` |
| Progress bar | `#FEE004` | `bg-[#FEE004]` |
| Icon background | `rgba(254,224,4,0.1)` | `bg-[#FEE004]/10` |

### Typography

Uses the project's existing font stack (Inter via `--font-sans`):

| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| Page title (h1) | `text-3xl sm:text-4xl lg:text-5xl` | `font-bold` | default |
| Section heading (h2) | `text-lg sm:text-xl` | `font-semibold` | default |
| Body text | `text-sm sm:text-base` | `font-normal` | default |
| Sidebar TOC item | `text-sm` | `font-normal` (active: `font-medium`) | default |
| Badge label | `text-xs` | `font-medium` | `tracking-wider uppercase` |
| Footer text | `text-xs` | `font-normal` | default |

---

## 13. Implementation Sequence

Recommended order for the implementer:

1. **types.ts** -- Shared interfaces (no dependencies)
2. **useLegalScrollSpy.ts** -- Custom hook (no component dependencies)
3. **LegalSection.tsx** -- Leaf component (renders one section)
4. **LegalContent.tsx** -- Wraps intro + sections
5. **LegalSidebar.tsx** -- TOC navigation
6. **LegalProgressBar.tsx** -- Scroll progress
7. **LegalHeader.tsx** -- Top bar with hamburger trigger
8. **LegalMobileMenu.tsx** -- Mobile overlay
9. **LegalFooter.tsx** -- Bottom section
10. **LegalLayout.tsx** -- Orchestrator that composes all above
11. **index.ts** -- Barrel exports
12. **ConditionalNav.tsx** -- Add legal route exclusion
13. **Page files** -- Update `/privacidad` and `/terminos` to use new components

---

## 14. Testing Strategy

### Manual Testing Checklist

- [ ] Desktop: Sidebar TOC highlights correctly on scroll
- [ ] Desktop: Clicking TOC item scrolls to correct section
- [ ] Mobile: Hamburger button opens/closes overlay
- [ ] Mobile: Tapping a section in overlay scrolls and closes menu
- [ ] Escape key closes mobile menu
- [ ] Progress bar fills from 0% to 100% during scroll
- [ ] Back button navigates to `/`
- [ ] Cross-links between privacy and terms pages work
- [ ] Skip-to-content link works with keyboard
- [ ] No horizontal overflow on any viewport width
- [ ] Smooth animations with no jank

### Automated (if applicable)

- Type-check: `npm run type-check` must pass
- Lint: `npm run lint` must pass
- Build: `npm run build` must succeed with no errors

---

## 15. Summary of Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Navbar hiding | Modify ConditionalNav.tsx | Simplest approach, 1-line change, no new layouts |
| Content format | TypeScript arrays | Matches existing pattern, no new deps |
| Scroll spy | IntersectionObserver hook | Native API, no library needed, performant |
| Sidebar visibility | CSS (`hidden lg:block`) | No JS layout shifting, clean breakpoint |
| Mobile menu | Framer Motion overlay | Consistent with project animation library |
| New dependencies | None | Everything uses existing packages |
| Server Components | Pages are Server Components, LegalLayout is Client | Metadata exports require Server Component pages |
| Dark mode | Always dark | Legal pages match the site's dark aesthetic |
