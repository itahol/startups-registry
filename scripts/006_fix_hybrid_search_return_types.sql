-- Fix hybrid_search_companies return types to use double precision
-- This migration replaces the function implementation to ensure
-- computed similarity and rank_score values are `double precision`.
CREATE OR REPLACE FUNCTION hybrid_search_companies (
  query_text TEXT,
  query_embedding vector (1536),
  match_threshold FLOAT DEFAULT 0.78,
  match_count INT DEFAULT 50
) RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  tags TEXT[],
  backing_vcs TEXT[],
  stage TEXT,
  founders TEXT[],
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity DOUBLE PRECISION,
  rank_score DOUBLE PRECISION
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH keyword_search AS (
    SELECT
      c.id,
      c.name,
      c.description,
      c.tags,
      c.backing_vcs,
      c.stage,
      c.founders,
      c.website,
      c.logo_url,
      c.created_at,
      c.updated_at,
      0.0::double precision as similarity,
      ROW_NUMBER() OVER (ORDER BY
        CASE WHEN c.name ILIKE '%' || query_text || '%' THEN 1 ELSE 2 END,
        c.name
      ) as rank
    FROM companies c
    WHERE
      c.name ILIKE '%' || query_text || '%' OR
      query_text ILIKE ANY(c.tags) OR
      query_text ILIKE ANY(c.backing_vcs) OR
      c.stage ILIKE '%' || query_text || '%' OR
      query_text = ANY(c.founders)
    LIMIT match_count
  ),
  semantic_search AS (
    SELECT
      c.id,
      c.name,
      c.description,
      c.tags,
      c.backing_vcs,
      c.stage,
      c.founders,
      c.website,
      c.logo_url,
      c.created_at,
      c.updated_at,
      (1 - (c.embedding <=> query_embedding))::double precision as similarity,
      ROW_NUMBER() OVER (ORDER BY c.embedding <=> query_embedding) as rank
    FROM companies c
    WHERE
      c.embedding IS NOT NULL AND
      (1 - (c.embedding <=> query_embedding))::double precision > match_threshold
    LIMIT match_count
  ),
  combined_results AS (
    SELECT
      COALESCE(k.id, s.id) as id,
      COALESCE(k.name, s.name) as name,
      COALESCE(k.description, s.description) as description,
      COALESCE(k.tags, s.tags) as tags,
      COALESCE(k.backing_vcs, s.backing_vcs) as backing_vcs,
      COALESCE(k.stage, s.stage) as stage,
      COALESCE(k.founders, s.founders) as founders,
      COALESCE(k.website, s.website) as website,
      COALESCE(k.logo_url, s.logo_url) as logo_url,
      COALESCE(k.created_at, s.created_at) as created_at,
      COALESCE(k.updated_at, s.updated_at) as updated_at,
      COALESCE(s.similarity, 0.0)::double precision as similarity,
      -- RRF score calculation: 1/(rank + 60) for each search method
      (COALESCE(1.0 / (k.rank + 60), 0.0) + COALESCE(1.0 / (s.rank + 60), 0.0))::double precision as rank_score
    FROM keyword_search k
    FULL OUTER JOIN semantic_search s ON k.id = s.id
  )
  SELECT
    cr.id,
    cr.name,
    cr.description,
    cr.tags,
    cr.backing_vcs,
    cr.stage,
    cr.founders,
    cr.website,
    cr.logo_url,
    cr.created_at,
    cr.updated_at,
    cr.similarity,
    cr.rank_score
  FROM combined_results cr
  ORDER BY cr.rank_score DESC, cr.similarity DESC
  LIMIT match_count;
END;
$$;
