/*
# Educational Consultancy CRM - Core Schema

Creates the foundational database schema for a multi-branch educational consultancy CRM.

## Tables
1. branches - Office/branch locations
2. profiles - Extends auth.users with role and branch assignment
3. lead_sources - Configurable lead sources
4. leads - Prospective student leads with stage tracking
5. students - Mature students (converted from leads)
6. academic_records - SSC, HSSC, Bachelor, Master, PhD records
7. english_tests - IELTS, PTE, Duolingo etc with sub-scores
8. universities - UK university database
9. applications - Student applications to universities
10. documents - Student documents with version tracking
11. tasks - Task assignments
12. payments - Student payments, deposits, commissions
13. visas - Visa processing records
14. notifications - In-app notification center
15. audit_logs - Audit trail
16. follow_ups - Follow-up scheduling
17. activity_timeline - Activity log per lead/student

## Security
- RLS enabled on all tables
- Policies scoped to authenticated users
- All tables first, then policies (to avoid forward reference issues)
*/

-- ============================================
-- TABLE CREATION (all tables first)
-- ============================================

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

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'counselor' CHECK (role IN ('super_admin','branch_manager','team_leader','counselor','admission_officer','finance_officer','visa_officer','marketing_officer','receptionist','read_only')),
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
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
  notes text,
  follow_up_date date,
  status text NOT NULL DEFAULT 'new_lead' CHECK (status IN ('new_lead','contacted','no_response','interested','not_interested','follow_up','appointment_scheduled','document_collection','option_shared','converted','lost','duplicate')),
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
  employment_history jsonb DEFAULT '[]'::jsonb,
  travel_history jsonb DEFAULT '[]'::jsonb,
  visa_history jsonb DEFAULT '[]'::jsonb,
  financial_info jsonb DEFAULT '{}'::jsonb,
  sponsor_info jsonb DEFAULT '{}'::jsonb,
  interview_notes text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','enrolled','lost')),
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

CREATE TABLE IF NOT EXISTS universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  campus text,
  location text,
  website text,
  application_link text,
  courses jsonb DEFAULT '[]'::jsonb,
  scholarships text,
  cas_deposit numeric,
  tuition_fee numeric,
  application_fee numeric,
  country text DEFAULT 'United Kingdom',
  intakes jsonb DEFAULT '[]'::jsonb,
  processing_time text,
  english_requirement text,
  ukvi_rating text,
  partner_status text DEFAULT 'partner' CHECK (partner_status IN ('partner','non_partner','preferred')),
  notes text,
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
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','application_submitted','conditional_offer','unconditional_offer','deposit_paid','cas_requested','cas_received','visa_submitted','visa_approved','visa_refused','student_enrolled','cancelled')),
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
  due_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
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
  checklist jsonb DEFAULT '{}'::jsonb,
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
  activity_type text NOT NULL,
  description text,
  performed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
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

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE english_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_timeline ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES (all tables exist now)
-- ============================================

-- branches
DROP POLICY IF EXISTS "branch_select_all" ON branches;
CREATE POLICY "branch_select_all" ON branches FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "branch_insert_admin" ON branches;
CREATE POLICY "branch_insert_admin" ON branches FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'branch_manager')));
DROP POLICY IF EXISTS "branch_update_admin" ON branches;
CREATE POLICY "branch_update_admin" ON branches FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'branch_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'branch_manager')));
DROP POLICY IF EXISTS "branch_delete_admin" ON branches;
CREATE POLICY "branch_delete_admin" ON branches FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'));

-- profiles
DROP POLICY IF EXISTS "profile_select_all" ON profiles;
CREATE POLICY "profile_select_all" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "profile_insert_self" ON profiles;
CREATE POLICY "profile_insert_self" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profile_update_self_or_admin" ON profiles;
CREATE POLICY "profile_update_self_or_admin" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'branch_manager')))
  WITH CHECK (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'branch_manager')));
DROP POLICY IF EXISTS "profile_delete_admin" ON profiles;
CREATE POLICY "profile_delete_admin" ON profiles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

-- lead_sources
DROP POLICY IF EXISTS "lead_source_select_all" ON lead_sources;
CREATE POLICY "lead_source_select_all" ON lead_sources FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "lead_source_manage_admin" ON lead_sources;
CREATE POLICY "lead_source_manage_admin" ON lead_sources FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'branch_manager', 'marketing_officer')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'branch_manager', 'marketing_officer')));

-- leads
DROP POLICY IF EXISTS "lead_select_all" ON leads;
CREATE POLICY "lead_select_all" ON leads FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "lead_insert_all" ON leads;
CREATE POLICY "lead_insert_all" ON leads FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "lead_update_all" ON leads;
CREATE POLICY "lead_update_all" ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "lead_delete_all" ON leads;
CREATE POLICY "lead_delete_all" ON leads FOR DELETE TO authenticated USING (true);

-- students
DROP POLICY IF EXISTS "student_select_all" ON students;
CREATE POLICY "student_select_all" ON students FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "student_insert_all" ON students;
CREATE POLICY "student_insert_all" ON students FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "student_update_all" ON students;
CREATE POLICY "student_update_all" ON students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "student_delete_all" ON students;
CREATE POLICY "student_delete_all" ON students FOR DELETE TO authenticated USING (true);

-- academic_records
DROP POLICY IF EXISTS "academic_select_all" ON academic_records;
CREATE POLICY "academic_select_all" ON academic_records FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "academic_insert_all" ON academic_records;
CREATE POLICY "academic_insert_all" ON academic_records FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "academic_update_all" ON academic_records;
CREATE POLICY "academic_update_all" ON academic_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "academic_delete_all" ON academic_records;
CREATE POLICY "academic_delete_all" ON academic_records FOR DELETE TO authenticated USING (true);

-- english_tests
DROP POLICY IF EXISTS "english_select_all" ON english_tests;
CREATE POLICY "english_select_all" ON english_tests FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "english_insert_all" ON english_tests;
CREATE POLICY "english_insert_all" ON english_tests FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "english_update_all" ON english_tests;
CREATE POLICY "english_update_all" ON english_tests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "english_delete_all" ON english_tests;
CREATE POLICY "english_delete_all" ON english_tests FOR DELETE TO authenticated USING (true);

-- universities
DROP POLICY IF EXISTS "university_select_all" ON universities;
CREATE POLICY "university_select_all" ON universities FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "university_manage_admin" ON universities;
CREATE POLICY "university_manage_admin" ON universities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','branch_manager','admission_officer')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','branch_manager','admission_officer')));

-- applications
DROP POLICY IF EXISTS "app_select_all" ON applications;
CREATE POLICY "app_select_all" ON applications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "app_insert_all" ON applications;
CREATE POLICY "app_insert_all" ON applications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "app_update_all" ON applications;
CREATE POLICY "app_update_all" ON applications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "app_delete_all" ON applications;
CREATE POLICY "app_delete_all" ON applications FOR DELETE TO authenticated USING (true);

-- documents
DROP POLICY IF EXISTS "doc_select_all" ON documents;
CREATE POLICY "doc_select_all" ON documents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "doc_insert_all" ON documents;
CREATE POLICY "doc_insert_all" ON documents FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "doc_update_all" ON documents;
CREATE POLICY "doc_update_all" ON documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "doc_delete_all" ON documents;
CREATE POLICY "doc_delete_all" ON documents FOR DELETE TO authenticated USING (true);

-- tasks
DROP POLICY IF EXISTS "task_select_all" ON tasks;
CREATE POLICY "task_select_all" ON tasks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "task_insert_all" ON tasks;
CREATE POLICY "task_insert_all" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "task_update_all" ON tasks;
CREATE POLICY "task_update_all" ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "task_delete_all" ON tasks;
CREATE POLICY "task_delete_all" ON tasks FOR DELETE TO authenticated USING (true);

-- payments
DROP POLICY IF EXISTS "payment_select_all" ON payments;
CREATE POLICY "payment_select_all" ON payments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "payment_insert_all" ON payments;
CREATE POLICY "payment_insert_all" ON payments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "payment_update_all" ON payments;
CREATE POLICY "payment_update_all" ON payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "payment_delete_all" ON payments;
CREATE POLICY "payment_delete_all" ON payments FOR DELETE TO authenticated USING (true);

-- visas
DROP POLICY IF EXISTS "visa_select_all" ON visas;
CREATE POLICY "visa_select_all" ON visas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "visa_insert_all" ON visas;
CREATE POLICY "visa_insert_all" ON visas FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "visa_update_all" ON visas;
CREATE POLICY "visa_update_all" ON visas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "visa_delete_all" ON visas;
CREATE POLICY "visa_delete_all" ON visas FOR DELETE TO authenticated USING (true);

-- notifications
DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "notif_insert_all" ON notifications;
CREATE POLICY "notif_insert_all" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_delete_own" ON notifications;
CREATE POLICY "notif_delete_own" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- audit_logs
DROP POLICY IF EXISTS "audit_select_admin" ON audit_logs;
CREATE POLICY "audit_select_admin" ON audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin','branch_manager')));
DROP POLICY IF EXISTS "audit_insert_all" ON audit_logs;
CREATE POLICY "audit_insert_all" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- follow_ups
DROP POLICY IF EXISTS "followup_select_all" ON follow_ups;
CREATE POLICY "followup_select_all" ON follow_ups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "followup_insert_all" ON follow_ups;
CREATE POLICY "followup_insert_all" ON follow_ups FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "followup_update_all" ON follow_ups;
CREATE POLICY "followup_update_all" ON follow_ups FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "followup_delete_all" ON follow_ups;
CREATE POLICY "followup_delete_all" ON follow_ups FOR DELETE TO authenticated USING (true);

-- activity_timeline
DROP POLICY IF EXISTS "activity_select_all" ON activity_timeline;
CREATE POLICY "activity_select_all" ON activity_timeline FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "activity_insert_all" ON activity_timeline;
CREATE POLICY "activity_insert_all" ON activity_timeline FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['branches','profiles','lead_sources','leads','students','academic_records','english_tests','universities','applications','documents','tasks','payments','visas','notifications','follow_ups'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', tbl);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', tbl);
  END LOOP;
END $$;

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO lead_sources (name) VALUES
  ('Manual Entry'), ('Excel Upload'), ('CSV Upload'), ('Website Form'),
  ('Facebook Lead'), ('Google Lead'), ('WhatsApp'), ('API'),
  ('Walk-in'), ('Referral')
ON CONFLICT (name) DO NOTHING;

INSERT INTO branches (name, code, city, country)
VALUES ('Main Branch', 'MAIN', 'London', 'United Kingdom')
ON CONFLICT (code) DO NOTHING;