export interface PageBinSnapshot {
  isLandscape: boolean
  isFirstPage: boolean
  contentHtml: string  // serialized page content; empty string for landscape placeholders
}

export interface PaginationLayout {
  totalPages: number
  landscapePageIndices: number[]   // 0-indexed in merged sequence
  pages: PageBinSnapshot[]
}
