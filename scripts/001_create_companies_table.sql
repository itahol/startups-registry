-- Create companies table for startup registry
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  categories TEXT[] DEFAULT '{}',
  backing_vcs TEXT[] DEFAULT '{}',
  stage TEXT,
  founders TEXT[] DEFAULT '{}',
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS companies_name_idx ON companies USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS companies_categories_idx ON companies USING gin(categories);
CREATE INDEX IF NOT EXISTS companies_stage_idx ON companies (stage);

-- Enable RLS (Row Level Security) - for this public registry, we'll allow read access to all
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read companies (public registry)
CREATE POLICY "Allow public read access to companies" ON companies FOR SELECT USING (true);

-- For now, we'll restrict insert/update/delete - can be modified later if needed
CREATE POLICY "Restrict write access to companies" ON companies FOR INSERT WITH CHECK (false);
CREATE POLICY "Restrict update access to companies" ON companies FOR UPDATE USING (false);
CREATE POLICY "Restrict delete access to companies" ON companies FOR DELETE USING (false);
