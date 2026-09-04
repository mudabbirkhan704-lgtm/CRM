import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui';
import {
  Users, UserCheck, GraduationCap, FileText, Plane, Wallet,
  TrendingUp, Clock, AlertCircle, Award,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Stats {
  totalLeads: number;
  todayLeads: number;
  weeklyLeads: number;
  monthlyLeads: number;
  matureStudents: number;
  activeApplications: number;
  offerLetters: number;
  casReceived: number;
  visaSubmitted: number;
  visaApproved: number;
  visaRefused: number;
  studentsEnrolled: number;
  revenue: number;
  pendingPayments: number;
  commissionReceived: number;
}

const CHART_COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#14b8a6', '#64748b', '#a855f7'];

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leadsBySource, setLeadsBySource] = useState<{ name: string; value: number }[]>([]);
  const [appsByUniversity, setAppsByUniversity] = useState<{ name: string; value: number }[]>([]);
  const [appsByCountry, setAppsByCountry] = useState<{ name: string; value: number }[]>([]);
  const [counselorPerf, setCounselorPerf] = useState<{ name: string; leads: number; converted: number }[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [monthlyAdmissions, setMonthlyAdmissions] = useState<{ month: string; count: number }[]>([]);
  const [studentStatus, setStudentStatus] = useState<{ name: string; value: number }[]>([]);
  const [visaStats, setVisaStats] = useState<{ approved: number; refused: number; pending: number }>({ approved: 0, refused: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

      const [leadsRes, studentsRes, appsRes, paymentsRes, visasRes] = await Promise.all([
        supabase.from('leads').select('id, status, lead_source_id, created_at, assigned_counselor_id'),
        supabase.from('students').select('id, status, assigned_counselor_id, created_at'),
        supabase.from('applications').select('id, status, university_name, student_id, created_at'),
        supabase.from('payments').select('id, amount, payment_type, status, payment_date'),
        supabase.from('visas').select('id, decision'),
      ]);

      const leads = leadsRes.data ?? [];
      const students = studentsRes.data ?? [];
      const apps = appsRes.data ?? [];
      const payments = paymentsRes.data ?? [];
      const visas = visasRes.data ?? [];

      const totalLeads = leads.length;
      const todayLeads = leads.filter((l) => new Date(l.created_at) >= new Date(todayStart)).length;
      const weeklyLeads = leads.filter((l) => new Date(l.created_at) >= new Date(weekAgo)).length;
      const monthlyLeads = leads.filter((l) => new Date(l.created_at) >= new Date(monthAgo)).length;
      const matureStudents = students.length;
      const activeApplications = apps.filter((a) => !['student_enrolled', 'cancelled'].includes(a.status)).length;
      const offerLetters = apps.filter((a) => ['conditional_offer', 'unconditional_offer'].includes(a.status)).length;
      const casReceived = apps.filter((a) => a.status === 'cas_received').length;
      const visaSubmitted = apps.filter((a) => a.status === 'visa_submitted').length;
      const visaApproved = apps.filter((a) => a.status === 'visa_approved').length;
      const visaRefused = apps.filter((a) => a.status === 'visa_refused').length;
      const studentsEnrolled = apps.filter((a) => a.status === 'student_enrolled').length;

      const revenue = payments.filter((p) => p.payment_type === 'student_payment' && p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
      const pendingPayments = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
      const commissionReceived = payments.filter((p) => p.payment_type === 'commission' && p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);

      setStats({
        totalLeads, todayLeads, weeklyLeads, monthlyLeads, matureStudents,
        activeApplications, offerLetters, casReceived, visaSubmitted,
        visaApproved, visaRefused, studentsEnrolled, revenue, pendingPayments, commissionReceived,
      });

      // Leads by source
      const sourceMap: Record<string, number> = {};
      const sourcesRes = await supabase.from('lead_sources').select('id, name');
      const sourceNames: Record<string, string> = {};
      (sourcesRes.data ?? []).forEach((s) => { sourceNames[s.id] = s.name; });
      leads.forEach((l) => {
        const name = l.lead_source_id ? (sourceNames[l.lead_source_id] ?? 'Unknown') : 'Unknown';
        sourceMap[name] = (sourceMap[name] ?? 0) + 1;
      });
      setLeadsBySource(Object.entries(sourceMap).map(([name, value]) => ({ name, value })));

      // Apps by university
      const uniMap: Record<string, number> = {};
      apps.forEach((a) => {
        const name = a.university_name ?? 'Unknown';
        uniMap[name] = (uniMap[name] ?? 0) + 1;
      });
      setAppsByUniversity(Object.entries(uniMap).slice(0, 8).map(([name, value]) => ({ name, value })));

      // Student status distribution
      const statusMap: Record<string, number> = {};
      students.forEach((s) => {
        statusMap[s.status] = (statusMap[s.status] ?? 0) + 1;
      });
      setStudentStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

      // Visa stats
      setVisaStats({
        approved: visas.filter((v) => v.decision === 'approved').length,
        refused: visas.filter((v) => v.decision === 'refused').length,
        pending: visas.filter((v) => !v.decision || v.decision === 'pending').length,
      });

      // Monthly revenue (last 6 months)
      const months: { month: string; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = d.toISOString();
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
        const rev = payments
          .filter((p) => p.payment_type === 'student_payment' && p.status === 'completed' && p.payment_date >= monthStart && p.payment_date < monthEnd)
          .reduce((s, p) => s + Number(p.amount), 0);
        months.push({ month: d.toLocaleString('en-GB', { month: 'short' }), revenue: rev });
      }
      setMonthlyRevenue(months);

      // Monthly admissions
      const admissions: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = d.toISOString();
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
        const count = apps.filter((a) => a.created_at >= monthStart && a.created_at < monthEnd).length;
        admissions.push({ month: d.toLocaleString('en-GB', { month: 'short' }), count });
      }
      setMonthlyAdmissions(admissions);

      // Counselor performance
      const counselorsRes = await supabase.from('profiles').select('id, full_name').in('role', ['counselor', 'team_leader']);
      const counselorNames: Record<string, string> = {};
      (counselorsRes.data ?? []).forEach((c) => { counselorNames[c.id] = c.full_name; });
      const perfMap: Record<string, { leads: number; converted: number }> = {};
      leads.forEach((l) => {
        const cid = l.assigned_counselor_id;
        if (!cid) return;
        if (!perfMap[cid]) perfMap[cid] = { leads: 0, converted: 0 };
        perfMap[cid].leads++;
        if (l.status === 'converted') perfMap[cid].converted++;
      });
      setCounselorPerf(Object.entries(perfMap).map(([id, v]) => ({ name: counselorNames[id] ?? 'Unknown', ...v })));

      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
    { label: "Today's Leads", value: stats.todayLeads, icon: <Clock className="w-5 h-5" />, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Weekly Leads', value: stats.weeklyLeads, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-teal-50 text-teal-600' },
    { label: 'Monthly Leads', value: stats.monthlyLeads, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Mature Students', value: stats.matureStudents, icon: <UserCheck className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Active Applications', value: stats.activeApplications, icon: <GraduationCap className="w-5 h-5" />, color: 'bg-violet-50 text-violet-600' },
    { label: 'Offer Letters', value: stats.offerLetters, icon: <FileText className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
    { label: 'CAS Received', value: stats.casReceived, icon: <Award className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
    { label: 'Visa Submitted', value: stats.visaSubmitted, icon: <Plane className="w-5 h-5" />, color: 'bg-sky-50 text-sky-600' },
    { label: 'Visa Approved', value: stats.visaApproved, icon: <Plane className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Visa Refused', value: stats.visaRefused, icon: <AlertCircle className="w-5 h-5" />, color: 'bg-red-50 text-red-600' },
    { label: 'Students Enrolled', value: stats.studentsEnrolled, icon: <UserCheck className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Revenue', value: `£${stats.revenue.toLocaleString()}`, icon: <Wallet className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
    { label: 'Pending Payments', value: `£${stats.pendingPayments.toLocaleString()}`, icon: <Clock className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600' },
    { label: 'Commission', value: `£${stats.commissionReceived.toLocaleString()}`, icon: <Award className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your consultancy performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((card) => (
          <Card key={card.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Leads by Source</h3>
          {leadsBySource.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={leadsBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
                  {leadsBySource.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Applications by University</h3>
          {appsByUniversity.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={appsByUniversity} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => `£${Number(v).toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Admissions</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyAdmissions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Counselor Performance</h3>
          {counselorPerf.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={counselorPerf}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="leads" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="converted" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Student Status</h3>
          {studentStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={studentStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
                  {studentStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Visa Success Rate</h3>
          {visaStats.approved + visaStats.refused + visaStats.pending > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Approved', value: visaStats.approved },
                    { name: 'Refused', value: visaStats.refused },
                    { name: 'Pending', value: visaStats.pending },
                  ]}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </Card>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
      No data available yet
    </div>
  );
}
