-- Seed companies table with sample startup data
INSERT INTO companies (name, description, categories, backing_vcs, stage, founders, website, logo_url) VALUES
('Stripe', 'Online payment processing platform for internet businesses', ARRAY['Fintech', 'Payments'], ARRAY['Sequoia Capital', 'Andreessen Horowitz'], 'Series H', ARRAY['Patrick Collison', 'John Collison'], 'https://stripe.com', '/placeholder.svg?height=40&width=40'),

('OpenAI', 'AI research and deployment company focused on artificial general intelligence', ARRAY['AI', 'Machine Learning'], ARRAY['Microsoft', 'Khosla Ventures'], 'Series C', ARRAY['Sam Altman', 'Greg Brockman'], 'https://openai.com', '/placeholder.svg?height=40&width=40'),

('Coinbase', 'Cryptocurrency exchange and digital wallet platform', ARRAY['Fintech', 'Crypto'], ARRAY['Andreessen Horowitz', 'Union Square Ventures'], 'Public', ARRAY['Brian Armstrong', 'Fred Ehrsam'], 'https://coinbase.com', '/placeholder.svg?height=40&width=40'),

('CrowdStrike', 'Cloud-delivered cybersecurity platform', ARRAY['Cyber', 'Security'], ARRAY['Accel', 'CapitalG'], 'Public', ARRAY['George Kurtz', 'Dmitri Alperovitch'], 'https://crowdstrike.com', '/placeholder.svg?height=40&width=40'),

('Databricks', 'Unified analytics platform for big data and machine learning', ARRAY['AI', 'Data'], ARRAY['Andreessen Horowitz', 'NEA'], 'Series I', ARRAY['Ali Ghodsi', 'Matei Zaharia'], 'https://databricks.com', '/placeholder.svg?height=40&width=40'),

('Plaid', 'Financial services API platform connecting apps to bank accounts', ARRAY['Fintech', 'API'], ARRAY['NEA', 'Spark Capital'], 'Series D', ARRAY['Zach Perret', 'William Hockey'], 'https://plaid.com', '/placeholder.svg?height=40&width=40'),

('Canva', 'Online graphic design platform with drag-and-drop interface', ARRAY['Design', 'SaaS'], ARRAY['Blackbird Ventures', 'Matrix Partners'], 'Series F', ARRAY['Melanie Perkins', 'Cliff Obrecht'], 'https://canva.com', '/placeholder.svg?height=40&width=40'),

('Notion', 'All-in-one workspace for notes, tasks, wikis, and databases', ARRAY['Productivity', 'SaaS'], ARRAY['Index Ventures', 'Sequoia Capital'], 'Series C', ARRAY['Ivan Zhao', 'Simon Last'], 'https://notion.so', '/placeholder.svg?height=40&width=40'),

('Discord', 'Voice, video and text communication service for communities', ARRAY['Social', 'Gaming'], ARRAY['Greylock Partners', 'Spark Capital'], 'Series H', ARRAY['Jason Citron', 'Stan Vishnevskiy'], 'https://discord.com', '/placeholder.svg?height=40&width=40'),

('Figma', 'Collaborative web-based design and prototyping tool', ARRAY['Design', 'SaaS'], ARRAY['Greylock Partners', 'Kleiner Perkins'], 'Acquired', ARRAY['Dylan Field', 'Evan Wallace'], 'https://figma.com', '/placeholder.svg?height=40&width=40'),

('Anthropic', 'AI safety company focused on developing safe, beneficial AI systems', ARRAY['AI', 'Safety'], ARRAY['Google', 'Spark Capital'], 'Series C', ARRAY['Dario Amodei', 'Daniela Amodei'], 'https://anthropic.com', '/placeholder.svg?height=40&width=40'),

('Vercel', 'Frontend cloud platform for static sites and serverless functions', ARRAY['Developer Tools', 'Cloud'], ARRAY['Accel', 'CRV'], 'Series C', ARRAY['Guillermo Rauch'], 'https://vercel.com', '/placeholder.svg?height=40&width=40'),

('Linear', 'Issue tracking and project management tool for software teams', ARRAY['Productivity', 'Developer Tools'], ARRAY['Sequoia Capital', 'Accel'], 'Series B', ARRAY['Karri Saarinen', 'Tuomas Artman'], 'https://linear.app', '/placeholder.svg?height=40&width=40'),

('Retool', 'Low-code platform for building internal business applications', ARRAY['Developer Tools', 'No-Code'], ARRAY['Sequoia Capital', 'Thrive Capital'], 'Series C', ARRAY['David Hsu'], 'https://retool.com', '/placeholder.svg?height=40&width=40'),

('Airtable', 'Cloud collaboration service with spreadsheet-database hybrid', ARRAY['Productivity', 'Database'], ARRAY['Thrive Capital', 'CRV'], 'Series F', ARRAY['Howie Liu', 'Andrew Ofstad'], 'https://airtable.com', '/placeholder.svg?height=40&width=40'),

('Ramp', 'Corporate credit card and expense management platform', ARRAY['Fintech', 'Expense Management'], ARRAY['Founders Fund', 'Stripe'], 'Series D', ARRAY['Eric Glyman', 'Karim Atiyeh'], 'https://ramp.com', '/placeholder.svg?height=40&width=40');
