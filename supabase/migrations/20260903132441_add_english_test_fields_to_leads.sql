/*
# Add English Test fields to leads table

1. New Columns
- `english_test_type` (text, nullable) — the type of English proficiency test (e.g. IELTS, PTE, TOEFL, Duolingo)
- `english_test_score` (text, nullable) — the overall score/grade achieved
- `english_test_date` (text, nullable) — the date the test was taken

2. Modified Tables
- `leads` — adds three new optional columns to store English test information alongside existing academic fields

3. Security
- No RLS policy changes needed; existing policies on `leads` already cover these new columns

4. Notes
- These columns are nullable so existing leads are unaffected
- Values are stored as text to accommodate various score formats (e.g. "7.5", "85", "B2")
*/

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS english_test_type text,
  ADD COLUMN IF NOT EXISTS english_test_score text,
  ADD COLUMN IF NOT EXISTS english_test_date text;