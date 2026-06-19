export interface PdfThemeColors {
  accent: string
  accentSoft: string
  pass: string
  passSoft: string
  fail: string
  failSoft: string
  na: string
  naSoft: string
  border: string
  primary: string
  secondary: string
  surface: string
  bg: string
}

// Slots available in header/footer left and right bands.
export type HeaderSlot = 'logo' | 'company_name' | 'form_id' | 'schema_title' | 'doc_filename' | 'today'
export type FooterSlot = 'form_id' | 'doc_filename' | 'page_of_total' | 'today' | 'company_name'

export interface PdfTheme {
  id: string
  name: string
  system?: boolean   // bundled themes; cannot be deleted by the user

  page: {
    size: 'letter' | 'a4'
    margins: { top: number; right: number; bottom: number; left: number }
  }

  // Margins for landscape pages (defaults to page.margins if omitted)
  landscape_page?: {
    margins: { top: number; right: number; bottom: number; left: number }
  }

  colors: PdfThemeColors

  cover: {
    show_logo?: boolean        // look up via company_profile.logoUri source field
    show_title?: boolean       // schema.title
    show_form_meta?: boolean   // schema.formId + schema.version
    show_generated_date?: boolean
    show_company_block?: boolean
  }

  header: {
    left: HeaderSlot[]
    right: HeaderSlot[]
  }

  footer: {
    left: FooterSlot[]
    right: FooterSlot[]
  }
}
