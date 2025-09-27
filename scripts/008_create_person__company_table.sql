-- Create many-to-many join table between people and companies
CREATE TABLE public.person__company (
  person_id uuid NOT NULL,
  company_id uuid NOT NULL,
  role varchar(50) NOT NULL,
  currently_works_here boolean DEFAULT NULL,
  is_founder boolean DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT person_company_pk PRIMARY KEY (person_id, company_id)
);

-- Foreign key constraints
ALTER TABLE public.person__company
ADD CONSTRAINT person_company_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people (id) ON DELETE CASCADE;

ALTER TABLE public.person__company
ADD CONSTRAINT person_company_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies (id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_person_company_person_id ON public.person__company (person_id);

CREATE INDEX IF NOT EXISTS idx_person_company_company_id ON public.person__company (company_id);

-- Ensure uniqueness to prevent duplicate person-company links (primary key already enforces this)
CREATE UNIQUE INDEX IF NOT EXISTS idx_person_company_unique_pair ON public.person__company (person_id, company_id);
