/*
# Add auto-profile trigger and sample data

1. Creates a trigger that automatically inserts a profile row when a new auth user is created
2. Seeds sample leads, students, applications, tasks, payments, and visa records
3. This ensures the CRM has data to display immediately after sign-up
*/

-- ============================================
-- AUTO-PROFILE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'counselor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Get the main branch ID
DO $$
DECLARE
  v_branch uuid;
  v_source_manual uuid;
  v_source_website uuid;
  v_source_facebook uuid;
  v_source_google uuid;
  v_source_whatsapp uuid;
BEGIN
  SELECT id INTO v_branch FROM branches WHERE code = 'MAIN' LIMIT 1;
  SELECT id INTO v_source_manual FROM lead_sources WHERE name = 'Manual Entry' LIMIT 1;
  SELECT id INTO v_source_website FROM lead_sources WHERE name = 'Website Form' LIMIT 1;
  SELECT id INTO v_source_facebook FROM lead_sources WHERE name = 'Facebook Lead' LIMIT 1;
  SELECT id INTO v_source_google FROM lead_sources WHERE name = 'Google Lead' LIMIT 1;
  SELECT id INTO v_source_whatsapp FROM lead_sources WHERE name = 'WhatsApp' LIMIT 1;

  -- Insert sample leads (only if none exist)
  IF NOT EXISTS (SELECT 1 FROM leads LIMIT 1) THEN
    INSERT INTO leads (lead_id, name, father_name, gender, nationality, email, phone, city, country, lead_source_id, campaign, interested_country, interested_intake, interested_course, interested_level, budget, notes, follow_up_date, status, branch_id) VALUES
      ('LD-LEAD001', 'Ahmed Raza', 'Muhammad Raza', 'male', 'Pakistani', 'ahmed.raza@gmail.com', '+92 300 1234567', 'Lahore', 'Pakistan', v_source_manual, 'Summer 2025', 'United Kingdom', 'September 2025', 'Computer Science', 'Postgraduate', '£25,000', 'Very interested in UK universities', CURRENT_DATE + 3, 'new_lead', v_branch),
      ('LD-LEAD002', 'Fatima Khan', 'Imran Khan', 'female', 'Pakistani', 'fatima.khan@gmail.com', '+92 301 2345678', 'Karachi', 'Pakistan', v_source_website, 'Google Ads', 'United Kingdom', 'September 2025', 'MBA', 'Postgraduate', '£30,000', 'Wants top university', CURRENT_DATE + 1, 'contacted', v_branch),
      ('LD-LEAD003', 'Bilal Ahmed', 'Saeed Ahmed', 'male', 'Pakistani', 'bilal.ahmed@hotmail.com', '+92 302 3456789', 'Islamabad', 'Pakistan', v_source_facebook, 'FB Campaign Q1', 'United Kingdom', 'January 2026', 'Engineering', 'Undergraduate', '£20,000', 'Looking for scholarship options', CURRENT_DATE, 'interested', v_branch),
      ('LD-LEAD004', 'Sana Malik', 'Tariq Malik', 'female', 'Pakistani', 'sana.malik@yahoo.com', '+92 303 4567890', 'Faisalabad', 'Pakistan', v_source_google, 'Search Campaign', 'United Kingdom', 'September 2025', 'Business Management', 'Postgraduate', '£22,000', 'Needs English test guidance', CURRENT_DATE + 5, 'follow_up', v_branch),
      ('LD-LEAD005', 'Hassan Ali', 'Ghulam Ali', 'male', 'Pakistani', 'hassan.ali@gmail.com', '+92 304 5678901', 'Multan', 'Pakistan', v_source_whatsapp, 'WhatsApp Campaign', 'United Kingdom', 'September 2025', 'Data Science', 'Postgraduate', '£28,000', 'Has IELTS 7.0', CURRENT_DATE + 2, 'appointment_scheduled', v_branch),
      ('LD-LEAD006', 'Ayesha Siddiqui', 'Asif Siddiqui', 'female', 'Pakistani', 'ayesha.sidd@gmail.com', '+92 305 6789012', 'Lahore', 'Pakistan', v_source_manual, 'Walk-in', 'United Kingdom', 'January 2026', 'Law', 'Postgraduate', '£26,000', 'Wants to apply to multiple universities', CURRENT_DATE + 7, 'new_lead', v_branch),
      ('LD-LEAD007', 'Usman Tariq', 'Tariq Mehmood', 'male', 'Pakistani', 'usman.tariq@gmail.com', '+92 306 7890123', 'Rawalpindi', 'Pakistan', v_source_website, 'Organic Search', 'United Kingdom', 'September 2025', 'Mechanical Engineering', 'Undergraduate', '£24,000', 'Interested in Coventry', CURRENT_DATE - 1, 'no_response', v_branch),
      ('LD-LEAD008', 'Zainab Hussain', 'Hussain Ahmed', 'female', 'Pakistani', 'zainab.h@gmail.com', '+92 307 8901234', 'Karachi', 'Pakistan', v_source_facebook, 'FB Campaign Q2', 'United Kingdom', 'September 2025', 'Nursing', 'Undergraduate', '£18,000', 'Budget constraint', CURRENT_DATE - 3, 'not_interested', v_branch),
      ('LD-LEAD009', 'Ali Raza', 'Raza Khan', 'male', 'Pakistani', 'ali.raza@gmail.com', '+92 308 9012345', 'Lahore', 'Pakistan', v_source_google, 'Search Campaign', 'United Kingdom', 'January 2026', 'Finance', 'Postgraduate', '£30,000', 'Strong profile, high IELTS', CURRENT_DATE + 4, 'option_shared', v_branch),
      ('LD-LEAD010', 'Maryam Iqbal', 'Iqbal Hassan', 'female', 'Pakistani', 'maryam.iqbal@gmail.com', '+92 309 0123456', 'Gujranwala', 'Pakistan', v_source_manual, 'Referral', 'United Kingdom', 'September 2025', 'Pharmacy', 'Postgraduate', '£27,000', 'Referred by existing student', CURRENT_DATE + 1, 'document_collection', v_branch),
      ('LD-LEAD011', 'Hamza Sheikh', 'Sheikh Anwar', 'male', 'Pakistani', 'hamza.sheikh@gmail.com', '+92 310 1234567', 'Sialkot', 'Pakistan', v_source_whatsapp, 'WhatsApp', 'United Kingdom', 'September 2025', 'Computer Science', 'Undergraduate', '£22,000', 'Needs scholarship', CURRENT_DATE + 6, 'new_lead', v_branch),
      ('LD-LEAD012', 'Nimra Aslam', 'Aslam Pervaiz', 'female', 'Pakistani', 'nimra.aslam@gmail.com', '+92 311 2345678', 'Bahawalpur', 'Pakistan', v_source_website, 'Website', 'United Kingdom', 'January 2026', 'Marketing', 'Postgraduate', '£20,000', 'Wants part-time work info', CURRENT_DATE + 2, 'contacted', v_branch);
  END IF;

  -- Insert sample students (only if none exist)
  IF NOT EXISTS (SELECT 1 FROM students LIMIT 1) THEN
    INSERT INTO students (student_id, name, father_name, gender, nationality, email, phone, city, country, date_of_birth, passport_number, passport_expiry, cnic, status, branch_id, gap_explanation, interview_notes) VALUES
      ('STU-STU001', 'Muhammad Abdullah', 'Abdullah Khan', 'male', 'Pakistani', 'm.abdullah@gmail.com', '+92 300 1111111', 'Lahore', 'Pakistan', '1998-05-15', 'PK1234567', '2028-12-31', '35201-1234567-8', 'active', v_branch, '2 year gap for IELTS preparation', 'Good communication skills, clear study goals'),
      ('STU-STU002', 'Aisha Rahman', 'Rahman Ali', 'female', 'Pakistani', 'aisha.rahman@gmail.com', '+92 301 2222222', 'Karachi', 'Pakistan', '1999-08-20', 'PK2345678', '2029-06-30', '42101-2345678-9', 'active', v_branch, 'No gap', 'Strong academic background, confident'),
      ('STU-STU003', 'Daniyal Khan', 'Kamran Khan', 'male', 'Pakistani', 'daniyal.k@gmail.com', '+92 302 3333333', 'Islamabad', 'Pakistan', '1997-03-10', 'PK3456789', '2027-03-15', '61101-3456789-0', 'active', v_branch, '1 year work experience after graduation', 'Well-prepared, has all documents ready');

    -- Academic records for students
    INSERT INTO academic_records (student_id, level, institution, percentage, cgpa, passing_year) VALUES
      ((SELECT id FROM students WHERE student_id = 'STU-STU001'), 'ssc', 'Punjab Board', 85.5, NULL, 2014),
      ((SELECT id FROM students WHERE student_id = 'STU-STU001'), 'hssc', 'BISE Lahore', 82.0, NULL, 2016),
      ((SELECT id FROM students WHERE student_id = 'STU-STU001'), 'bachelor', 'University of the Punjab', NULL, 3.4, 2020),
      ((SELECT id FROM students WHERE student_id = 'STU-STU002'), 'ssc', 'Karachi Board', 88.0, NULL, 2015),
      ((SELECT id FROM students WHERE student_id = 'STU-STU002'), 'hssc', 'BISE Karachi', 85.5, NULL, 2017),
      ((SELECT id FROM students WHERE student_id = 'STU-STU002'), 'bachelor', 'University of Karachi', NULL, 3.6, 2021),
      ((SELECT id FROM students WHERE student_id = 'STU-STU003'), 'ssc', 'Federal Board', 90.0, NULL, 2013),
      ((SELECT id FROM students WHERE student_id = 'STU-STU003'), 'hssc', 'BISE Federal', 87.5, NULL, 2015),
      ((SELECT id FROM students WHERE student_id = 'STU-STU003'), 'bachelor', 'FAST NUCES', NULL, 3.2, 2019),
      ((SELECT id FROM students WHERE student_id = 'STU-STU003'), 'master', 'LUMS', NULL, 3.5, 2021);

    -- English tests
    INSERT INTO english_tests (student_id, test_type, overall, listening, reading, writing, speaking, expiry_date) VALUES
      ((SELECT id FROM students WHERE student_id = 'STU-STU001'), 'ielts', 6.5, 6.5, 7.0, 6.0, 6.5, '2026-08-15'),
      ((SELECT id FROM students WHERE student_id = 'STU-STU002'), 'ielts', 7.0, 7.0, 7.5, 6.5, 7.0, '2027-01-20'),
      ((SELECT id FROM students WHERE student_id = 'STU-STU003'), 'pte', 65, 65, 70, 60, 65, '2026-12-10');

    -- Applications
    INSERT INTO applications (application_id, student_id, university_id, university_name, course, campus, intake, tuition_fee, scholarship, deposit, application_date, status, priority, remarks) VALUES
      ('APP-APP001', (SELECT id FROM students WHERE student_id = 'STU-STU001'), (SELECT id FROM universities WHERE name = 'University of Exeter'), 'University of Exeter', 'MSc Computer Science', 'Exeter', 'September 2025', 22000, '10% scholarship', 2000, CURRENT_DATE - 30, 'conditional_offer', 'high', 'Waiting for transcript verification'),
      ('APP-APP002', (SELECT id FROM students WHERE student_id = 'STU-STU001'), (SELECT id FROM universities WHERE name = 'University of Dundee'), 'University of Dundee', 'MSc Data Science', 'Dundee', 'September 2025', 18000, NULL, 1000, CURRENT_DATE - 25, 'application_submitted', 'medium', 'Submitted all documents'),
      ('APP-APP003', (SELECT id FROM students WHERE student_id = 'STU-STU001'), (SELECT id FROM universities WHERE name = 'Coventry University'), 'Coventry University', 'MSc Computer Science', 'Coventry', 'January 2026', 17000, '15% scholarship', 2000, CURRENT_DATE - 20, 'unconditional_offer', 'high', 'Offer received, deposit pending'),
      ('APP-APP004', (SELECT id FROM students WHERE student_id = 'STU-STU002'), (SELECT id FROM universities WHERE name = 'Ulster University'), 'Ulster University', 'MBA', 'Belfast', 'September 2025', 16000, NULL, 2000, CURRENT_DATE - 15, 'cas_received', 'urgent', 'CAS received, visa processing'),
      ('APP-APP005', (SELECT id FROM students WHERE student_id = 'STU-STU002'), (SELECT id FROM universities WHERE name = 'University of Salford'), 'University of Salford', 'MSc Marketing', 'Salford', 'September 2025', 16000, NULL, 2000, CURRENT_DATE - 10, 'deposit_paid', 'medium', 'Deposit paid, waiting for CAS'),
      ('APP-APP006', (SELECT id FROM students WHERE student_id = 'STU-STU003'), (SELECT id FROM universities WHERE name = 'University of Manchester'), 'University of Manchester', 'MSc Engineering', 'Manchester', 'September 2025', 26000, NULL, 1500, CURRENT_DATE - 35, 'visa_approved', 'high', 'Visa approved! Ready to go'),
      ('APP-APP007', (SELECT id FROM students WHERE student_id = 'STU-STU003'), (SELECT id FROM universities WHERE name = 'University of Glasgow'), 'University of Glasgow', 'MSc Mechanical Engineering', 'Glasgow', 'January 2026', 24000, '10% scholarship', 2000, CURRENT_DATE - 5, 'draft', 'low', 'Still gathering documents');

    -- Payments
    INSERT INTO payments (student_id, application_id, payment_type, amount, currency, payment_method, payment_date, invoice_number, receipt_number, description, status) VALUES
      ((SELECT id FROM students WHERE student_id = 'STU-STU001'), NULL, 'student_payment', 500, 'GBP', 'Bank Transfer', CURRENT_DATE - 28, 'INV-001', 'RCP-001', 'Consultancy fee', 'completed'),
      ((SELECT id FROM students WHERE student_id = 'STU-STU001'), (SELECT id FROM applications WHERE application_id = 'APP-APP003'), 'university_deposit', 2000, 'GBP', 'Bank Transfer', CURRENT_DATE - 18, 'INV-002', 'RCP-002', 'Coventry University deposit', 'completed'),
      ((SELECT id FROM students WHERE student_id = 'STU-STU002'), (SELECT id FROM applications WHERE application_id = 'APP-APP004'), 'university_deposit', 2000, 'GBP', 'Bank Transfer', CURRENT_DATE - 12, 'INV-003', 'RCP-003', 'Ulster University deposit', 'completed'),
      ((SELECT id FROM students WHERE student_id = 'STU-STU002'), NULL, 'student_payment', 500, 'GBP', 'Cash', CURRENT_DATE - 8, 'INV-004', 'RCP-004', 'Consultancy fee', 'completed'),
      ((SELECT id FROM students WHERE student_id = 'STU-STU002'), (SELECT id FROM applications WHERE application_id = 'APP-APP004'), 'commission', 1200, 'GBP', 'Bank Transfer', CURRENT_DATE - 3, 'INV-005', 'RCP-005', 'Commission from Ulster University', 'completed'),
      ((SELECT id FROM students WHERE student_id = 'STU-STU003'), (SELECT id FROM applications WHERE application_id = 'APP-APP006'), 'university_deposit', 1500, 'GBP', 'Bank Transfer', CURRENT_DATE - 30, 'INV-006', 'RCP-006', 'Manchester deposit', 'completed'),
      ((SELECT id FROM students WHERE student_id = 'STU-STU003'), NULL, 'student_payment', 500, 'GBP', 'Bank Transfer', CURRENT_DATE - 25, 'INV-007', 'RCP-007', 'Consultancy fee', 'completed'),
      ((SELECT id FROM students WHERE student_id = 'STU-STU003'), NULL, 'student_payment', 300, 'GBP', NULL, NULL, 'INV-008', NULL, 'Pending visa processing fee', 'pending');

    -- Visa records
    INSERT INTO visas (student_id, application_id, visa_type, financial_verification, tb_test_done, tb_test_date, biometrics_done, biometrics_date, appointment_date, submission_date, decision_date, decision, visa_expiry, notes) VALUES
      ((SELECT id FROM students WHERE student_id = 'STU-STU002'), (SELECT id FROM applications WHERE application_id = 'APP-APP004'), 'Student Visa', true, true, CURRENT_DATE - 20, true, CURRENT_DATE - 15, CURRENT_DATE - 10, CURRENT_DATE - 8, NULL, 'pending', NULL, 'Waiting for decision'),
      ((SELECT id FROM students WHERE student_id = 'STU-STU003'), (SELECT id FROM applications WHERE application_id = 'APP-APP006'), 'Student Visa', true, true, CURRENT_DATE - 40, true, CURRENT_DATE - 35, CURRENT_DATE - 32, CURRENT_DATE - 28, CURRENT_DATE - 5, 'approved', '2028-09-30', 'Visa approved successfully');

    -- Tasks
    INSERT INTO tasks (title, description, assigned_to, due_date, priority, status, related_student_id) VALUES
      ('Follow up with Ahmed Raza', 'Call to discuss university options', NULL, CURRENT_DATE + 3, 'high', 'pending', NULL),
      ('Collect documents from Aisha', 'Need transcripts and passport copy', NULL, CURRENT_DATE + 2, 'medium', 'pending', (SELECT id FROM students WHERE student_id = 'STU-STU002')),
      ('Submit visa application for Muhammad', 'Prepare and submit visa application', NULL, CURRENT_DATE + 5, 'urgent', 'pending', (SELECT id FROM students WHERE student_id = 'STU-STU001')),
      ('Update CAS status for Aisha', 'Check with university for CAS update', NULL, CURRENT_DATE + 1, 'high', 'in_progress', (SELECT id FROM students WHERE student_id = 'STU-STU002')),
      ('Prepare enrollment documents for Daniyal', 'Visa approved, prepare for enrollment', NULL, CURRENT_DATE + 7, 'medium', 'pending', (SELECT id FROM students WHERE student_id = 'STU-STU003'));

    -- Follow-ups
    INSERT INTO follow_ups (lead_id, assigned_to, follow_up_date, method, notes, status) VALUES
      ((SELECT id FROM leads WHERE lead_id = 'LD-LEAD002'), NULL, CURRENT_DATE + 1, 'call', 'Discuss MBA options', 'pending'),
      ((SELECT id FROM leads WHERE lead_id = 'LD-LEAD004'), NULL, CURRENT_DATE, 'email', 'Send university brochure', 'pending'),
      ((SELECT id FROM leads WHERE lead_id = 'LD-LEAD006'), NULL, CURRENT_DATE + 7, 'whatsapp', 'Schedule counseling session', 'pending');

    -- Activity timeline
    INSERT INTO activity_timeline (lead_id, activity_type, description) VALUES
      ((SELECT id FROM leads WHERE lead_id = 'LD-LEAD001'), 'created', 'Lead created: Ahmed Raza'),
      ((SELECT id FROM leads WHERE lead_id = 'LD-LEAD002'), 'created', 'Lead created: Fatima Khan'),
      ((SELECT id FROM leads WHERE lead_id = 'LD-LEAD003'), 'created', 'Lead created: Bilal Ahmed'),
      ((SELECT id FROM leads WHERE lead_id = 'LD-LEAD005'), 'created', 'Lead created: Hassan Ali'),
      ((SELECT id FROM leads WHERE lead_id = 'LD-LEAD005'), 'note', 'Appointment scheduled for counseling'),
      ((SELECT id FROM leads WHERE lead_id = 'LD-LEAD009'), 'created', 'Lead created: Ali Raza'),
      ((SELECT id FROM leads WHERE lead_id = 'LD-LEAD009'), 'note', 'Options shared with student');
  END IF;
END $$;