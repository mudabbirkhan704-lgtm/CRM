/*
# Add application_id to documents

1. New Columns
- `documents.application_id` (uuid, nullable) — links a document to a specific application
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'application_id') THEN
    ALTER TABLE documents ADD COLUMN application_id uuid;
  END IF;
END $$;