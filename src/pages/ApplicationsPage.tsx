import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  APPLICATION_STATUSES, APPLICATION_STATUS_LABELS, APP_STATUS_COLORS,
  APPLICATION_STAGE_PROGRESS,
  INTAKES, PRIORITY_COLORS, DOCUMENT_TYPES,
} from '@/lib/constants';
import type { Application, ApplicationStatus, Student, University, Profile, Document } from '@/lib/types';
import { generateId, formatDate, cn, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Select, Textarea, Modal, Badge, Card, EmptyState, Avatar } from '@/components/ui';
import { TasksTab } from '@/components/TasksTab';
import { NotesThread } from '@/components/NotesThread';
import { ActivityTimeline, logActivity } from '@/components/ActivityTimeline';
import {
  GraduationCap, Search, Plus, ChevronLeft, ChevronRight,
  FileText, Upload, Pencil, Trash2, X, Filter, CheckCircle2,
  Building2, BookOpen, Calendar, User, Hash, Wallet, Award, MapPin,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const CHART_COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#14b8a6'];

export function ApplicationsPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [counselors, setCounselors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [counselorFilter, setCounselorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const pageSize = 20;

  const fetchApps = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('applications').select('*', { count: 'exact' });
    if (search) query = query.or(`application_id.ilike.%${search}%`);
    if (stageFilter) query = query.eq('status', stageFilter);
    if (counselorFilter) query = query.eq('created_by', counselorFilter);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
    query = query.order('created_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
    const { data, count } = await query;
    setApps((data as Application[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [search, stageFilter, counselorFilter, dateFrom, dateTo, page]);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase.from('applications').select('status');
    const counts: Record<string, number> = {};
    (data ?? []).forEach((a: any) => { counts[a.status] = (counts[a.status] ?? 0) + 1; });
    setStats(counts);
  }, []);

  useEffect(() => {
    (async () => {
      const [stuRes, couRes] = await Promise.all([
        supabase.from('students').select('id, name, student_id'),
        supabase.from('profiles').select('*').in('role', ['counselor', 'team_leader', 'branch_manager', 'super_admin']),
      ]);
      setStudents((stuRes.data as Student[]) ?? []);
      setCounselors((couRes.data as Profile[]) ?? []);
    })();
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? 'Unknown';
  const studentNumber = (id: string) => students.find((s) => s.id === id)?.student_id ?? '—';
  const counselorName = (id: string | null) => counselors.find((c) => c.id === id)?.full_name ?? '—';

  const hasFilters = stageFilter || counselorFilter || dateFrom || dateTo;
  const clearFilters = () => { setStageFilter(''); setCounselorFilter(''); setDateFrom(''); setDateTo(''); };

  const pieData = APPLICATION_STATUSES.map((s) => ({ name: APPLICATION_STATUS_LABELS[s], value: stats[s] ?? 0 })).filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total applications</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Application</Button>
      </div>

      {/* Stats cards + pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {APPLICATION_STATUSES.filter((s) => s !== 'lost').map((s) => (
            <Card key={s} className="p-4">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-2', APP_STATUS_COLORS[s])}>
                <GraduationCap className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats[s] ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">{APPLICATION_STATUS_LABELS[s]}</p>
            </Card>
          ))}
        </div>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Stage Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by application ID..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" size="md" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" /> Filters
            {hasFilters ? <span className="w-2 h-2 bg-blue-500 rounded-full" /> : null}
          </Button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Stage</label>
              <select value={stageFilter} onChange={(e) => { setStageFilter(e.target.value); setPage(0); }} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Stages</option>
                {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>)}
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
            {hasFilters && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}><X className="w-3.5 h-3.5" /> Clear Filters</Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : apps.length === 0 ? (
          <EmptyState icon={<GraduationCap className="w-7 h-7" />} title="No applications found" description="Create an application for a student." action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Application</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">App ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">University</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Intake</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {apps.map((a) => (
                  <tr key={a.id} onClick={() => navigate(`/applications/${a.id}`)} className="hover:bg-gray-50/50 cursor-pointer transition">
                    <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900">{a.application_id}</span></td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 font-medium">{studentName(a.student_id)}</p>
                      <p className="text-xs text-gray-400">{studentNumber(a.student_id)}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm text-gray-600">{a.university_name ?? '—'}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-gray-600">{a.course ?? '—'}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-gray-600">{a.intake ?? '—'}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-gray-600">{counselorName(a.created_by)}</span></td>
                    <td className="px-4 py-3"><Badge className={PRIORITY_COLORS[a.priority]}>{a.priority}</Badge></td>
                    <td className="px-4 py-3"><Badge className={APP_STATUS_COLORS[a.status]}>{APPLICATION_STATUS_LABELS[a.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && apps.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </Card>

      {showCreate && <AppFormModal students={students} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchApps(); fetchStats(); }} />}
    </div>
  );
}

// Map application status -> admission stage for auto-update
const APP_TO_STUDENT_STAGE: Record<ApplicationStatus, string> = {
  draft: 'draft',
  submitted: 'submitted',
  col: 'offered',
  uol: 'offered',
  deposited: 'deposited',
  cas: 'cas',
  visa: 'visa',
  enrolled: 'enrolment',
  lost: 'lost',
};

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [counselors, setCounselors] = useState<Profile[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [docs, setDocs] = useState<Document[]>([]);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveIndicator, setSaveIndicator] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'tasks' | 'notes' | 'activity'>('details');

  const fetchApp = useCallback(async () => {
    const [appRes, uniRes, couRes] = await Promise.all([
      supabase.from('applications').select('*').eq('id', id).maybeSingle(),
      supabase.from('universities').select('id, name').order('name'),
      supabase.from('profiles').select('*').in('role', ['counselor', 'team_leader', 'branch_manager', 'super_admin']),
    ]);
    setApp(appRes.data as Application | null);
    setUniversities((uniRes.data as University[]) ?? []);
    setCounselors((couRes.data as Profile[]) ?? []);
    if (appRes.data) {
      const { data: stuData } = await supabase.from('students').select('*').eq('id', (appRes.data as any).student_id).maybeSingle();
      setStudent(stuData as Student | null);
    }
    const { data: docData } = await supabase.from('documents').select('*').eq('application_id', id).order('created_at', { ascending: false });
    setDocs((docData as Document[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchApp(); }, [fetchApp]);

  const showSaved = () => { setSaveIndicator('Saved'); setTimeout(() => setSaveIndicator(null), 1500); };

  const handleStageChange = async (newStatus: ApplicationStatus) => {
    if (!app || !id) return;
    setApp({ ...app, status: newStatus });
    const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', id);
    if (error) { setSaveIndicator('Error saving'); setTimeout(() => setSaveIndicator(null), 2000); return; }
    await logActivity({ applicationId: id, activityType: 'stage_change', description: `Application stage changed to ${APPLICATION_STATUS_LABELS[newStatus]}`, performedBy: profile?.id });

    // Auto-update student admission stage
    const newStudentStage = APP_TO_STUDENT_STAGE[newStatus];
    if (student && newStudentStage) {
      await supabase.from('students').update({ admission_stage: newStudentStage }).eq('id', student.id);
    }
    showSaved();
  };

  const handleDelete = async () => {
    if (!app || !confirm('Delete this application?')) return;
    await supabase.from('applications').delete().eq('id', id);
    navigate('/applications');
  };

  const handleActivityFromChild = async (description: string) => {
    await logActivity({ applicationId: id, activityType: 'task', description, performedBy: profile?.id });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!app) return <div className="text-center py-20 text-gray-500">Application not found. <button onClick={() => navigate('/applications')} className="text-blue-600 underline">Back to applications</button></div>;

  const progress = app.status === 'lost' ? 0 : APPLICATION_STAGE_PROGRESS[app.status];
  const isLost = app.status === 'lost';
  const counselorName = counselors.find((c) => c.id === app.created_by)?.full_name ?? '—';

  const tabs = [
    { key: 'details' as const, label: 'Details', icon: <FileText className="w-4 h-4" /> },
    { key: 'documents' as const, label: 'Documents', icon: <Upload className="w-4 h-4" /> },
    { key: 'tasks' as const, label: 'Tasks', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'notes' as const, label: 'Notes', icon: <FileText className="w-4 h-4" /> },
    { key: 'activity' as const, label: 'Activity', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Top nav */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/applications')}>
          <ChevronLeft className="w-4 h-4" /> Back to Applications
        </Button>
        <div className="flex items-center gap-3">
          {saveIndicator && <span className="text-xs text-emerald-600 font-medium">{saveIndicator}</span>}
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Fancy header with university, course, app number, assigned user */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{app.university_name ?? '—'}</h1>
              <p className="text-sm text-gray-600 mt-0.5">{app.course ?? '—'}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-gray-500"><Hash className="w-3 h-3" /> {app.application_id}</span>
                <span className="flex items-center gap-1 text-xs text-gray-500"><User className="w-3 h-3" /> {counselorName}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{student?.name ?? '—'}</p>
            <p className="text-xs text-gray-400">{student?.student_id ?? '—'}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Progress</span>
            <span className={cn('text-sm font-bold', isLost ? 'text-red-600' : 'text-blue-600')}>
              {isLost ? 'Lost' : `${progress}%`}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', isLost ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-emerald-500')}
              style={{ width: `${isLost ? 100 : progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Stage tracker — compact */}
      <Card className="p-4">
        <p className="text-xs font-medium text-gray-500 mb-2">Application Stage</p>
        <div className="flex flex-wrap gap-1.5">
          {APPLICATION_STATUSES.map((s) => {
            const stageIdx = APPLICATION_STATUSES.indexOf(s);
            const currentIdx = APPLICATION_STATUSES.indexOf(app.status);
            const isPassed = !isLost && stageIdx < currentIdx && s !== 'lost';
            const isCurrent = app.status === s;
            return (
              <button
                key={s}
                onClick={() => handleStageChange(s)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1',
                  isCurrent
                    ? APP_STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-blue-300'
                    : isPassed
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                )}
              >
                {isPassed && <CheckCircle2 className="w-3 h-3" />}
                {APPLICATION_STATUS_LABELS[s]}
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
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap',
              activeTab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Application Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailField icon={<User className="w-4 h-4" />} label="Student" value={student?.name ?? '—'} />
            <DetailField icon={<Hash className="w-4 h-4" />} label="Student Number" value={student?.student_id ?? '—'} />
            <DetailField icon={<Building2 className="w-4 h-4" />} label="University" value={app.university_name ?? '—'} />
            <DetailField icon={<BookOpen className="w-4 h-4" />} label="Course" value={app.course ?? '—'} />
            <DetailField icon={<MapPin className="w-4 h-4" />} label="Campus" value={app.campus ?? '—'} />
            <DetailField icon={<Calendar className="w-4 h-4" />} label="Intake" value={app.intake ?? '—'} />
            {app.tuition_fee != null && <DetailField icon={<Wallet className="w-4 h-4" />} label="Tuition Fee" value={formatCurrency(app.tuition_fee)} />}
            {app.deposit != null && <DetailField icon={<Wallet className="w-4 h-4" />} label="Deposit" value={formatCurrency(app.deposit)} />}
            {app.scholarship && <DetailField icon={<Award className="w-4 h-4" />} label="Scholarship" value={app.scholarship} />}
            <DetailField icon={<Calendar className="w-4 h-4" />} label="Application Date" value={formatDate(app.application_date)} />
          </div>
          {app.remarks && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">Remarks</p>
              <p className="text-sm text-gray-700">{app.remarks}</p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card className="p-5">
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
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'tasks' && <TasksTab applicationId={app.id} onActivity={handleActivityFromChild} />}
      {activeTab === 'notes' && <NotesThread applicationId={app.id} onActivity={handleActivityFromChild} />}
      {activeTab === 'activity' && <ActivityTimeline applicationId={app.id} />}

      {showEdit && <AppFormModal app={app} universities={universities} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); fetchApp(); }} />}
      {showUploadDoc && <UploadDocModal appId={app.id} onClose={() => setShowUploadDoc(false)} onSuccess={() => { setShowUploadDoc(false); fetchApp(); }} />}
    </div>
  );
}

function DetailField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <div className="text-gray-400 mt-0.5">{icon}</div>}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export function ApplicationsTab({ studentId }: { studentId: string }) {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('applications').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
    setApps((data as Application[]) ?? []);
  }, [studentId]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Applications</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Add Application</Button>
      </div>
      {apps.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">No applications yet.</p>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} onClick={() => navigate(`/applications/${a.id}`)} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.university_name ?? '—'}</p>
                  <p className="text-xs text-gray-500">{a.course ?? '—'} · {a.intake ?? '—'}</p>
                </div>
              </div>
              <Badge className={APP_STATUS_COLORS[a.status]}>{APPLICATION_STATUS_LABELS[a.status]}</Badge>
            </div>
          ))}
        </div>
      )}
      {showCreate && <AppFormModal studentId={studentId} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetch(); }} />}
    </Card>
  );
}

function AppFormModal({ students, studentId, app, universities, onClose, onSuccess }: {
  students?: Student[];
  studentId?: string;
  app?: Application;
  universities?: University[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { profile } = useAuth();
  const [unis, setUnis] = useState<University[]>(universities ?? []);
  const [form, setForm] = useState({
    student_id: app?.student_id ?? studentId ?? '', university_id: '', course: app?.course ?? '',
    campus: app?.campus ?? '', intake: app?.intake ?? '', tuition_fee: app?.tuition_fee?.toString() ?? '',
    scholarship: app?.scholarship ?? '', deposit: app?.deposit?.toString() ?? '',
    priority: app?.priority ?? 'medium', remarks: app?.remarks ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!universities) {
      (async () => {
        const { data } = await supabase.from('universities').select('id, name').order('name');
        setUnis((data as University[]) ?? []);
      })();
    }
  }, [universities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const uni = unis.find((u) => u.id === form.university_id);
    if (app) {
      await supabase.from('applications').update({
        university_id: form.university_id || null,
        university_name: uni?.name ?? null,
        course: form.course || null,
        campus: form.campus || null,
        intake: form.intake || null,
        tuition_fee: form.tuition_fee ? Number(form.tuition_fee) : null,
        scholarship: form.scholarship || null,
        deposit: form.deposit ? Number(form.deposit) : null,
        priority: form.priority,
        remarks: form.remarks || null,
      }).eq('id', app.id);
    } else {
      const appId = generateId('APP');
      await supabase.from('applications').insert({
        application_id: appId,
        student_id: form.student_id,
        university_id: form.university_id || null,
        university_name: uni?.name ?? null,
        course: form.course || null,
        campus: form.campus || null,
        intake: form.intake || null,
        tuition_fee: form.tuition_fee ? Number(form.tuition_fee) : null,
        scholarship: form.scholarship || null,
        deposit: form.deposit ? Number(form.deposit) : null,
        priority: form.priority,
        remarks: form.remarks || null,
        status: 'draft',
        created_by: profile?.id,
      });
    }
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title={app ? 'Edit Application' : 'New Application'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!studentId && !app && (
          <Select label="Student" value={form.student_id} onChange={(v) => set('student_id', v)} required placeholder="Select student" options={(students ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.student_id})` }))} />
        )}
        <Select label="University" value={form.university_id} onChange={(v) => set('university_id', v)} required placeholder="Select university" options={unis.map((u) => ({ value: u.id, label: u.name }))} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Course" value={form.course} onChange={(v) => set('course', v)} required />
          <Input label="Campus" value={form.campus} onChange={(v) => set('campus', v)} />
          <Select label="Intake" value={form.intake} onChange={(v) => set('intake', v)} placeholder="Select intake" options={INTAKES.map((i) => ({ value: i, label: i }))} />
          <Select label="Priority" value={form.priority} onChange={(v) => set('priority', v)} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
          <Input label="Tuition Fee" value={form.tuition_fee} onChange={(v) => set('tuition_fee', v)} type="number" />
          <Input label="Deposit" value={form.deposit} onChange={(v) => set('deposit', v)} type="number" />
          <Input label="Scholarship" value={form.scholarship} onChange={(v) => set('scholarship', v)} />
        </div>
        <Textarea label="Remarks" value={form.remarks} onChange={(v) => set('remarks', v)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : app ? 'Save Changes' : 'Create Application'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function UploadDocModal({ appId, onClose, onSuccess }: { appId: string; onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({ document_type: '', expiry_date: '' });
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('documents').insert({
      document_type: form.document_type, file_name: fileName || 'document.pdf', file_url: '#',
      expiry_date: form.expiry_date || null, uploaded_by: profile?.id, application_id: appId,
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
