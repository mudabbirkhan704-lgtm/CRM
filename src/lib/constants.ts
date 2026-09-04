import type { LeadStatus, ApplicationStatus, UserRole, CallStatus, AdmissionStage } from './types';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  branch_manager: 'Branch Manager',
  team_leader: 'Team Leader',
  counselor: 'Counselor',
  admission_officer: 'Admission Officer',
  finance_officer: 'Finance Officer',
  visa_officer: 'Visa Officer',
  marketing_officer: 'Marketing Officer',
  receptionist: 'Receptionist',
  read_only: 'Read Only',
};

export const ALL_ROLES: UserRole[] = [
  'super_admin',
  'branch_manager',
  'team_leader',
  'counselor',
  'admission_officer',
  'finance_officer',
  'visa_officer',
  'marketing_officer',
  'receptionist',
  'read_only',
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new_lead: 'New Lead',
  contacted: 'Contacted',
  no_response: 'No Response',
  interested: 'Interested',
  not_interested: 'Not Interested',
  follow_up: 'Follow-up',
  appointment_scheduled: 'Appointment Scheduled',
  document_collection: 'Documents Received',
  option_shared: 'Option Shared',
  converted: 'Converted',
  lost: 'Lost',
  duplicate: 'Duplicate',
};

export const LEAD_STATUSES: LeadStatus[] = [
  'new_lead',
  'contacted',
  'not_interested',
  'interested',
  'follow_up',
  'option_shared',
  'document_collection',
  'lost',
  'duplicate',
  'converted',
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  col: 'COL',
  uol: 'UOL',
  deposited: 'Deposited',
  cas: 'CAS',
  visa: 'VISA',
  enrolled: 'Enrolled',
  lost: 'Lost',
};

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'draft',
  'submitted',
  'col',
  'uol',
  'deposited',
  'cas',
  'visa',
  'enrolled',
  'lost',
];

export const APPLICATION_STAGE_PROGRESS: Record<ApplicationStatus, number> = {
  draft: 0,
  submitted: 15,
  col: 30,
  uol: 45,
  deposited: 60,
  cas: 75,
  visa: 90,
  enrolled: 100,
  lost: 0,
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new_lead: 'bg-blue-100 text-blue-700 border-blue-200',
  contacted: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  no_response: 'bg-gray-100 text-gray-600 border-gray-200',
  interested: 'bg-green-100 text-green-700 border-green-200',
  not_interested: 'bg-red-100 text-red-700 border-red-200',
  follow_up: 'bg-amber-100 text-amber-700 border-amber-200',
  appointment_scheduled: 'bg-purple-100 text-purple-700 border-purple-200',
  document_collection: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  option_shared: 'bg-teal-100 text-teal-700 border-teal-200',
  converted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  lost: 'bg-rose-100 text-rose-700 border-rose-200',
  duplicate: 'bg-orange-100 text-orange-700 border-orange-200',
};

export const CALL_STATUSES: CallStatus[] = [
  'not_called', 'no_answer', 'callback', 'connected', 'switched_off', 'wrong_number',
];

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  not_called: 'Not Called',
  no_answer: 'No Answer',
  callback: 'Callback',
  connected: 'Connected',
  switched_off: 'Switched Off',
  wrong_number: 'Wrong Number',
};

export const CALL_STATUS_COLORS: Record<CallStatus, string> = {
  not_called: 'bg-gray-100 text-gray-600 border-gray-200',
  no_answer: 'bg-orange-100 text-orange-700 border-orange-200',
  callback: 'bg-amber-100 text-amber-700 border-amber-200',
  connected: 'bg-green-100 text-green-700 border-green-200',
  switched_off: 'bg-red-100 text-red-700 border-red-200',
  wrong_number: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const ADMISSION_STAGES: AdmissionStage[] = [
  'draft', 'submitted', 'offered', 'deposited', 'cas', 'visa', 'enrolment', 'lost',
];

export const ADMISSION_STAGE_LABELS: Record<AdmissionStage, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  offered: 'Offered',
  deposited: 'Deposited',
  cas: 'CAS',
  visa: 'VISA',
  enrolment: 'Enrolment',
  lost: 'Lost',
};

export const ADMISSION_STAGE_COLORS: Record<AdmissionStage, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  offered: 'bg-teal-100 text-teal-700 border-teal-200',
  deposited: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  cas: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  visa: 'bg-purple-100 text-purple-700 border-purple-200',
  enrolment: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  lost: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const APP_STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  col: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  uol: 'bg-teal-100 text-teal-700 border-teal-200',
  deposited: 'bg-amber-100 text-amber-700 border-amber-200',
  cas: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  visa: 'bg-purple-100 text-purple-700 border-purple-200',
  enrolled: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  lost: 'bg-red-100 text-red-700 border-red-200',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

export const DOCUMENT_TYPES = [
  'Passport',
  'CNIC',
  'SSC',
  'HSSC',
  'Bachelor',
  'Master',
  'Transcript',
  'Degree',
  'IELTS',
  'PTE',
  'TB Certificate',
  'Financial Documents',
  'Bank Statement',
  'Affidavit',
  'Sponsor Letter',
  'Experience Letter',
  'CV',
  'SOP',
  'Recommendation Letter',
  'Visa Decision',
  'Offer Letter',
  'CAS',
];

export const ENGLISH_TEST_TYPES = [
  { value: 'ielts', label: 'IELTS' },
  { value: 'pte', label: 'PTE' },
  { value: 'languagecert', label: 'LanguageCert' },
  { value: 'duolingo', label: 'Duolingo' },
  { value: 'oxford', label: 'Oxford Test' },
  { value: 'toefl', label: 'TOEFL' },
  { value: 'kaplan', label: 'Kaplan Test' },
  { value: 'toi', label: 'TOI' },
];

export const UNIVERSITY_ENGLISH_TESTS = [
  { value: 'ielts', label: 'IELTS' },
  { value: 'pte', label: 'PTE' },
  { value: 'toefl', label: 'TOEFL' },
  { value: 'duolingo', label: 'Duolingo' },
  { value: 'oxford', label: 'Oxford Test' },
  { value: 'languagecert', label: 'LanguageCert' },
];

export const ACADEMIC_LEVELS = [
  { value: 'ssc', label: 'SSC' },
  { value: 'hssc', label: 'HSSC' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
];

export const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Germany',
  'Ireland', 'New Zealand', 'Netherlands', 'Sweden', 'France',
  'Italy', 'Spain', 'Malaysia', 'Singapore', 'UAE',
  'Pakistan', 'India', 'Bangladesh', 'Sri Lanka', 'Nepal',
  'China', 'Japan', 'South Korea', 'Turkey', 'Saudi Arabia',
  'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Egypt',
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Morocco',
  'Brazil', 'Argentina', 'Mexico', 'Chile', 'Colombia',
  'Russia', 'Ukraine', 'Poland', 'Czech Republic', 'Hungary',
  'Austria', 'Switzerland', 'Belgium', 'Denmark', 'Norway',
  'Finland', 'Iceland', 'Portugal', 'Greece', 'Croatia',
  'Romania', 'Bulgaria', 'Serbia', 'Lithuania', 'Latvia',
  'Estonia', 'Slovakia', 'Slovenia', 'Luxembourg', 'Malta',
  'Cyprus', 'Thailand', 'Vietnam', 'Indonesia', 'Philippines',
  'Taiwan', 'Hong Kong', 'Iran', 'Iraq', 'Jordan',
  'Lebanon', 'Palestine', 'Yemen', 'Sudan', 'Libya',
  'Tunisia', 'Algeria', 'Ethiopia', 'Tanzania', 'Uganda',
  'Zimbabwe', 'Zambia', 'Botswana', 'Namibia', 'Mozambique',
  'Cameroon', 'Senegal', 'Ivory Coast', 'Mali', 'Afghanistan',
];

export const INTAKES = [
  'January 2025', 'May 2025', 'September 2025',
  'January 2026', 'May 2026', 'September 2026',
  'January 2027', 'September 2027',
];

export const STUDY_LEVELS = [
  'Foundation', 'Undergraduate', 'Postgraduate', 'PhD', 'Diploma', 'Certificate',
];

export const LEAD_LABELS = [
  'Low Budget',
  'Other Destination',
  'Future Lead',
  'Mres/Spouse',
  'Fully Funded',
  'IELTS Prep',
  'Irrelevant',
  'No Response',
  'Already Processed',
  'Ineligible',
] as const;

export type LeadLabel = typeof LEAD_LABELS[number];

export const LEAD_LABEL_COLORS: Record<string, string> = {
  'Low Budget': 'bg-amber-100 text-amber-700 border-amber-200',
  'Other Destination': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Future Lead': 'bg-blue-100 text-blue-700 border-blue-200',
  'Mres/Spouse': 'bg-pink-100 text-pink-700 border-pink-200',
  'Fully Funded': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'IELTS Prep': 'bg-violet-100 text-violet-700 border-violet-200',
  'Irrelevant': 'bg-gray-100 text-gray-600 border-gray-200',
  'No Response': 'bg-gray-100 text-gray-600 border-gray-200',
  'Already Processed': 'bg-teal-100 text-teal-700 border-teal-200',
  'Ineligible': 'bg-rose-100 text-rose-700 border-rose-200',
};
