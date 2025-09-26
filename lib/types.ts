export interface Company {
  id: string
  name: string
  description: string | null
  tags: string[]
  sector: string | null
  backing_vcs: string[]
  stage: string | null
  founders: string[]
  website: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface CompanySearchResult extends Company {
  similarity: number
  rank_score: number
}

export interface SearchFilters {
  query: string
  tags: string[]
}
