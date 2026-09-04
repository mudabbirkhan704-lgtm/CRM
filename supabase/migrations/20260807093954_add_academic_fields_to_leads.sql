/*
# Add academic fields to leads table

1. Modified Tables
- `leads`: add `last_degree` (text), `last_degree_score` (text), `last_degree_year` (text) columns
  to capture the applicant's last degree, CGPA/Percentage, and year of degree during lead creation.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_degree') THEN
    ALTER TABLE leads ADD COLUMN last_degree text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_degree_score') THEN
    ALTER TABLE leads ADD COLUMN last_degree_score text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_degree_year') THEN
    ALTER TABLE leads ADD COLUMN last_degree_year text;
  END IF;
END $$;