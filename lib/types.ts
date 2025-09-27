export interface Company {
  id: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  sector: string | null;
  backing_vcs: string[] | null;
  stage: string | null;
  founders: string[] | null;
  website: string | null;
  logo_url: string | null;
}

export interface CompanySearchResult extends Company {
  similarity: number;
  rank_score: number;
}

export interface SearchFilters {
  query: string;
  tags: string[];
}
