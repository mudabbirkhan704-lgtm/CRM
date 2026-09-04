-- Migrate existing no_response leads: set status to 'contacted' and add 'No Response' label
UPDATE leads
  SET status = 'contacted',
      labels = ARRAY(
        SELECT DISTINCT unnest(
          CASE
            WHEN labels IS NULL OR array_length(labels, 1) IS NULL
              THEN ARRAY['No Response']::text[]
            ELSE labels || ARRAY['No Response']::text[]
          END
        )
      )
  WHERE status = 'no_response';

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new_lead','contacted','interested','not_interested','follow_up','appointment_scheduled','document_collection','option_shared','converted','lost','duplicate'));
