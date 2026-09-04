import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, Badge, Select } from '@/components/ui';
import {
  BarChart3, Download, Users, GraduationCap, Wallet,
  Plane, Award, Phone, CheckSquare, UserCheck, FileDown,
  TrendingUp, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const CHART_COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#14b8a6'];

type ReportType = 'overview' | 'leads' | 'applications' | 'revenue' | 'visa' | 'counselor' | 'user_activity';

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, role').eq('is_active', true);
      setUsers(profiles ?? []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = today + 'T00:00:00';
      const endOfDay = today + 'T23:59:59';

      if (reportType === 'overview') {
        const [leadsRes, studentsRes, appsRes, tasksRes, paymentsRes, visasRes, callsTodayRes, tasksTodayRes, appsTodayRes, studentsTodayRes, leadsTodayRes] = await Promise.all([
          supabase.from('leads').select('id', { count: 'exact', head: true }),
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('applications').select('id', { count: 'exact', head: true }),
          supabase.from('tasks').select('id', { count: 'exact', head: true }),
          supabase.from('payments').select('amount').eq('status', 'completed'),
          supabase.from('visas').select('decision'),
          supabase.from('leads').select('id', { count: 'exact', head: true }).eq('call_status', 'connected').gte('updated_at', startOfDay).lte('updated_at', endOfDay),
          supabase.from('tasks').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay).lte('created_at', endOfDay),
          supabase.from('applications').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay).lte('created_at', endOfDay),
          supabase.from('students').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay).lte('created_at', endOfDay),
          supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay).lte('created_at', endOfDay),
        ]);

        const revenue = (paymentsRes.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
        const visaApproved = (visasRes.data ?? []).filter((v) => v.decision === 'approved').length;
        const visaPending = (visasRes.data ?? []).filter((v) => v.decision === 'pending' || !v.decision).length;

        setData({
          stats: [
            { label: 'Total Leads', value: leadsRes.count ?? 0, icon: 'users', color: 'blue' },
            { label: 'Total Students', value: studentsRes.count ?? 0, icon: 'student', color: 'emerald' },
            { label: 'Total Applications', value: appsRes.count ?? 0, icon: 'app', color: 'violet' },
            { label: 'Total Tasks', value: tasksRes.count ?? 0, icon: 'task', color: 'amber' },
            { label: 'Total Revenue', value: `£${revenue.toLocaleString()}`, icon: 'wallet', color: 'green' },
            { label: 'Visas Approved', value: visaApproved, icon: 'plane', color: 'cyan' },
            { label: "Today's Calls (Connected)", value: callsTodayRes.count ?? 0, icon: 'phone', color: 'blue' },
            { label: "Today's New Tasks", value: tasksTodayRes.count ?? 0, icon: 'task', color: 'amber' },
            { label: "Today's Applications", value: appsTodayRes.count ?? 0, icon: 'app', color: 'violet' },
            { label: "Today's New Students", value: studentsTodayRes.count ?? 0, icon: 'student', color: 'emerald' },
            { label: "Today's New Leads", value: leadsTodayRes.count ?? 0, icon: 'users', color: 'blue' },
            { label: 'Visas Pending', value: visaPending, icon: 'plane', color: 'orange' },
          ],
        });
      } else if (reportType === 'leads') {
        let query = supabase.from('leads').select('status, created_at, call_status, lead_source_id');
        if (dateFrom) query = query.gte('created_at', dateFrom);
        if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
        const { data: leads } = await query;
        const byStatus: Record<string, number> = {};
        const byCall: Record<string, number> = {};
        (leads ?? []).forEach((l) => {
          byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
          const cs = l.call_status ?? 'not_called';
          byCall[cs] = (byCall[cs] ?? 0) + 1;
        });
        setData({
          charts: [
            { title: 'Leads by Stage', data: Object.entries(byStatus).map(([name, value]) => ({ name, value })) },
            { title: 'Leads by Call Status', data: Object.entries(byCall).map(([name, value]) => ({ name, value })) },
          ],
        });
      } else if (reportType === 'applications') {
        const { data: apps } = await supabase.from('applications').select('status, university_name');
        const byStatus: Record<string, number> = {};
        const byUni: Record<string, number> = {};
        (apps ?? []).forEach((a) => {
          byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
          if (a.university_name) byUni[a.university_name] = (byUni[a.university_name] ?? 0) + 1;
        });
        setData({
          charts: [
            { title: 'Applications by Status', data: Object.entries(byStatus).map(([name, value]) => ({ name, value })) },
            { title: 'Applications by University', data: Object.entries(byUni).slice(0, 10).map(([name, value]) => ({ name, value })) },
          ],
        });
      } else if (reportType === 'revenue') {
        const { data: payments } = await supabase.from('payments').select('amount, payment_type, status, payment_date');
        const byType: Record<string, number> = {};
        (payments ?? []).filter((p) => p.status === 'completed').forEach((p) => {
          byType[p.payment_type] = (byType[p.payment_type] ?? 0) + Number(p.amount);
        });
        setData({ charts: [{ title: 'Revenue by Type', data: Object.entries(byType).map(([name, value]) => ({ name, value })) }] });
      } else if (reportType === 'visa') {
        const { data: visas } = await supabase.from('visas').select('decision');
        const byDecision: Record<string, number> = { approved: 0, refused: 0, pending: 0 };
        (visas ?? []).forEach((v) => { byDecision[v.decision ?? 'pending']++; });
        setData({ pie: { title: 'Visa Decisions', data: Object.entries(byDecision).map(([name, value]) => ({ name, value })) } });
      } else if (reportType === 'counselor') {
        const [leadsRes, studentsRes, tasksRes, appsRes, counselorsRes] = await Promise.all([
          supabase.from('leads').select('assigned_counselor_id, status, call_status, call_count, created_at, updated_at'),
          supabase.from('students').select('assigned_counselor_id, created_at'),
          supabase.from('tasks').select('assigned_to, status, created_at, completed_at'),
          supabase.from('applications').select('created_by, created_at, status'),
          supabase.from('profiles').select('id, full_name').in('role', ['counselor', 'team_leader']),
        ]);
        const names: Record<string, string> = {};
        (counselorsRes.data ?? []).forEach((c) => { names[c.id] = c.full_name; });

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const perf: Record<string, any> = {};
        const ensure = (cid: string) => {
          if (!perf[cid]) perf[cid] = {
            leadsTotal: 0, leadsContacted: 0, callsTotal: 0,
            callsToday: 0, callsWeek: 0, callsMonth: 0,
            studentsTotal: 0, studentsToday: 0, studentsWeek: 0, studentsMonth: 0,
            appsTotal: 0, appsToday: 0, appsWeek: 0, appsMonth: 0,
            tasksCreatedTotal: 0, tasksCreatedToday: 0, tasksCreatedWeek: 0, tasksCreatedMonth: 0,
            tasksCompletedTotal: 0, tasksCompletedToday: 0, tasksCompletedWeek: 0, tasksCompletedMonth: 0,
          };
        };

        (leadsRes.data ?? []).forEach((l: any) => {
          const cid = l.assigned_counselor_id;
          if (!cid) return;
          ensure(cid);
          perf[cid].leadsTotal++;
          if (l.status !== 'new_lead' && l.status !== 'not_interested' && l.status !== 'lost' && l.status !== 'duplicate') perf[cid].leadsContacted++;
          perf[cid].callsTotal += l.call_count ?? 0;
          const updated = l.updated_at ?? l.created_at;
          if (l.call_status === 'connected') {
            if (updated >= todayStart) perf[cid].callsToday++;
            if (updated >= weekStart) perf[cid].callsWeek++;
            if (updated >= monthStart) perf[cid].callsMonth++;
          }
        });

        (studentsRes.data ?? []).forEach((s: any) => {
          const cid = s.assigned_counselor_id;
          if (!cid) return;
          ensure(cid);
          perf[cid].studentsTotal++;
          const created = s.created_at ?? todayStart;
          if (created >= todayStart) perf[cid].studentsToday++;
          if (created >= weekStart) perf[cid].studentsWeek++;
          if (created >= monthStart) perf[cid].studentsMonth++;
        });

        (appsRes.data ?? []).forEach((a: any) => {
          const cid = a.created_by;
          if (!cid) return;
          ensure(cid);
          perf[cid].appsTotal++;
          const created = a.created_at ?? todayStart;
          if (created >= todayStart) perf[cid].appsToday++;
          if (created >= weekStart) perf[cid].appsWeek++;
          if (created >= monthStart) perf[cid].appsMonth++;
        });

        (tasksRes.data ?? []).forEach((t: any) => {
          const cid = t.assigned_to;
          if (!cid) return;
          ensure(cid);
          perf[cid].tasksCreatedTotal++;
          const created = t.created_at ?? todayStart;
          if (created >= todayStart) perf[cid].tasksCreatedToday++;
          if (created >= weekStart) perf[cid].tasksCreatedWeek++;
          if (created >= monthStart) perf[cid].tasksCreatedMonth++;
          if (t.status === 'completed') {
            perf[cid].tasksCompletedTotal++;
            const completed = t.completed_at ?? t.created_at ?? todayStart;
            if (completed >= todayStart) perf[cid].tasksCompletedToday++;
            if (completed >= weekStart) perf[cid].tasksCompletedWeek++;
            if (completed >= monthStart) perf[cid].tasksCompletedMonth++;
          }
        });

        setData({ counselorCards: Object.entries(perf).map(([id, v]) => ({ name: names[id] ?? 'Unknown', ...v })) });
      } else if (reportType === 'user_activity') {
        let leadQuery = supabase.from('leads').select('id, name, call_status, status, created_at, assigned_counselor_id');
        let taskQuery = supabase.from('tasks').select('id, title, status, created_at, assigned_to, completed_at');
        let appQuery = supabase.from('applications').select('id, application_id, status, created_at, created_by');
        let studentQuery = supabase.from('students').select('id, name, student_id, created_at, assigned_counselor_id');

        if (selectedUser) {
          leadQuery = leadQuery.eq('assigned_counselor_id', selectedUser);
          taskQuery = taskQuery.eq('assigned_to', selectedUser);
          appQuery = appQuery.eq('created_by', selectedUser);
          studentQuery = studentQuery.eq('assigned_counselor_id', selectedUser);
        }
        if (dateFrom) {
          leadQuery = leadQuery.gte('created_at', dateFrom);
          taskQuery = taskQuery.gte('created_at', dateFrom);
          appQuery = appQuery.gte('created_at', dateFrom);
          studentQuery = studentQuery.gte('created_at', dateFrom);
        }
        if (dateTo) {
          const end = dateTo + 'T23:59:59';
          leadQuery = leadQuery.lte('created_at', end);
          taskQuery = taskQuery.lte('created_at', end);
          appQuery = appQuery.lte('created_at', end);
          studentQuery = studentQuery.lte('created_at', end);
        }

        const [leadsData, tasksData, appsData, studentsData] = await Promise.all([leadQuery, taskQuery, appQuery, studentQuery]);

        const todayCalls = (leadsData.data ?? []).filter((l) => l.call_status === 'connected').length;
        const todayApps = (appsData.data ?? []).length;
        const tasksCreated = (tasksData.data ?? []).length;
        const tasksCompleted = (tasksData.data ?? []).filter((t) => t.status === 'completed').length;
        const matureStudents = (studentsData.data ?? []).length;

        setData({
          userStats: [
            { label: 'Calls Connected', value: todayCalls, icon: 'phone' },
            { label: 'Applications Created', value: todayApps, icon: 'app' },
            { label: 'Tasks Created', value: tasksCreated, icon: 'task' },
            { label: 'Tasks Completed', value: tasksCompleted, icon: 'check' },
            { label: 'Mature Students', value: matureStudents, icon: 'student' },
          ],
          userDetails: {
            leads: leadsData.data ?? [],
            tasks: tasksData.data ?? [],
            apps: appsData.data ?? [],
            students: studentsData.data ?? [],
          },
        });
      }
      setLoading(false);
    })();
  }, [reportType, selectedUser, dateFrom, dateTo]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const reportTypes: { key: ReportType; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'leads', label: 'Lead Report', icon: <Users className="w-4 h-4" /> },
    { key: 'applications', label: 'Application Report', icon: <GraduationCap className="w-4 h-4" /> },
    { key: 'revenue', label: 'Revenue Report', icon: <Wallet className="w-4 h-4" /> },
    { key: 'visa', label: 'Visa Report', icon: <Plane className="w-4 h-4" /> },
    { key: 'counselor', label: 'Counselor Report', icon: <Award className="w-4 h-4" /> },
    { key: 'user_activity', label: 'User Activity Report', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const iconMap: Record<string, any> = {
    users: <Users className="w-5 h-5" />,
    student: <UserCheck className="w-5 h-5" />,
    app: <GraduationCap className="w-5 h-5" />,
    task: <CheckSquare className="w-5 h-5" />,
    wallet: <Wallet className="w-5 h-5" />,
    plane: <Plane className="w-5 h-5" />,
    phone: <Phone className="w-5 h-5" />,
    check: <CheckSquare className="w-5 h-5" />,
  };

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="space-y-5">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate, view, and download reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}><FileDown className="w-4 h-4" /> Download PDF</Button>
          <Button variant="outline" onClick={handlePrint}><Download className="w-4 h-4" /> Print</Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap no-print">
        {reportTypes.map((r) => (
          <button key={r.key} onClick={() => setReportType(r.key)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${reportType === r.key ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      {reportType === 'user_activity' && (
        <Card className="p-4 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="User" value={selectedUser} onChange={setSelectedUser} placeholder="All Users" options={users.map((u) => ({ value: u.id, label: u.full_name }))} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </Card>
      )}

      <div ref={printRef}>
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : data ? (
          <>
            {data.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {data.stats.map((s: any, i: number) => (
                  <Card key={i} className="p-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[s.color] ?? 'bg-gray-50 text-gray-600'}`}>
                      {iconMap[s.icon] ?? <BarChart3 className="w-5 h-5" />}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </Card>
                ))}
              </div>
            )}

            {data.userStats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {data.userStats.map((s: any, i: number) => (
                  <Card key={i} className="p-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      {iconMap[s.icon] ?? <BarChart3 className="w-5 h-5" />}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </Card>
                ))}
              </div>
            )}

            {data.userDetails && (
              <div className="space-y-6 mt-4">
                <Card className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-base font-semibold text-gray-900">Leads ({data.userDetails.leads.length})</h3></div>
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Call Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Stage</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.userDetails.leads.slice(0, 20).map((l: any) => (
                        <tr key={l.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{l.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{l.call_status ?? 'not_called'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{l.status}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(l.created_at).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-base font-semibold text-gray-900">Tasks ({data.userDetails.tasks.length})</h3></div>
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.userDetails.tasks.slice(0, 20).map((t: any) => (
                        <tr key={t.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{t.status}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(t.created_at).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-base font-semibold text-gray-900">Applications ({data.userDetails.apps.length})</h3></div>
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">App ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.userDetails.apps.slice(0, 20).map((a: any) => (
                        <tr key={a.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.application_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{a.status}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(a.created_at).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-base font-semibold text-gray-900">Mature Students ({data.userDetails.students.length})</h3></div>
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.userDetails.students.slice(0, 20).map((s: any) => (
                        <tr key={s.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{s.student_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{new Date(s.created_at).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}

            {data.charts && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.charts.map((c: any, i: number) => (
                  <Card key={i} className="p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">{c.title}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={c.data} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="value" fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                ))}
              </div>
            )}

            {data.pie && (
              <Card className="p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">{data.pie.title}</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={data.pie.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={140} label>
                      {data.pie.data.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {data.counselorTable && (
              <div className="space-y-4">
                <Card className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-base font-semibold text-gray-900">Counselor Performance Report</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50">Counselor</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase" colSpan={4}>Calls Made (Connected)</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase" colSpan={2}>Leads</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase" colSpan={4}>Mature Student Apps</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase" colSpan={4}>Tasks Created</th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase" colSpan={4}>Tasks Completed</th>
                        </tr>
                        <tr className="border-b border-gray-100 bg-gray-50/30">
                          <th className="px-3 py-2"></th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Today</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Week</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Month</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Total</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Contacted</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Total</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Today</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Week</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Month</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Total</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Today</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Week</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Month</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Total</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Today</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Week</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Month</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-400">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {data.counselorTable.map((r: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-3 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">{r.name}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.callsToday}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.callsWeek}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.callsMonth}</td>
                            <td className="px-3 py-3 text-sm text-center font-semibold text-gray-900">{r.callsTotal}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.leadsContacted}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.leadsTotal}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.appsToday}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.appsWeek}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.appsMonth}</td>
                            <td className="px-3 py-3 text-sm text-center font-semibold text-gray-900">{r.appsTotal}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.tasksCreatedToday}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.tasksCreatedWeek}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.tasksCreatedMonth}</td>
                            <td className="px-3 py-3 text-sm text-center font-semibold text-gray-900">{r.tasksCreatedTotal}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.tasksCompletedToday}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.tasksCompletedWeek}</td>
                            <td className="px-3 py-3 text-sm text-center text-gray-600">{r.tasksCompletedMonth}</td>
                            <td className="px-3 py-3 text-sm text-center font-semibold text-gray-900">{r.tasksCompletedTotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
