import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  ACADEMIC_LEVELS, ENGLISH_TEST_TYPES, DOCUMENT_TYPES,
  ADMISSION_STAGES, ADMISSION_STAGE_LABELS, ADMISSION_STAGE_COLORS,
  INTAKES, PRIORITY_COLORS,
  APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, APP_STATUS_COLORS,
} from '@/lib/constants';
import { logActivity } from '@/components/ActivityTimeline';
import type {
  Student, AcademicRecord, EnglishTest, Profile, University,
  AdmissionStage, Application, ApplicationStatus, Document,
} from '@/lib/types';
import { generateId, formatDate, cn, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Select, Textarea, Modal, Badge, Card, EmptyState, Avatar } from '@/components/ui';
import { TasksTab } from '@/components/TasksTab';
import {
  UserCheck, Search, Plus, ChevronLeft, ChevronRight,
  GraduationCap, BookOpen, FileText, Plane, Briefcase, Phone, Mail,
  Pencil, Trash2, ArrowRight, Upload, Clock, Filter, X, CheckCircle2,
  List, LayoutGrid,
} from 'lucide-react';

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [counselors, setCounselors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [counselorFilter, setCounselorFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => localStorage.getItem('studentsViewMode') === 'cards' ? 'cards' : 'list');
  const pageSize = 20;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('students').select('*', { count: 'exact' });
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,student_id.ilike.%${search}%`);
    if (stageFilter) query = query.eq('admission_stage', stageFilter);
    if (counselorFilter) query = query.eq('assigned_counselor_id', counselorFilter);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
    query = query.order('created_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
    const { data, count } = await query;
    setStudents((data as Student[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [search, stageFilter, counselorFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').in('role', ['counselor', 'team_leader', 'branch_manager', 'super_admin']);
      setCounselors((data as Profile[]) ?? []);
    })();
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { localStorage.setItem('studentsViewMode', viewMode); }, [viewMode]);

  const counselorName = (id: string | null) => counselors.find((c) => c.id === id)?.full_name ?? 'Unassigned';

  if (selectedId) {
    return <StudentDetail studentId={selectedId} counselors={counselors} onBack={() => { setSelectedId(null); fetchStudents(); }} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mature Students</h1>
        <p className="text-sm text-gray-500 mt-1">{total} total students</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by name, email, phone, or student ID..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" size="md" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" /> Filters
            {(stageFilter || counselorFilter || dateFrom || dateTo) ? <span className="w-2 h-2 bg-blue-500 rounded-full" /> : null}
          </Button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Stage</label>
              <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Stages</option>
                {ADMISSION_STAGES.map((s) => <option key={s} value={s}>{ADMISSION_STAGE_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Assigned User</label>
              <select value={counselorFilter} onChange={(e) => { setCounselorFilter(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Users</option>
                {counselors.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : students.length === 0 ? (
          <EmptyState icon={<UserCheck className="w-7 h-7" />} title="No students found" description="Convert leads to mature students to see them here." />
        ) : (
          viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Counselor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr key={s.id} onClick={() => setSelectedId(s.id)} className="hover:bg-gray-50/50 cursor-pointer transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.student_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{s.email ?? '—'}</p>
                      <p className="text-xs text-gray-400">{s.phone ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm text-gray-600">{counselorName(s.assigned_counselor_id)}</span></td>
                    <td className="px-4 py-3">
                      <Badge className={ADMISSION_STAGE_COLORS[s.admission_stage ?? 'draft']}>
                        {ADMISSION_STAGE_LABELS[s.admission_stage ?? 'draft']}
                      </Badge>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm text-gray-500">{formatDate(s.created_at)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {students.map((s) => (
                <div key={s.id} onClick={() => setSelectedId(s.id)} className="p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:border-gray-200 cursor-pointer transition group">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} className="w-11 h-11 text-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.student_id}</p>
                    </div>
                    <Badge className={ADMISSION_STAGE_COLORS[s.admission_stage ?? 'draft']}>
                      {ADMISSION_STAGE_LABELS[s.admission_stage ?? 'draft']}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {s.email ?? '—'}</p>
                    <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {s.phone ?? '—'}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{counselorName(s.assigned_counselor_id)}</span>
                    <span className="text-xs text-gray-400">{formatDate(s.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
        {!loading && students.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StudentDetail({ studentId, counselors, onBack }: { studentId: string; counselors: Profile[]; onBack: () => void }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [academic, setAcademic] = useState<AcademicRecord[]>([]);
  const [english, setEnglish] = useState<EnglishTest[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [tab, setTab] = useState<'overview' | 'academic' | 'english' | 'documents' | 'tasks'>('overview');
  const [loading, setLoading] = useState(true);
  const [showAddAcademic, setShowAddAcademic] = useState(false);
  const [showAddEnglish, setShowAddEnglish] = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showConvertApp, setShowConvertApp] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);

  const fetchAll = useCallback(async () => {
    const [stuRes, acadRes, engRes, docRes, appRes] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentId).maybeSingle(),
      supabase.from('academic_records').select('*').eq('student_id', studentId).order('passing_year', { ascending: false }),
      supabase.from('english_tests').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
      supabase.from('applications').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
    ]);
    setStudent(stuRes.data as Student | null);
    setAcademic((acadRes.data as AcademicRecord[]) ?? []);
    setEnglish((engRes.data as EnglishTest[]) ?? []);
    setDocs((docRes.data as Document[]) ?? []);
    setApplications((appRes.data as Application[]) ?? []);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!student) return <div>Student not found.</div>;

  const counselorName = (id: string | null) => counselors.find((c) => c.id === id)?.full_name ?? 'Unassigned';

  const handleStageChange = async (stage: AdmissionStage) => {
    await supabase.from('students').update({ admission_stage: stage }).eq('id', studentId);
    setStudent({ ...student, admission_stage: stage });
  };

  const handleDelete = async () => {
    if (!confirm(`Delete student "${student.name}"? The original lead will be restored.`)) return;
    // Restore the original lead if one exists
    if (student.lead_id) {
      await supabase.from('leads').update({ status: 'new_lead' }).eq('id', student.lead_id);
      await logActivity({ leadId: student.lead_id, activityType: 'restore', description: `Lead restored after student deletion (${student.name})`, performedBy: profile?.id });
    }
    await supabase.from('students').delete().eq('id', studentId);
    onBack();
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <UserCheck className="w-4 h-4" /> },
    { key: 'academic', label: 'Academic', icon: <GraduationCap className="w-4 h-4" /> },
    { key: 'english', label: 'English Tests', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { key: 'tasks', label: 'Tasks', icon: <Briefcase className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Avatar name={student.name} className="w-12 h-12 text-base" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-sm text-gray-500">{student.student_id}</p>
            {student.phone && <p className="text-sm text-gray-600 mt-0.5">{student.phone}</p>}
            <p className="text-sm text-gray-500 mt-0.5">{counselorName(student.assigned_counselor_id)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowConvertApp(true)}>
            <ArrowRight className="w-4 h-4" /> Convert to Application
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Admission stage pipeline — redesigned */}
      <Card className="p-5">
        <p className="text-xs font-medium text-gray-500 mb-3">Admission Stage</p>
        <div className="flex flex-wrap gap-2">
          {ADMISSION_STAGES.map((s) => {
            const stageIdx = ADMISSION_STAGES.indexOf(s);
            const currentIdx = ADMISSION_STAGES.indexOf(student.admission_stage ?? 'draft');
            const isLost = (student.admission_stage ?? 'draft') === 'lost';
            const isPassed = !isLost && stageIdx < currentIdx && s !== 'lost';
            const isCurrent = (student.admission_stage ?? 'draft') === s;
            return (
              <button
                key={s}
                onClick={() => handleStageChange(s)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5',
                  isCurrent
                    ? ADMISSION_STAGE_COLORS[s] + ' ring-2 ring-offset-1 ring-blue-300 shadow-sm'
                    : isPassed
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                )}
              >
                {isPassed && <CheckCircle2 className="w-3.5 h-3.5" />}
                {ADMISSION_STAGE_LABELS[s]}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap',
              tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Father's Name" value={student.father_name} />
            <Field label="Gender" value={student.gender} />
            <Field label="Nationality" value={student.nationality} />
            <Field label="Email" value={student.email} />
            <Field label="Phone" value={student.phone} />
            <Field label="Date of Birth" value={formatDate(student.date_of_birth)} />
            <Field label="Passport Number" value={student.passport_number} />
            <Field label="Passport Expiry" value={formatDate(student.passport_expiry)} />
            <Field label="CNIC" value={student.cnic} />
            <Field label="Address" value={student.address} />
            <Field label="City" value={student.city} />
            <Field label="Country" value={student.country} />
          </div>
          {student.gap_explanation && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">Gap Explanation</p>
              <p className="text-sm text-gray-700">{student.gap_explanation}</p>
            </div>
          )}
          {student.interview_notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">Interview Notes</p>
              <p className="text-sm text-gray-700">{student.interview_notes}</p>
            </div>
          )}

          {/* Applications list */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Applications</h3>
            {applications.length === 0 ? (
              <p className="text-sm text-gray-400">No applications yet. Use "Convert to Application" to create one.</p>
            ) : (
              <div className="space-y-2">
                {applications.map((a) => (
                  <div key={a.id} onClick={() => navigate(`/applications/${a.id}`)} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-100 cursor-pointer transition">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.university_name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{a.course ?? '—'} · {a.intake ?? '—'}</p>
                    </div>
                    <Badge className={APP_STATUS_COLORS[a.status]}>{APPLICATION_STATUS_LABELS[a.status]}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'academic' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Academic Records</h3>
            <Button size="sm" onClick={() => setShowAddAcademic(true)}><Plus className="w-4 h-4" /> Add Record</Button>
          </div>
          {academic.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No academic records yet.</p>
          ) : (
            <div className="space-y-3">
              {academic.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ACADEMIC_LEVELS.find((l) => l.value === r.level)?.label ?? r.level}</p>
                      <p className="text-xs text-gray-500">{r.institution ?? '—'} · {r.passing_year ?? '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {r.percentage != null && <span className="text-gray-600">{r.percentage}%</span>}
                    {r.cgpa != null && <span className="text-gray-600">CGPA: {r.cgpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'english' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">English Test Scores</h3>
            <Button size="sm" onClick={() => setShowAddEnglish(true)}><Plus className="w-4 h-4" /> Add Test</Button>
          </div>
          {english.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No English test scores yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {english.map((t) => (
                <div key={t.id} className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-900">{ENGLISH_TEST_TYPES.find((e) => e.value === t.test_type)?.label ?? t.test_type}</span>
                    {t.overall != null && <Badge className="bg-blue-100 text-blue-700 border-blue-200">Overall: {t.overall}</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {t.listening != null && <span className="text-gray-600">Listening: {t.listening}</span>}
                    {t.reading != null && <span className="text-gray-600">Reading: {t.reading}</span>}
                    {t.writing != null && <span className="text-gray-600">Writing: {t.writing}</span>}
                    {t.speaking != null && <span className="text-gray-600">Speaking: {t.speaking}</span>}
                    {t.expiry_date && <span className="text-gray-500 text-xs">Expires: {formatDate(t.expiry_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'documents' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Documents</h3>
            <Button size="sm" onClick={() => setShowUploadDoc(true)}><Upload className="w-4 h-4" /> Upload</Button>
          </div>
          {docs.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No documents uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><FileText className="w-4 h-4 text-blue-600" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.file_name}</p>
                    <p className="text-xs text-gray-500">{d.document_type} · v{d.version}</p>
                  </div>
                  {d.expiry_date && <Badge className="bg-amber-100 text-amber-700 border-amber-200">Expires {formatDate(d.expiry_date)}</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'tasks' && <TasksTab studentId={student.id} />}

      {showAddAcademic && <AddAcademicModal studentId={student.id} onClose={() => setShowAddAcademic(false)} onSuccess={() => { setShowAddAcademic(false); fetchAll(); }} />}
      {showAddEnglish && <AddEnglishModal studentId={student.id} onClose={() => setShowAddEnglish(false)} onSuccess={() => { setShowAddEnglish(false); fetchAll(); }} />}
      {showUploadDoc && <UploadDocModal studentId={student.id} onClose={() => setShowUploadDoc(false)} onSuccess={() => { setShowUploadDoc(false); fetchAll(); }} />}
      {showEdit && <EditStudentModal student={student} counselors={counselors} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); fetchAll(); }} />}
      {showConvertApp && <ConvertToApplicationModal student={student} onClose={() => setShowConvertApp(false)} onSuccess={() => { setShowConvertApp(false); fetchAll(); }} />}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value ?? '—'}</p>
    </div>
  );
}

function AddAcademicModal({ studentId, onClose, onSuccess }: { studentId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ level: 'ssc', institution: '', percentage: '', cgpa: '', passing_year: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('academic_records').insert({
      student_id: studentId, level: form.level, institution: form.institution || null,
      percentage: form.percentage ? Number(form.percentage) : null,
      cgpa: form.cgpa ? Number(form.cgpa) : null,
      passing_year: form.passing_year ? Number(form.passing_year) : null,
    });
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title="Add Academic Record" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Level" value={form.level} onChange={(v) => set('level', v)} options={ACADEMIC_LEVELS} />
        <Input label="Institution" value={form.institution} onChange={(v) => set('institution', v)} />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Percentage" value={form.percentage} onChange={(v) => set('percentage', v)} type="number" />
          <Input label="CGPA" value={form.cgpa} onChange={(v) => set('cgpa', v)} type="number" />
          <Input label="Passing Year" value={form.passing_year} onChange={(v) => set('passing_year', v)} type="number" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AddEnglishModal({ studentId, onClose, onSuccess }: { studentId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ test_type: 'ielts', overall: '', listening: '', reading: '', writing: '', speaking: '', expiry_date: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('english_tests').insert({
      student_id: studentId, test_type: form.test_type,
      overall: form.overall ? Number(form.overall) : null,
      listening: form.listening ? Number(form.listening) : null,
      reading: form.reading ? Number(form.reading) : null,
      writing: form.writing ? Number(form.writing) : null,
      speaking: form.speaking ? Number(form.speaking) : null,
      expiry_date: form.expiry_date || null,
    });
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title="Add English Test Score" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Test Type" value={form.test_type} onChange={(v) => set('test_type', v)} options={ENGLISH_TEST_TYPES} />
        <div className="grid grid-cols-3 gap-3">
          <Input label="Overall" value={form.overall} onChange={(v) => set('overall', v)} type="number" />
          <Input label="Listening" value={form.listening} onChange={(v) => set('listening', v)} type="number" />
          <Input label="Reading" value={form.reading} onChange={(v) => set('reading', v)} type="number" />
          <Input label="Writing" value={form.writing} onChange={(v) => set('writing', v)} type="number" />
          <Input label="Speaking" value={form.speaking} onChange={(v) => set('speaking', v)} type="number" />
          <Input label="Expiry Date" value={form.expiry_date} onChange={(v) => set('expiry_date', v)} type="date" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function UploadDocModal({ studentId, onClose, onSuccess }: { studentId: string; onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({ document_type: '', expiry_date: '' });
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('documents').insert({
      student_id: studentId, document_type: form.document_type,
      file_name: fileName || 'document.pdf', file_url: '#',
      expiry_date: form.expiry_date || null, uploaded_by: profile?.id,
    });
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title="Upload Document" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Document Type" value={form.document_type} onChange={(v) => set('document_type', v)} required placeholder="Select type" options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">File</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')} className="text-sm text-gray-500" />
          </div>
        </div>
        <Input label="Expiry Date (optional)" value={form.expiry_date} onChange={(v) => set('expiry_date', v)} type="date" />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.document_type}>{saving ? 'Uploading...' : 'Upload'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditStudentModal({ student, counselors, onClose, onSuccess }: {
  student: Student;
  counselors: Profile[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: student.name, father_name: student.father_name ?? '', gender: student.gender ?? '',
    nationality: student.nationality ?? '', email: student.email ?? '', phone: student.phone ?? '',
    address: student.address ?? '', city: student.city ?? '', country: student.country ?? '',
    date_of_birth: student.date_of_birth ?? '', passport_number: student.passport_number ?? '',
    passport_expiry: student.passport_expiry ?? '', cnic: student.cnic ?? '',
    assigned_counselor_id: student.assigned_counselor_id ?? '',
    gap_explanation: student.gap_explanation ?? '', interview_notes: student.interview_notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('students').update(form).eq('id', student.id);
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title="Edit Student" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" value={form.name} onChange={(v) => set('name', v)} required />
          <Input label="Father's Name" value={form.father_name} onChange={(v) => set('father_name', v)} />
          <Select label="Gender" value={form.gender} onChange={(v) => set('gender', v)} placeholder="Select" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
          <Input label="Nationality" value={form.nationality} onChange={(v) => set('nationality', v)} />
          <Input label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" />
          <Input label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
          <Input label="Date of Birth" value={form.date_of_birth} onChange={(v) => set('date_of_birth', v)} type="date" />
          <Input label="Passport Number" value={form.passport_number} onChange={(v) => set('passport_number', v)} />
          <Input label="Passport Expiry" value={form.passport_expiry} onChange={(v) => set('passport_expiry', v)} type="date" />
          <Input label="CNIC" value={form.cnic} onChange={(v) => set('cnic', v)} />
          <Input label="Address" value={form.address} onChange={(v) => set('address', v)} />
          <Input label="City" value={form.city} onChange={(v) => set('city', v)} />
          <Input label="Country" value={form.country} onChange={(v) => set('country', v)} />
          <Select label="Assigned Counselor" value={form.assigned_counselor_id} onChange={(v) => set('assigned_counselor_id', v)} placeholder="Unassigned" options={counselors.map((c) => ({ value: c.id, label: c.full_name }))} />
        </div>
        <Textarea label="Gap Explanation" value={form.gap_explanation} onChange={(v) => set('gap_explanation', v)} rows={2} />
        <Textarea label="Interview Notes" value={form.interview_notes} onChange={(v) => set('interview_notes', v)} rows={2} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ConvertToApplicationModal({ student, onClose, onSuccess }: {
  student: Student;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { profile } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [form, setForm] = useState({
    country: 'United Kingdom', university_id: '', course: '', intake: '',
    campus: '', tuition_fee: '', deposit: '', priority: 'medium', remarks: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('universities').select('id, name').order('name');
      setUniversities((data as University[]) ?? []);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const appId = generateId('APP');
    const uni = universities.find((u) => u.id === form.university_id);
    const { error: insError } = await supabase.from('applications').insert({
      application_id: appId,
      student_id: student.id,
      university_id: form.university_id || null,
      university_name: uni?.name ?? null,
      course: form.course || null,
      campus: form.campus || null,
      intake: form.intake || null,
      tuition_fee: form.tuition_fee ? Number(form.tuition_fee) : null,
      deposit: form.deposit ? Number(form.deposit) : null,
      priority: form.priority,
      remarks: form.remarks || null,
      status: 'draft',
      created_by: profile?.id,
    });
    if (insError) { setError(insError.message); setSaving(false); return; }
    await supabase.from('students').update({ admission_stage: 'submitted' }).eq('id', student.id);
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title={`Create Application for ${student.name}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Country" value={form.country} onChange={(v) => set('country', v)} />
          <Select label="University" value={form.university_id} onChange={(v) => set('university_id', v)} required placeholder="Select university" options={universities.map((u) => ({ value: u.id, label: u.name }))} />
          <Input label="Course Name" value={form.course} onChange={(v) => set('course', v)} required />
          <Select label="Intake" value={form.intake} onChange={(v) => set('intake', v)} placeholder="Select intake" options={INTAKES.map((i) => ({ value: i, label: i }))} />
          <Input label="Campus" value={form.campus} onChange={(v) => set('campus', v)} />
          <Input label="Tuition Fee" value={form.tuition_fee} onChange={(v) => set('tuition_fee', v)} type="number" />
          <Input label="Deposit" value={form.deposit} onChange={(v) => set('deposit', v)} type="number" />
          <Select label="Priority" value={form.priority} onChange={(v) => set('priority', v)} options={[
            { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
          ]} />
        </div>
        <Textarea label="Remarks" value={form.remarks} onChange={(v) => set('remarks', v)} rows={2} />
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Application'}</Button>
        </div>
      </form>
    </Modal>
  );
}
