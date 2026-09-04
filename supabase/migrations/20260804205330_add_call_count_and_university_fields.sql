/*
# Add call count to leads + university English test/scholarship/city fields

1. Modified Tables
- `leads`: add `call_count` integer default 0 to track how many calls have been made
- `universities`: add columns for English test acceptance, scholarship range, CAS deposit range, city, tuition fee range
  - `accepted_tests` jsonb: array of accepted English tests (ielts, pte, toefl, duolingo, oxford, languagecert)
  - `ielts_score` numeric: minimum IELTS score
  - `pte_score` numeric: minimum PTE score
  - `toefl_score` numeric: minimum TOEFL score
  - `duolingo_score` numeric: minimum Duolingo score
  - `oxford_score` numeric: minimum Oxford test score
  - `languagecert_score` numeric: minimum LanguageCert score
  - `scholarship_min` numeric: minimum scholarship percentage
  - `scholarship_max` numeric: maximum scholarship percentage
  - `cas_deposit_min` numeric: minimum CAS deposit
  - `cas_deposit_max` numeric: maximum CAS deposit
  - `city` text: city where the university is located
  - `tuition_fee_min` numeric: minimum tuition fee
  - `tuition_fee_max` numeric: maximum tuition fee

2. Security
- No RLS changes needed (existing policies remain)
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'call_count') THEN
    ALTER TABLE leads ADD COLUMN call_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'accepted_tests') THEN
    ALTER TABLE universities ADD COLUMN accepted_tests jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'ielts_score') THEN
    ALTER TABLE universities ADD COLUMN ielts_score numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'pte_score') THEN
    ALTER TABLE universities ADD COLUMN pte_score numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'toefl_score') THEN
    ALTER TABLE universities ADD COLUMN toefl_score numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'duolingo_score') THEN
    ALTER TABLE universities ADD COLUMN duolingo_score numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'oxford_score') THEN
    ALTER TABLE universities ADD COLUMN oxford_score numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'languagecert_score') THEN
    ALTER TABLE universities ADD COLUMN languagecert_score numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'scholarship_min') THEN
    ALTER TABLE universities ADD COLUMN scholarship_min numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'scholarship_max') THEN
    ALTER TABLE universities ADD COLUMN scholarship_max numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'cas_deposit_min') THEN
    ALTER TABLE universities ADD COLUMN cas_deposit_min numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'cas_deposit_max') THEN
    ALTER TABLE universities ADD COLUMN cas_deposit_max numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'city') THEN
    ALTER TABLE universities ADD COLUMN city text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'tuition_fee_min') THEN
    ALTER TABLE universities ADD COLUMN tuition_fee_min numeric;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'universities' AND column_name = 'tuition_fee_max') THEN
    ALTER TABLE universities ADD COLUMN tuition_fee_max numeric;
  END IF;
END $$;