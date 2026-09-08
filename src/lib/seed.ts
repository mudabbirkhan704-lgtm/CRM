export const SEED_SQL = `
-- Seed: Branch
INSERT INTO branches (id, name, code, address, city, country)
SELECT '11111111-1111-1111-1111-111111111111', 'Main Branch', 'MAIN', '123 London Road', 'London', 'United Kingdom'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE code = 'MAIN');

-- Seed: Lead Sources
INSERT INTO lead_sources (name) VALUES
  ('Manual Entry'), ('Excel Upload'), ('CSV Upload'), ('Website Form'),
  ('Facebook Lead'), ('Google Lead'), ('WhatsApp'), ('API'),
  ('Walk-in'), ('Referral')
ON CONFLICT (name) DO NOTHING;

-- Seed: Universities
INSERT INTO universities (name, campus, location, website, country, city, partner_status, courses, intakes, cas_deposit, tuition_fee, application_fee, english_requirement, ukvi_rating, ielts_score, pte_score, toefl_score, duolingo_score, scholarship_min, scholarship_max, cas_deposit_min, cas_deposit_max, tuition_fee_min, tuition_fee_max, accepted_tests)
VALUES
  ('University of Exeter', 'Streatham Campus', 'Exeter, England', 'https://www.exeter.ac.uk', 'United Kingdom', 'Exeter', 'preferred',
   '["MSc Computer Science","MSc Data Science","MSc Engineering","MBA"]'::jsonb,
   '["September 2025","January 2026"]'::jsonb,
   2000, 22000, 50, 'IELTS 6.5 overall', 'Highly Trusted',
   6.5, 62, 90, 110, 2000, 5000, 1500, 3000, 18000, 25000,
   '["ielts","pte","toefl","duolingo"]'::jsonb),
  ('University of Dundee', 'Main Campus', 'Dundee, Scotland', 'https://www.dundee.ac.uk', 'United Kingdom', 'Dundee', 'partner',
   '["MSc Data Science","MSc Computer Science","MBA","MSc Marketing"]'::jsonb,
   '["September 2025","January 2026"]'::jsonb,
   1500, 19000, 0, 'IELTS 6.0 overall', 'Highly Trusted',
   6.0, 56, 80, 100, 1000, 3000, 1000, 2000, 16000, 22000,
   '["ielts","pte","toefl"]'::jsonb),
  ('Coventry University', 'Main Campus', 'Coventry, England', 'https://www.coventry.ac.uk', 'United Kingdom', 'Coventry', 'partner',
   '["MSc Computer Science","MSc Mechanical Engineering","MBA"]'::jsonb,
   '["September 2025","January 2026","May 2026"]'::jsonb,
   2000, 17000, 0, 'IELTS 6.0 overall', 'Highly Trusted',
   6.0, 56, 80, 95, 1000, 2500, 1500, 2500, 14000, 20000,
   '["ielts","pte","toefl","duolingo"]'::jsonb),
  ('Ulster University', 'Belfast Campus', 'Belfast, Northern Ireland', 'https://www.ulster.ac.uk', 'United Kingdom', 'Belfast', 'preferred',
   '["MBA","MSc Marketing","MSc Computer Science"]'::jsonb,
   '["September 2025","January 2026"]'::jsonb,
   2000, 16000, 0, 'IELTS 6.0 overall', 'Highly Trusted',
   6.0, 55, 78, 95, 1500, 4000, 1500, 2500, 13000, 18000,
   '["ielts","pte","toefl","duolingo"]'::jsonb),
  ('University of Salford', 'Main Campus', 'Salford, England', 'https://www.salford.ac.uk', 'United Kingdom', 'Salford', 'partner',
   '["MSc Marketing","MSc Computer Science","MBA"]'::jsonb,
   '["September 2025","January 2026"]'::jsonb,
   1500, 17000, 0, 'IELTS 6.0 overall', 'Highly Trusted',
   6.0, 56, 80, 100, 1000, 3000, 1000, 2000, 14000, 20000,
   '["ielts","pte","toefl","duolingo"]'::jsonb),
  ('University of Manchester', 'Main Campus', 'Manchester, England', 'https://www.manchester.ac.uk', 'United Kingdom', 'Manchester', 'preferred',
   '["MSc Engineering","MSc Computer Science","MBA","MSc Data Science"]'::jsonb,
   '["September 2025"]'::jsonb,
   3000, 28000, 60, 'IELTS 7.0 overall', 'Highly Trusted',
   7.0, 68, 100, 120, 3000, 8000, 2500, 4000, 23000, 32000,
   '["ielts","pte","toefl","duolingo"]'::jsonb),
  ('University of Glasgow', 'Main Campus', 'Glasgow, Scotland', 'https://www.gla.ac.uk', 'United Kingdom', 'Glasgow', 'preferred',
   '["MSc Mechanical Engineering","MSc Computer Science","MBA"]'::jsonb,
   '["September 2025","January 2026"]'::jsonb,
   2500, 25000, 50, 'IELTS 6.5 overall', 'Highly Trusted',
   6.5, 62, 90, 110, 2000, 6000, 2000, 3500, 20000, 28000,
   '["ielts","pte","toefl","duolingo"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Seed: Leads (12)
INSERT INTO leads (lead_id, name, father_name, gender, nationality, email, phone, address, city, country, lead_source_id, assigned_counselor_id, interested_country, interested_intake, interested_course, interested_level, budget, notes, follow_up_date, status, call_status, call_count, labels, branch_id, created_at)
SELECT * FROM (VALUES
  ('LD-LEAD001', 'Ahmed Raza', 'Muhammad Raza', 'male', 'Pakistani', 'ahmed.raza@email.com', '+92 300 1234567', 'House 123, Block A', 'Lahore', 'Pakistan', (SELECT id FROM lead_sources WHERE name='Manual Entry'), NULL, 'United Kingdom', 'September 2025', 'MSc Computer Science', 'Postgraduate', '£20,000', 'Interested in UK universities', '2025-09-10', 'new_lead', 'not_called', 0, '{}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-15 10:00:00+00'),
  ('LD-LEAD002', 'Fatima Khan', 'Imran Khan', 'female', 'Pakistani', 'fatima.khan@email.com', '+92 301 2345678', 'House 45, Gulberg', 'Karachi', 'Pakistan', (SELECT id FROM lead_sources WHERE name='Website Form'), NULL, 'United Kingdom', 'January 2026', 'MBA', 'Postgraduate', '£25,000', 'Looking for MBA programs', '2025-09-05', 'contacted', 'connected', 2, '{}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-14 11:30:00+00'),
  ('LD-LEAD003', 'Bilal Ahmed', 'Saeed Ahmed', 'male', 'Pakistani', 'bilal.ahmed@email.com', '+92 302 3456789', 'House 67, F-8', 'Islamabad', 'Pakistan', (SELECT id FROM lead_sources WHERE name='Facebook Lead'), NULL, 'United Kingdom', 'September 2025', 'MSc Data Science', 'Postgraduate', '£22,000', 'Wants data science programs', '2025-09-12', 'interested', 'connected', 1, '{}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-13 09:15:00+00'),
  ('LD-LEAD004', 'Sana Malik', 'Tariq Malik', 'female', 'Pakistani', 'sana.malik@email.com', '+92 303 4567890', 'House 89, DHA', 'Lahore', 'Pakistan', (SELECT id FROM lead_sources WHERE name='Google Lead'), NULL, 'United Kingdom', 'January 2026', 'MSc Marketing', 'Postgraduate', '£18,000', 'Interested in marketing', '2025-09-08', 'follow_up', 'callback', 1, '{}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-12 14:00:00+00'),
  ('LD-LEAD005', 'Hassan Ali', 'Ali Raza', 'male', 'Pakistani', 'hassan.ali@email.com', '+92 304 5678901', 'House 12, Johar Town', 'Lahore', 'Pakistan', (SELECT id FROM lead_sources WHERE name='WhatsApp'), NULL, 'United Kingdom', 'September 2025', 'MSc Engineering', 'Postgraduate', '£25,000', 'Appointment booked', '2025-09-15', 'appointment_scheduled', 'connected', 3, '{}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-11 10:45:00+00'),
  ('LD-LEAD006', 'Ayesha Siddiqui', 'Siddiqui Ahmed', 'female', 'Pakistani', 'ayesha.s@email.com', '+92 305 6789012', 'House 34, Model Town', 'Lahore', 'Pakistan', (SELECT id FROM lead_sources WHERE name='Manual Entry'), NULL, 'United Kingdom', 'January 2026', 'MSc Computer Science', 'Postgraduate', '£20,000', 'New inquiry', '2025-09-20', 'new_lead', 'not_called', 0, '{}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-10 16:20:00+00'),
  ('LD-LEAD007', 'Usman Tariq', 'Tariq Hussain', 'male', 'Pakistani', 'usman.tariq@email.com', '+92 306 7890123', 'House 56, Bahria Town', 'Rawalpindi', 'Pakistan', (SELECT id FROM lead_sources WHERE name='Website Form'), NULL, 'United Kingdom', 'September 2025', 'MBA', 'Postgraduate', '£30,000', 'No response after initial contact', NULL, 'contacted', 'no_answer', 1, '{No Response}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-09 12:00:00+00'),
  ('LD-LEAD008', 'Zainab Hussain', 'Hussain Ali', 'female', 'Pakistani', 'zainab.h@email.com', '+92 307 8901234', 'House 78, Gulraiz', 'Rawalpindi', 'Pakistan', (SELECT id FROM lead_sources WHERE name='Facebook Lead'), NULL, 'United Kingdom', 'January 2026', 'MSc Marketing', 'Postgraduate', '£15,000', 'Not interested in studying abroad', NULL, 'not_interested', 'connected', 1, '{}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-08 09:30:00+00'),
  ('LD-LEAD009', 'Ali Raza', 'Raza Muhammad', 'male', 'Pakistani', 'ali.raza@email.com', '+92 308 9012345', 'House 90, Satellite Town', 'Rawalpindi', 'Pakistan', (SELECT id FROM lead_sources WHERE name='Google Lead'), NULL, 'United Kingdom', 'September 2025', 'MSc Data Science', 'Postgraduate', '£24,000', 'Options shared, awaiting response', '2025-09-18', 'option_shared', 'connected', 2, '{}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-07 11:00:00+00'),
  ('LD-LEAD010', 'Maryam Iqbal', 'Iqbal Hasan', 'female', 'Pakistani', 'maryam.i@email.com', '+92 309 0123456', 'House 11, Cantt', 'Lahore', 'Pakistan', (SELECT id FROM lead_sources WHERE name='Manual Entry'), NULL, 'United Kingdom', 'January 2026', 'MSc Computer Science', 'Postgraduate', '£21,000', 'Documents being collected', '2025-09-25', 'document_collection', 'connected', 2, '{}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-06 13:45:00+00'),
  ('LD-LEAD011', 'Hamza Sheikh', 'Sheikh Abdul', 'male', 'Pakistani', 'hamza.s@email.com', '+92 310 1234567', 'House 22, Wapda Town', 'Lahore', 'Pakistan', (SELECT id FROM lead_sources WHERE name='WhatsApp'), NULL, 'United Kingdom', 'September 2025', 'MSc Engineering', 'Postgraduate', '£23,000', 'New lead from WhatsApp', '2025-09-30', 'new_lead', 'not_called', 0, '{}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-05 10:00:00+00'),
  ('LD-LEAD012', 'Nimra Aslam', 'Aslam Khan', 'female', 'Pakistani', 'nimra.a@email.com', '+92 311 2345678', 'House 33, Garden Town', 'Lahore', 'Pakistan', (SELECT id FROM lead_sources WHERE name='Website Form'), NULL, 'United Kingdom', 'January 2026', 'MBA', 'Postgraduate', '£26,000', 'Contacted, waiting for IELTS result', '2025-09-22', 'contacted', 'connected', 1, '{}'::text[], '11111111-1111-1111-1111-111111111111', '2025-08-04 15:30:00+00')
) AS t(lead_id, name, father_name, gender, nationality, email, phone, address, city, country, lead_source_id, assigned_counselor_id, interested_country, interested_intake, interested_course, interested_level, budget, notes, follow_up_date, status, call_status, call_count, labels, branch_id, created_at)
WHERE NOT EXISTS (SELECT 1 FROM leads LIMIT 1);

-- Seed: Students (3)
INSERT INTO students (student_id, lead_id, name, father_name, gender, nationality, email, phone, address, city, country, assigned_counselor_id, branch_id, date_of_birth, passport_number, passport_expiry, cnic, gap_explanation, interview_notes, status, admission_stage, created_at)
SELECT * FROM (VALUES
  ('STU-STU001', NULL, 'Muhammad Abdullah', 'Abdullah Khan', 'male', 'Pakistani', 'm.abdullah@email.com', '+92 300 1111111', 'House 123, Block A', 'Lahore', 'Pakistan', NULL, '11111111-1111-1111-1111-111111111111', '1998-05-15', 'BP1234567', '2030-05-14', '35201-1234567-8', 'No gap', 'Good communication skills', 'active', 'cas', '2025-08-01 10:00:00+00'),
  ('STU-STU002', NULL, 'Aisha Rahman', 'Rahman Ali', 'female', 'Pakistani', 'aisha.rahman@email.com', '+92 301 2222222', 'House 45, Gulberg', 'Karachi', 'Pakistan', NULL, '11111111-1111-1111-1111-111111111111', '1999-08-20', 'BP2345678', '2031-08-19', '42101-2345678-9', '1 year gap for IELTS prep', 'Excellent academic record', 'active', 'visa', '2025-07-28 11:00:00+00'),
  ('STU-STU003', NULL, 'Daniyal Khan', 'Khan Saeed', 'male', 'Pakistani', 'daniyal.k@email.com', '+92 302 3333333', 'House 67, F-8', 'Islamabad', 'Pakistan', NULL, '11111111-1111-1111-1111-111111111111', '1997-03-10', 'BP3456789', '2029-03-09', '61101-3456789-0', 'No gap', 'Strong technical background', 'active', 'visa', '2025-07-25 09:00:00+00')
) AS t(student_id, lead_id, name, father_name, gender, nationality, email, phone, address, city, country, assigned_counselor_id, branch_id, date_of_birth, passport_number, passport_expiry, cnic, gap_explanation, interview_notes, status, admission_stage, created_at)
WHERE NOT EXISTS (SELECT 1 FROM students LIMIT 1);

-- Seed: Academic Records (10)
INSERT INTO academic_records (student_id, level, institution, percentage, cgpa, passing_year)
SELECT s.id, t.level, t.institution, t.percentage, t.cgpa, t.passing_year
FROM students s
JOIN (VALUES
  ('STU-STU001', 'ssc', 'Punjab Board', 85.5, NULL, 2014),
  ('STU-STU001', 'hssc', 'BISE Lahore', 82.0, NULL, 2016),
  ('STU-STU001', 'bachelor', 'Punjab University', NULL, 3.4, 2020),
  ('STU-STU002', 'ssc', 'Karachi Board', 88.0, NULL, 2015),
  ('STU-STU002', 'hssc', 'BISE Karachi', 85.5, NULL, 2017),
  ('STU-STU002', 'bachelor', 'University of Karachi', NULL, 3.6, 2021),
  ('STU-STU003', 'ssc', 'Federal Board', 90.0, NULL, 2013),
  ('STU-STU003', 'hssc', 'BISE Federal', 87.5, NULL, 2015),
  ('STU-STU003', 'bachelor', 'FAST NUCES', NULL, 3.2, 2019),
  ('STU-STU003', 'master', 'LUMS', NULL, 3.5, 2021)
) AS t(sid, level, institution, percentage, cgpa, passing_year)
ON s.student_id = t.sid
WHERE NOT EXISTS (SELECT 1 FROM academic_records LIMIT 1);

-- Seed: English Tests (3)
INSERT INTO english_tests (student_id, test_type, overall, listening, reading, writing, speaking, expiry_date)
SELECT s.id, t.test_type, t.overall, t.listening, t.reading, t.writing, t.speaking, t.expiry_date
FROM students s
JOIN (VALUES
  ('STU-STU001', 'ielts', 6.5, 6.5, 7.0, 6.0, 6.5, '2026-08-15'::date),
  ('STU-STU002', 'ielts', 7.0, 7.0, 7.5, 6.5, 7.0, '2027-01-20'::date),
  ('STU-STU003', 'pte', 65, 65, 70, 60, 65, '2026-12-10'::date)
) AS t(sid, test_type, overall, listening, reading, writing, speaking, expiry_date)
ON s.student_id = t.sid
WHERE NOT EXISTS (SELECT 1 FROM english_tests LIMIT 1);

-- Seed: Applications (7)
INSERT INTO applications (application_id, student_id, university_id, university_name, course, campus, intake, tuition_fee, scholarship, deposit, application_date, status, priority, remarks, created_at)
SELECT t.app_id, s.id, u.id, t.uni_name, t.course, t.campus, t.intake, t.tuition, t.scholarship, t.deposit, t.app_date::date, t.status, t.priority, t.remarks, t.created_at
FROM students s
JOIN (VALUES
  ('APP-APP001', 'STU-STU001', 'University of Exeter', 'MSc Computer Science', 'Streatham Campus', 'September 2025', 22000, '£2000 scholarship', 2000, '2025-08-01', 'col', 'high', 'Conditional offer received', '2025-08-01 10:00:00+00'),
  ('APP-APP002', 'STU-STU001', 'University of Dundee', 'MSc Data Science', 'Main Campus', 'January 2026', 19000, NULL, 1500, '2025-08-05', 'submitted', 'medium', 'Application submitted', '2025-08-05 10:00:00+00'),
  ('APP-APP003', 'STU-STU001', 'Coventry University', 'MSc Computer Science', 'Main Campus', 'September 2025', 17000, '£1000 scholarship', 2000, '2025-07-28', 'uol', 'high', 'Unconditional offer', '2025-07-28 10:00:00+00'),
  ('APP-APP004', 'STU-STU002', 'Ulster University', 'MBA', 'Belfast Campus', 'September 2025', 16000, NULL, 2000, '2025-07-20', 'cas', 'urgent', 'CAS received', '2025-07-20 10:00:00+00'),
  ('APP-APP005', 'STU-STU002', 'University of Salford', 'MSc Marketing', 'Main Campus', 'January 2026', 17000, NULL, 1500, '2025-07-15', 'deposited', 'medium', 'Deposit paid', '2025-07-15 10:00:00+00'),
  ('APP-APP006', 'STU-STU003', 'University of Manchester', 'MSc Engineering', 'Main Campus', 'September 2025', 28000, '£3000 scholarship', 3000, '2025-07-10', 'visa', 'high', 'Visa approved', '2025-07-10 10:00:00+00'),
  ('APP-APP007', 'STU-STU003', 'University of Glasgow', 'MSc Mechanical Engineering', 'Main Campus', 'January 2026', 25000, NULL, 2500, '2025-08-03', 'draft', 'low', 'Draft application', '2025-08-03 10:00:00+00')
) AS t(app_id, sid, uni_name, course, campus, intake, tuition, scholarship, deposit, app_date, status, priority, remarks, created_at)
ON s.student_id = t.sid
JOIN universities u ON u.name = t.uni_name
WHERE NOT EXISTS (SELECT 1 FROM applications LIMIT 1);

-- Seed: Payments (8)
INSERT INTO payments (student_id, application_id, payment_type, amount, currency, payment_method, payment_date, invoice_number, receipt_number, description, status, created_at)
SELECT s.id, a.id, t.ptype, t.amount, 'GBP', t.method, t.pdate::date, t.inv, t.receipt, t.descr, t.status, t.created_at
FROM students s
LEFT JOIN applications a ON a.application_id = t.app_id
JOIN (VALUES
  ('STU-STU001', NULL, 'student_payment', 500, 'Bank Transfer', '2025-08-01', 'INV-001', 'RCP-001', 'Consultancy fee', 'completed', '2025-08-01 10:00:00+00'),
  ('STU-STU001', 'APP-APP003', 'university_deposit', 2000, 'Bank Transfer', '2025-07-28', 'INV-002', 'RCP-002', 'Coventry deposit', 'completed', '2025-07-28 10:00:00+00'),
  ('STU-STU002', 'APP-APP004', 'university_deposit', 2000, 'Bank Transfer', '2025-07-20', 'INV-003', 'RCP-003', 'Ulster deposit', 'completed', '2025-07-20 10:00:00+00'),
  ('STU-STU002', NULL, 'student_payment', 500, 'Cash', '2025-07-18', 'INV-004', 'RCP-004', 'Consultancy fee', 'completed', '2025-07-18 10:00:00+00'),
  ('STU-STU002', 'APP-APP004', 'commission', 1200, 'Bank Transfer', '2025-07-22', 'INV-005', 'RCP-005', 'Commission from Ulster', 'completed', '2025-07-22 10:00:00+00'),
  ('STU-STU003', 'APP-APP006', 'university_deposit', 1500, 'Bank Transfer', '2025-07-10', 'INV-006', 'RCP-006', 'Manchester deposit', 'completed', '2025-07-10 10:00:00+00'),
  ('STU-STU003', NULL, 'student_payment', 500, 'Bank Transfer', '2025-07-08', 'INV-007', 'RCP-007', 'Consultancy fee', 'completed', '2025-07-08 10:00:00+00'),
  ('STU-STU003', NULL, 'student_payment', 300, NULL, '2025-08-05', 'INV-008', NULL, 'Partial payment', 'pending', '2025-08-05 10:00:00+00')
) AS t(sid, app_id, ptype, amount, method, pdate, inv, receipt, descr, status, created_at)
ON s.student_id = t.sid
WHERE NOT EXISTS (SELECT 1 FROM payments LIMIT 1);

-- Seed: Visas (2)
INSERT INTO visas (student_id, application_id, visa_type, financial_verification, tb_test_done, tb_test_date, biometrics_done, biometrics_date, appointment_date, submission_date, decision_date, decision, visa_expiry, notes)
SELECT s.id, a.id, 'Student Visa', t.fin_ver, t.tb_done, t.tb_date::date, t.bio_done, t.bio_date::date, t.appt_date::date, t.sub_date::date, t.dec_date::date, t.decision, t.expiry::date, t.notes
FROM students s
JOIN applications a ON a.application_id = t.app_id
JOIN (VALUES
  ('STU-STU002', 'APP-APP004', true, true, '2025-07-25', true, '2025-07-28', '2025-08-01', '2025-08-03', NULL, 'pending', NULL, 'Visa under process'),
  ('STU-STU003', 'APP-APP006', true, true, '2025-07-12', true, '2025-07-15', '2025-07-18', '2025-07-20', '2025-07-25', 'approved', '2028-09-30', 'Visa approved')
) AS t(sid, app_id, fin_ver, tb_done, tb_date, bio_done, bio_date, appt_date, sub_date, dec_date, decision, expiry, notes)
ON s.student_id = t.sid
WHERE NOT EXISTS (SELECT 1 FROM visas LIMIT 1);

-- Seed: Tasks (5)
INSERT INTO tasks (title, description, assigned_to, related_student_id, related_lead_id, due_date, priority, status, created_at)
SELECT t.title, t.descr, NULL, s.id, l.id, t.due_date::date, t.priority, t.status, t.created_at
FROM (VALUES
  ('Follow up with Ahmed Raza', 'Call to discuss university options', NULL, 'LD-LEAD001', '2025-09-10', 'high', 'pending', '2025-08-15 10:00:00+00'),
  ('Collect documents from Aisha', 'Need passport and academic transcripts', 'STU-STU002', NULL, '2025-09-08', 'medium', 'pending', '2025-08-14 10:00:00+00'),
  ('Submit visa application for Muhammad', 'Submit visa application with all documents', 'STU-STU001', NULL, '2025-09-05', 'urgent', 'pending', '2025-08-13 10:00:00+00'),
  ('Update CAS status for Aisha', 'Check CAS status with Ulster University', 'STU-STU002', NULL, '2025-09-12', 'high', 'in_progress', '2025-08-12 10:00:00+00'),
  ('Prepare enrollment documents for Daniyal', 'Prepare enrollment documents for Manchester', 'STU-STU003', NULL, '2025-09-15', 'medium', 'pending', '2025-08-11 10:00:00+00')
) AS t(title, descr, stu_id, lead_id, due_date, priority, status, created_at)
LEFT JOIN students s ON s.student_id = t.stu_id
LEFT JOIN leads l ON l.lead_id = t.lead_id
WHERE NOT EXISTS (SELECT 1 FROM tasks LIMIT 1);

-- Seed: Follow-ups (3)
INSERT INTO follow_ups (lead_id, student_id, assigned_to, follow_up_date, follow_up_time, method, notes, status)
SELECT l.id, NULL, NULL, t.fdate::date, t.ftime::time, t.method, t.notes, t.status
FROM leads l
JOIN (VALUES
  ('LD-LEAD002', '2025-09-05', '10:00', 'call', 'Discuss MBA options', 'pending'),
  ('LD-LEAD004', '2025-09-08', '14:00', 'email', 'Send university brochure', 'pending'),
  ('LD-LEAD006', '2025-09-20', '11:00', 'whatsapp', 'Schedule counseling session', 'pending')
) AS t(lid, fdate, ftime, method, notes, status)
ON l.lead_id = t.lid
WHERE NOT EXISTS (SELECT 1 FROM follow_ups LIMIT 1);

-- Seed: Activity Timeline (7)
INSERT INTO activity_timeline (lead_id, student_id, application_id, activity_type, description, performed_by, metadata, created_at)
SELECT l.id, NULL, NULL, t.atype, t.descr, NULL, '{}'::jsonb, t.created_at
FROM leads l
JOIN (VALUES
  ('LD-LEAD001', 'lead_created', 'Lead created', '2025-08-15 10:00:00+00'),
  ('LD-LEAD002', 'lead_created', 'Lead created', '2025-08-14 11:30:00+00'),
  ('LD-LEAD003', 'lead_created', 'Lead created', '2025-08-13 09:15:00+00'),
  ('LD-LEAD005', 'lead_created', 'Lead created', '2025-08-11 10:45:00+00'),
  ('LD-LEAD005', 'note_added', 'Appointment scheduled for counseling', '2025-08-11 11:00:00+00'),
  ('LD-LEAD009', 'lead_created', 'Lead created', '2025-08-07 11:00:00+00'),
  ('LD-LEAD009', 'note_added', 'Options shared with student', '2025-08-07 12:00:00+00')
) AS t(lid, atype, descr, created_at)
ON l.lead_id = t.lid
WHERE NOT EXISTS (SELECT 1 FROM activity_timeline LIMIT 1);
`;
