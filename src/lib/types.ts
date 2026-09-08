export type UserRole =
  | 'super_admin'
  | 'branch_manager'
  | 'team_leader'
  | 'counselor'
  | 'admission_officer'
  | 'finance_officer'
  | 'visa_officer'
  | 'marketing_officer'
  | 'receptionist'
  | 'read_only';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  branch_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

export interface LeadSource {
  id: string;
  name: string;
  is_active: boolean;
}

export type LeadStatus =
  | 'new_lead'
  | 'contacted'
  | 'no_response'
  | 'interested'
  | 'not_interested'
  | 'follow_up'
  | 'appointment_scheduled'
  | 'document_collection'
  | 'option_shared'
  | 'converted'
  | 'lost'
  | 'duplicate';

export type CallStatus =
  | 'not_called'
  | 'no_answer'
  | 'callback'
  | 'connected'
  | 'switched_off'
  | 'wrong_number';

export interface Lead {
  id: string;
  lead_id: string;
  name: string;
  father_name: string | null;
  gender: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  lead_source_id: string | null;
  campaign: string | null;
  assigned_counselor_id: string | null;
  interested_country: string | null;
  interested_intake: string | null;
  interested_course: string | null;
  interested_level: string | null;
  budget: string | null;
  last_degree: string | null;
  last_degree_score: string | null;
  last_degree_year: string | null;
  notes: string | null;
  follow_up_date: string | null;
  status: LeadStatus;
  call_status: CallStatus | null;
  call_count: number;
  labels: string[] | null;
  branch_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  lead_id: string | null;
  name: string;
  father_name: string | null;
  gender: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  assigned_counselor_id: string | null;
  branch_id: string | null;
  date_of_birth: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  cnic: string | null;
  gap_explanation: string | null;
  employment_history: any[];
  travel_history: any[];
  visa_history: any[];
  financial_info: Record<string, any>;
  sponsor_info: Record<string, any>;
  interview_notes: string | null;
  status: string;
  admission_stage: AdmissionStage;
  created_at: string;
  updated_at: string;
}

export type AdmissionStage =
  | 'draft'
  | 'submitted'
  | 'offered'
  | 'deposited'
  | 'cas'
  | 'visa'
  | 'enrolment'
  | 'lost';

export interface AcademicRecord {
  id: string;
  student_id: string;
  level: string;
  institution: string | null;
  percentage: number | null;
  cgpa: number | null;
  passing_year: number | null;
  transcript_url: string | null;
}

export interface EnglishTest {
  id: string;
  student_id: string;
  test_type: string;
  overall: number | null;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  expiry_date: string | null;
  certificate_url: string | null;
}

export interface University {
  id: string;
  name: string;
  campus: string | null;
  location: string | null;
  website: string | null;
  application_link: string | null;
  courses: string[];
  scholarships: string | null;
  cas_deposit: number | null;
  tuition_fee: number | null;
  application_fee: number | null;
  country: string;
  city: string | null;
  intakes: string[];
  processing_time: string | null;
  english_requirement: string | null;
  ukvi_rating: string | null;
  partner_status: string;
  notes: string | null;
  accepted_tests: string[];
  ielts_score: number | null;
  pte_score: number | null;
  toefl_score: number | null;
  duolingo_score: number | null;
  oxford_score: number | null;
  languagecert_score: number | null;
  scholarship_min: number | null;
  scholarship_max: number | null;
  cas_deposit_min: number | null;
  cas_deposit_max: number | null;
  tuition_fee_min: number | null;
  tuition_fee_max: number | null;
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'col'
  | 'uol'
  | 'deposited'
  | 'cas'
  | 'visa'
  | 'enrolled'
  | 'lost';

export interface Application {
  id: string;
  application_id: string;
  student_id: string;
  university_id: string | null;
  university_name: string | null;
  course: string | null;
  campus: string | null;
  intake: string | null;
  tuition_fee: number | null;
  scholarship: string | null;
  deposit: number | null;
  application_date: string;
  status: ApplicationStatus;
  assigned_admission_officer_id: string | null;
  priority: string;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  student_id: string | null;
  application_id: string | null;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  version: number;
  expiry_date: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  related_student_id: string | null;
  related_lead_id: string | null;
  related_application_id: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Payment {
  id: string;
  student_id: string;
  application_id: string | null;
  payment_type: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_date: string;
  invoice_number: string | null;
  receipt_number: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

export interface Visa {
  id: string;
  student_id: string;
  application_id: string | null;
  visa_type: string;
  checklist: Record<string, boolean>;
  financial_verification: boolean;
  tb_test_done: boolean;
  tb_test_date: string | null;
  biometrics_done: boolean;
  biometrics_date: string | null;
  appointment_date: string | null;
  submission_date: string | null;
  decision_date: string | null;
  decision: string | null;
  visa_expiry: string | null;
  notes: string | null;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string | null;
  student_id: string | null;
  assigned_to: string | null;
  follow_up_date: string;
  follow_up_time: string | null;
  method: string | null;
  notes: string | null;
  status: string;
}

export interface ActivityItem {
  id: string;
  lead_id: string | null;
  student_id: string | null;
  application_id: string | null;
  activity_type: string;
  description: string | null;
  performed_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Note {
  id: string;
  lead_id: string | null;
  student_id: string | null;
  application_id: string | null;
  content: string;
  author_id: string | null;
  created_at: string;
}
