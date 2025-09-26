-- Add main sector column and rename categories to tags
ALTER TABLE companies
ADD COLUMN sector TEXT;

-- Rename categories column to tags
ALTER TABLE companies
RENAME COLUMN categories TO tags;

-- Update the index name to reflect the new column name
DROP INDEX IF EXISTS companies_categories_idx;

CREATE INDEX IF NOT EXISTS companies_tags_idx ON companies USING gin (tags);

-- Add index for the new sector column
CREATE INDEX IF NOT EXISTS companies_sector_idx ON companies (sector);

-- Update the vector search function to use the new column names
DROP FUNCTION IF EXISTS hybrid_search_companies (
  query_text text,
  query_embedding vector (1536),
  match_threshold float,
  match_count int
);

CREATE OR REPLACE FUNCTION hybrid_search_companies (
  query_embedding vector (1536),
  query_text text,
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20
) RETURNS TABLE (
  id uuid,
  name text,
  description text,
  tags text[],
  backing_vcs text[],
  stage text,
  founders text[],
  website text,
  logo_url text,
  sector text,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float,
  rank_score float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
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
    c.sector,
    c.created_at,
    c.updated_at,
    (1 - (c.embedding <=> query_embedding)) as similarity,
    ts_rank_cd(
      to_tsvector('english',
        coalesce(c.name, '') || ' ' ||
        coalesce(c.description, '') || ' ' ||
        coalesce(c.sector, '') || ' ' ||
        array_to_string(c.tags, ' ') || ' ' ||
        array_to_string(c.backing_vcs, ' ') || ' ' ||
        array_to_string(c.founders, ' ')
      ),
      plainto_tsquery('english', query_text)
    ) as rank_score
  FROM companies c
  WHERE
    (c.embedding <=> query_embedding) < (1 - match_threshold)
    OR to_tsvector('english',
      coalesce(c.name, '') || ' ' ||
      coalesce(c.description, '') || ' ' ||
      coalesce(c.sector, '') || ' ' ||
      array_to_string(c.tags, ' ') || ' ' ||
      array_to_string(c.backing_vcs, ' ') || ' ' ||
      array_to_string(c.founders, ' ')
    ) @@ plainto_tsquery('english', query_text)
  ORDER BY
    (1 - (c.embedding <=> query_embedding)) * 0.6 +
    ts_rank_cd(
      to_tsvector('english',
        coalesce(c.name, '') || ' ' ||
        coalesce(c.description, '') || ' ' ||
        coalesce(c.sector, '') || ' ' ||
        array_to_string(c.tags, ' ') || ' ' ||
        array_to_string(c.backing_vcs, ' ') || ' ' ||
        array_to_string(c.founders, ' ')
      ),
      plainto_tsquery('english', query_text)
    ) * 0.4 DESC
  LIMIT match_count;
END;
$$;
