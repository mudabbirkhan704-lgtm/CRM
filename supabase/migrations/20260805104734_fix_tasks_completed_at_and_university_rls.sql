/*
# Fix tasks completed_at column + university RLS policies

1. Modified Tables
- `tasks`: add `completed_at` timestamptz column to track when a task was completed
- `universities`: RLS policies for INSERT/UPDATE/DELETE are too restrictive (only super_admin/branch_manager/admission_officer).
  This change widens access to all authenticated roles so counselors and team_leaders can add universities.

2. Security
- `tasks`: existing policies remain (authenticated CRUD)
- `universities`: replace the single `university_manage_admin` FOR ALL policy with 3 separate INSERT/UPDATE/DELETE
  policies scoped to `authenticated` (matching the pattern used on all other tables in this app).
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'completed_at') THEN
    ALTER TABLE tasks ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Replace restrictive university manage policy with permissive authenticated policies
DROP POLICY IF EXISTS "university_manage_admin" ON universities;

DROP POLICY IF EXISTS "university_insert_all" ON universities;
CREATE POLICY "university_insert_all" ON universities FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "university_update_all" ON universities;
CREATE POLICY "university_update_all" ON universities FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "university_delete_all" ON universities;
CREATE POLICY "university_delete_all" ON universities FOR DELETE
  TO authenticated USING (true);