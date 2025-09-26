-- Update existing companies with sector information
-- The categories column has been renamed to tags, so we need to add sector data

UPDATE companies SET sector = 'Financial Technology' WHERE name IN ('Stripe', 'Coinbase', 'Plaid', 'Ramp');
UPDATE companies SET sector = 'Artificial Intelligence' WHERE name IN ('OpenAI', 'Databricks', 'Anthropic');
UPDATE companies SET sector = 'Cybersecurity' WHERE name = 'CrowdStrike';
UPDATE companies SET sector = 'Design & Creative' WHERE name IN ('Canva', 'Figma');
UPDATE companies SET sector = 'Productivity & Collaboration' WHERE name IN ('Notion', 'Linear', 'Airtable');
UPDATE companies SET sector = 'Social & Communication' WHERE name = 'Discord';
UPDATE companies SET sector = 'Developer Tools' WHERE name IN ('Vercel', 'Retool');

-- Add some additional sample companies with the new schema structure
INSERT INTO companies (name, description, tags, sector, backing_vcs, stage, founders, website, logo_url) VALUES
('Midjourney', 'AI-powered image generation platform for creating art and designs', ARRAY['AI', 'Creative', 'Art'], 'Artificial Intelligence', ARRAY['Benchmark'], 'Series A', ARRAY['David Holz'], 'https://midjourney.com', '/placeholder.svg?height=40&width=40'),

('Hugging Face', 'Open-source platform for machine learning models and datasets', ARRAY['AI', 'Open Source', 'ML'], 'Artificial Intelligence', ARRAY['Lux Capital', 'Sequoia Capital'], 'Series C', ARRAY['Clément Delangue', 'Julien Chaumond'], 'https://huggingface.co', '/placeholder.svg?height=40&width=40'),

('Neon', 'Serverless Postgres database platform with branching and autoscaling', ARRAY['Database', 'Cloud', 'Serverless'], 'Developer Tools', ARRAY['Menlo Ventures', 'Notable Capital'], 'Series B', ARRAY['Nikita Shamgunov'], 'https://neon.tech', '/placeholder.svg?height=40&width=40'),

('Supabase', 'Open source Firebase alternative with Postgres database', ARRAY['Database', 'Backend', 'Open Source'], 'Developer Tools', ARRAY['Coatue', 'Felicis'], 'Series B', ARRAY['Paul Copplestone', 'Ant Wilson'], 'https://supabase.com', '/placeholder.svg?height=40&width=40'),

('Replicate', 'Platform for running machine learning models in the cloud', ARRAY['AI', 'Cloud', 'ML'], 'Artificial Intelligence', ARRAY['Andreessen Horowitz', 'Sequoia Capital'], 'Series A', ARRAY['Ben Firshman', 'Andreas Jansson'], 'https://replicate.com', '/placeholder.svg?height=40&width=40'),

('Perplexity', 'AI-powered search engine and answer platform', ARRAY['AI', 'Search', 'Information'], 'Artificial Intelligence', ARRAY['NEA', 'Elad Gil'], 'Series B', ARRAY['Aravind Srinivas'], 'https://perplexity.ai', '/placeholder.svg?height=40&width=40');
