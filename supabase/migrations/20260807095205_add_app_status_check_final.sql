ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('draft','submitted','col','uol','deposited','cas','visa','enrolled','lost'));