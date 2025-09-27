-- Minimal person table (no company relation)
CREATE TABLE IF NOT EXISTS public.person (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  linkedin text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index on first_name + last_name for fast name lookups
CREATE INDEX idx_person_name ON public.person (first_name, last_name);
