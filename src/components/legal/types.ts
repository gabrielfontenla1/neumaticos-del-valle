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
