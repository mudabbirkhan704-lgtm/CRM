/*
# Add related_application_id to tasks

1. New Columns
- `tasks.related_application_id` (uuid, nullable) — links a task to a specific application
2. Notes
- Nullable so existing tasks are unaffected.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'related_application_id') THEN
    ALTER TABLE tasks ADD COLUMN related_application_id uuid;
  END IF;
END $$;