/*
# Add call_status to leads and admission_stage to students

1. New Columns
- `leads.call_status` (text, nullable) — tracks the call outcome: not_called, no_answer, callback, connected, switched_off, wrong_number
- `students.admission_stage` (text, default 'draft') — pipeline stage: draft, submitted, offered, deposited, cas, visa, enrolment, lost
2. Modified Tables
- `leads` — add call_status column
- `students` — add admission_stage column with default 'draft'
3. Notes
- Both columns are nullable / defaulted so existing rows are unaffected.
- No RLS changes needed — existing policies cover the new columns.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'call_status') THEN
    ALTER TABLE leads ADD COLUMN call_status text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'admission_stage') THEN
    ALTER TABLE students ADD COLUMN admission_stage text NOT NULL DEFAULT 'draft';
  END IF;
END $$;

-- Update existing students to 'draft' stage if null
UPDATE students SET admission_stage = 'draft' WHERE admission_stage IS NULL;

-- Backfill call_status for existing leads
UPDATE leads SET call_status = 'not_called' WHERE call_status IS NULL;