/*
# Create notes table and add application_id to activity_timeline

1. New Tables
- `notes` — conversation-thread style notes for leads, students, and applications
  - `id` (uuid PK)
  - `lead_id` (uuid, nullable, FK to leads)
  - `student_id` (uuid, nullable, FK to students)
  - `application_id` (uuid, nullable, FK to applications)
  - `content` (text, not null) — the note text
  - `author_id` (uuid, nullable, FK to profiles) — who wrote the note
  - `created_at` (timestamptz, default now())
2. Modified Tables
- `activity_timeline` — add `application_id` (uuid, nullable) so activities can be linked to applications
3. Security
- Enable RLS on `notes`
- Authenticated users can CRUD notes (this app has sign-in)
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_timeline' AND column_name = 'application_id') THEN
    ALTER TABLE activity_timeline ADD COLUMN application_id uuid;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_notes" ON notes;
CREATE POLICY "select_notes" ON notes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_notes" ON notes;
CREATE POLICY "insert_notes" ON notes FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_notes" ON notes;
CREATE POLICY "update_notes" ON notes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_notes" ON notes;
CREATE POLICY "delete_notes" ON notes FOR DELETE
  TO authenticated USING (true);