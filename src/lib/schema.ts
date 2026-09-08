export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS auth_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  city text,
  country text DEFAULT 'United Kingdom',
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  campus text,
  location text,
  website text,
  application_link text,
  courses jsonb DEFAULT '[]',
  scholarships text,
  cas_deposit numeric,
  tuition_fee numeric,
  application_fee numeric,
  country text DEFAULT 'United Kingdom',
  city text,
  intakes jsonb DEFAULT '[]',
  processing_time text,
  english_requirement text,
  ukvi_rating text,
  partner_status text DEFAULT 'partner' CHECK (partner_status IN ('partner','non_partner','preferred')),
  notes text,
  accepted_tests jsonb DEFAULT '[]',
  ielts_score numeric,
  pte_score numeric,
  toefl_score numeric,
  duolingo_score numeric,
  oxford_score numeric,
  languagecert_score numeric,
  scholarship_min numeric,
  scholarship_max numeric,
  cas_deposit_min numeric,
  cas_deposit_max numeric,
  tuition_fee_min numeric,
  tuition_fee_max numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'counselor' CHECK (role IN ('super_admin','branch_manager','team_leader','counselor','admission_officer','finance_officer','visa_officer','marketing_officer','receptionist','read_only')),
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id text UNIQUE NOT NULL,
  name text NOT NULL,
  father_name text,
  gender text CHECK (gender IN ('male','female','other')),
  nationality text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  lead_source_id uuid REFERENCES lead_sources(id) ON DELETE SET NULL,
  campaign text,
  assigned_counselor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  interested_country text,
  interested_intake text,
  interested_course text,
  interested_level text,
  budget text,
  last_degree text,
  last_degree_score text,
  last_degree_year text,
  notes text,
  follow_up_date date,
  status text NOT NULL DEFAULT 'new_lead' CHECK (status IN ('new_lead','contacted','interested','not_interested','follow_up','appointment_scheduled','document_collection','option_shared','converted','lost','duplicate')),
  call_status text,
  call_count integer NOT NULL DEFAULT 0,
  labels text[] DEFAULT '{}',
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  name text NOT NULL,
  father_name text,
  gender text CHECK (gender IN ('male','female','other')),
  nationality text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  assigned_counselor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  date_of_birth date,
  passport_number text,
  passport_expiry date,
  cnic text,
  gap_explanation text,
  employment_history jsonb DEFAULT '[]',
  travel_history jsonb DEFAULT '[]',
  visa_history jsonb DEFAULT '[]',
  financial_info jsonb DEFAULT '{}',
  sponsor_info jsonb DEFAULT '{}',
  interview_notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','enrolled','lost')),
  admission_stage text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academic_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('ssc','hssc','bachelor','master','phd')),
  institution text,
  percentage numeric,
  cgpa numeric,
  passing_year int,
  transcript_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS english_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  test_type text NOT NULL CHECK (test_type IN ('ielts','pte','languagecert','duolingo','oxford','kaplan','toi')),
  overall numeric,
  listening numeric,
  reading numeric,
  writing numeric,
  speaking numeric,
  expiry_date date,
  certificate_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id text UNIQUE NOT NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  university_id uuid REFERENCES universities(id) ON DELETE SET NULL,
  university_name text,
  course text,
  campus text,
  intake text,
  tuition_fee numeric,
  scholarship text,
  deposit numeric,
  application_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','col','uol','deposited','cas','visa','enrolled','lost')),
  assigned_admission_officer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  remarks text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  application_id uuid,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  version int DEFAULT 1,
  expiry_date date,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  related_student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  related_lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  related_application_id uuid,
  due_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  completed_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('student_payment','university_deposit','refund','commission','expense')),
  amount numeric NOT NULL,
  currency text DEFAULT 'GBP',
  payment_method text,
  payment_date date DEFAULT CURRENT_DATE,
  invoice_number text,
  receipt_number text,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  visa_type text DEFAULT 'Student Visa',
  checklist jsonb DEFAULT '{}',
  financial_verification boolean DEFAULT false,
  tb_test_done boolean DEFAULT false,
  tb_test_date date,
  biometrics_done boolean DEFAULT false,
  biometrics_date date,
  appointment_date date,
  submission_date date,
  decision_date date,
  decision text CHECK (decision IN ('pending','approved','refused')),
  visa_expiry date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text,
  is_read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  follow_up_date date NOT NULL,
  follow_up_time time,
  method text CHECK (method IN ('call','email','whatsapp','visit','meeting')),
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','completed','missed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  application_id uuid,
  activity_type text NOT NULL,
  description text,
  performed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Triggers for updated_at
DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['branches','lead_sources','universities','profiles','leads','students','academic_records','english_tests','applications','documents','tasks','payments','visas','follow_ups'] LOOP
    BEGIN EXECUTE 'DROP TRIGGER IF EXISTS set_updated_at ON ' || t; EXCEPTION WHEN OTHERS THEN NULL; END;
    EXECUTE 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON ' || t || ' FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END LOOP;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_counselor ON leads(assigned_counselor_id);
CREATE INDEX IF NOT EXISTS idx_leads_branch ON leads(branch_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_students_counselor ON students(assigned_counselor_id);
CREATE INDEX IF NOT EXISTS idx_students_branch ON students(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_universities_name ON universities(name);
CREATE INDEX IF NOT EXISTS idx_universities_country ON universities(country);
CREATE INDEX IF NOT EXISTS idx_apps_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_apps_university ON applications(university_id);
CREATE INDEX IF NOT EXISTS idx_docs_student ON documents(student_id);
CREATE INDEX IF NOT EXISTS idx_docs_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_visas_student ON visas(student_id);
CREATE INDEX IF NOT EXISTS idx_visas_status ON visas(decision);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_followup_date ON follow_ups(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_followup_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_activity_lead ON activity_timeline(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_student ON activity_timeline(student_id);
`;
