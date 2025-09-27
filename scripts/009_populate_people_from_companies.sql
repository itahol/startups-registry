BEGIN;

-- 0) Optional but recommended: canonical full name on people + uniqueness
-- ALTER TABLE people
--   ADD COLUMN full_name_canon text GENERATED ALWAYS AS (
--     lower(regexp_replace(btrim(concat_ws(' ', first_name, last_name)), '\s+', ' ', 'g'))
--   ) STORED;
-- ALTER TABLE people ADD CONSTRAINT people_full_name_canon_uniq UNIQUE (full_name_canon);
-- 1) Normalize founders once
CREATE TEMP TABLE tmp_founders_normalized AS
SELECT
  c.id AS company_id,
  -- collapse whitespace + trim
  btrim(regexp_replace(fndr, '\s+', ' ', 'g')) AS founder_full,
  -- split into first token + remainder
  regexp_replace(
    btrim(regexp_replace(fndr, '\s+', ' ', 'g')),
    '\s+.*$',
    ''
  ) AS first_name,
  NULLIF(
    regexp_replace(
      btrim(regexp_replace(fndr, '\s+', ' ', 'g')),
      '^[^\s]+\s*',
      ''
    ),
    ''
  ) AS last_name
FROM
  companies c
  CROSS JOIN LATERAL unnest(c.founders) AS f (fndr)
WHERE
  c.founders IS NOT NULL
  AND fndr IS NOT NULL
  AND btrim(fndr) <> '';

-- 2) Insert missing people by canonical full name
INSERT INTO
  people (first_name, last_name, created_at)
SELECT DISTINCT
  t.first_name,
  t.last_name,
  now()
FROM
  tmp_founders_normalized t
  LEFT JOIN people p ON lower(
    regexp_replace(
      btrim(concat_ws(' ', p.first_name, p.last_name)),
      '\s+',
      ' ',
      'g'
    )
  ) = lower(t.founder_full)
WHERE
  p.id IS NULL;

-- If you added the generated unique column above, you can instead do:
-- INSERT INTO people (first_name, last_name, created_at)
-- SELECT DISTINCT t.first_name, t.last_name, now()
-- FROM tmp_founders_normalized t
-- ON CONFLICT (full_name_canon) DO NOTHING;
-- 3) Link people to companies as Founders
INSERT INTO
  person__company (
    person_id,
    company_id,
    role,
    is_founder,
    currently_works_here,
    created_at
  )
SELECT
  p.id,
  t.company_id,
  'Founder',
  true,
  NULL,
  now()
FROM
  tmp_founders_normalized t
  JOIN people p ON lower(
    regexp_replace(
      btrim(concat_ws(' ', p.first_name, p.last_name)),
      '\s+',
      ' ',
      'g'
    )
  ) = lower(t.founder_full)
ON CONFLICT DO NOTHING;

COMMIT;
