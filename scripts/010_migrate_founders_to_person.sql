-- Migration: Migrate companies.founders -> person + person__company
-- Safe to run multiple times: checks for existing links/person.
BEGIN;

-- For each company that has a non-empty founders array, create person and links.
-- This migration assumes `first_name` and `last_name` can be split by the first space.
WITH
  companies_with_founders AS (
    SELECT
      id,
      founders
    FROM
      companies
    WHERE
      founders IS NOT NULL
      AND array_length(founders, 1) > 0
  )
  -- Expand founders into rows
,
  expanded AS (
    SELECT
      c.id AS company_id,
      trim(f) AS full_name
    FROM
      companies_with_founders c,
      unnest(c.founders) AS f
  ),
  parsed AS (
    SELECT
      company_id,
      full_name,
      split_part(full_name, ' ', 1) AS first_name,
      -- everything after the first space as last_name (may be empty)
      regexp_replace(full_name, '^\\S+\\s*', '') AS last_name
    FROM
      expanded
  )
  -- Insert person when not exists, returning person id
,
  inserted_person AS (
    INSERT INTO
      person (first_name, last_name, created_at, updated_at)
    SELECT DISTINCT
      p.first_name,
      p.last_name,
      now(),
      now()
    FROM
      parsed p
    WHERE
      NOT EXISTS (
        SELECT
          1
        FROM
          person pe
        WHERE
          pe.first_name = p.first_name
          AND pe.last_name = p.last_name
      )
    RETURNING
      id,
      first_name,
      last_name
  )
  -- Now upsert links into person__company for all parsed rows
INSERT INTO
  person__company (
    company_id,
    person_id,
    is_founder,
    currently_works_here,
    role,
    created_at,
    updated_at
  )
SELECT
  p.company_id,
  coalesce(pe.id, ip.id) AS person_id,
  true AS is_founder,
  true AS currently_works_here,
  ''::text AS role,
  now() AS created_at,
  now() AS updated_at
FROM
  parsed p
  LEFT JOIN person pe ON pe.first_name = p.first_name
  AND pe.last_name = p.last_name
  LEFT JOIN inserted_person ip ON ip.first_name = p.first_name
  AND ip.last_name = p.last_name
  -- avoid creating duplicate links
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      person__company pc
    WHERE
      pc.company_id = p.company_id
      AND pc.person_id = coalesce(pe.id, ip.id)
      AND pc.is_founder = true
  );

COMMIT;
