import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS,
  CALL_STATUSES, CALL_STATUS_LABELS, CALL_STATUS_COLORS,
  COUNTRIES, INTAKES, STUDY_LEVELS,
  LEAD_LABELS, LEAD_LABEL_COLORS, ENGLISH_TEST_TYPES,
} from '@/lib/constants';
import type { Lead, LeadStatus, CallStatus, LeadSource, Profile, Student, Task } from '@/lib/types';
import { generateId, formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Select, Textarea, Modal, Badge, Card, EmptyState, Avatar } from '@/components/ui';
import { NotesThread } from '@/components/NotesThread';
import { ActivityTimeline, logActivity } from '@/components/ActivityTimeline';
import {
  Plus, Search, Users, Filter, Download, Upload,
  Phone, Mail, Calendar, ChevronLeft, ChevronRight, ArrowRight,
  FileSpreadsheet, CheckCircle2, Check, Pencil, Trash2, X, AlertTriangle,
  MessageCircle, PhoneCall, StickyNote, Activity, LayoutList, ClipboardList, LayoutGrid, List,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [counselors, setCounselors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [callStatusFilter, setCallStatusFilter] = useState<string>('');
  const [counselorFilter, setCounselorFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [labelFilter, setLabelFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => {
    return localStorage.getItem('leadsViewMode') === 'cards' ? 'cards' : 'list';
  });
  const pageSize = 20;

  const fetchLeads = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    let query = supabase.from('leads').select('*', { count: 'exact' }).neq('status', 'converted');
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    if (statusFilter) query = query.eq('status', statusFilter);
    if (callStatusFilter) query = query.eq('call_status', callStatusFilter);
    if (counselorFilter) query = query.eq('assigned_counselor_id', counselorFilter);
    if (labelFilter) query = query.contains('labels', [labelFilter]);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
    query = query.order('created_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
    const { data, count } = await query;
    setLeads((data as Lead[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [search, statusFilter, callStatusFilter, counselorFilter, labelFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    (async () => {
      const [srcRes, couRes] = await Promise.all([
        supabase.from('lead_sources').select('*').eq('is_active', true),
        supabase.from('profiles').select('*').in('role', ['counselor', 'team_leader', 'branch_manager', 'super_admin']),
      ]);
      setSources((srcRes.data as LeadSource[]) ?? []);
      setCounselors((couRes.data as Profile[]) ?? []);
    })();
  }, []);

  useEffect(() => { fetchLeads(true); }, [fetchLeads]);

  useEffect(() => {
    localStorage.setItem('leadsViewMode', viewMode);
  }, [viewMode]);

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
    await supabase.from('leads').delete().eq('id', lead.id);
    fetchLeads();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || !confirm(`Delete ${selectedIds.size} leads?`)) return;
    await supabase.from('leads').delete().in('id', [...selectedIds]);
    setSelectedIds(new Set());
    fetchLeads();
  };

  const handleBulkAssign = async (counselorId: string) => {
    if (selectedIds.size === 0) return;
    await supabase.from('leads').update({ assigned_counselor_id: counselorId }).in('id', [...selectedIds]);
    setSelectedIds(new Set());
    fetchLeads();
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(leads.map((l) => l.id)));
  };

  const counselorName = (id: string | null) => counselors.find((c) => c.id === id)?.full_name ?? 'Unassigned';

  const clearFilters = () => {
    setStatusFilter(''); setCallStatusFilter(''); setCounselorFilter(''); setLabelFilter(''); setDateFrom(''); setDateTo('');
  };

  const hasFilters = statusFilter || callStatusFilter || counselorFilter || labelFilter || dateFrom || dateTo;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
            <Upload className="w-4 h-4" /> Bulk Upload
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Lead
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button type="button" onClick={() => setViewMode('list')} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition', viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                <List className="w-3.5 h-3.5" /> List
              </button>
              <button type="button" onClick={() => setViewMode('cards')} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition', viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                <LayoutGrid className="w-3.5 h-3.5" /> Cards
              </button>
            </div>
            <Button variant="outline" size="md" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" /> Filters
              {hasFilters ? <span className="w-2 h-2 bg-blue-500 rounded-full" /> : null}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Stage</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stages</option>
                {LEAD_STATUSES.filter((s) => s !== 'converted').map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Call Status</label>
              <select
                value={callStatusFilter}
                onChange={(e) => { setCallStatusFilter(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Call Statuses</option>
                {CALL_STATUSES.map((s) => <option key={s} value={s}>{CALL_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Assigned User</label>
              <select
                value={counselorFilter}
                onChange={(e) => { setCounselorFilter(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Users</option>
                {counselors.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
              <select
                value={labelFilter}
                onChange={(e) => { setLabelFilter(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Labels</option>
                {LEAD_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {hasFilters ? (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
            <select
              onChange={(e) => { if (e.target.value) handleBulkAssign(e.target.value); e.target.value = ''; }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Assign to...</option>
              {counselors.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>Delete Selected</Button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="No leads found"
            description="Create your first lead to get started."
            action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Lead</Button>}
          />
        ) : (
          viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={selectedIds.size === leads.length && leads.length > 0} onChange={toggleSelectAll} className="rounded" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Call</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} counselorName={counselorName} onRowClick={`/leads/${lead.id}`} selected={selectedIds.has(lead.id)} onToggleSelect={toggleSelect} />
                ))}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {leads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} counselorName={counselorName} onRowClick={`/leads/${lead.id}`} selected={selectedIds.has(lead.id)} onToggleSelect={toggleSelect} />
              ))}
            </div>
          )
        )}

        {!loading && leads.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {showCreate && (
        <LeadFormModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchLeads(); }}
          sources={sources}
          counselors={counselors}
        />
      )}

      {showBulkUpload && (
        <BulkUploadModal
          sources={sources}
          counselors={counselors}
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => { setShowBulkUpload(false); fetchLeads(); }}
        />
      )}
    </div>
  );
}

function LeadRow({ lead, counselorName, onRowClick, selected, onToggleSelect }: {
  lead: Lead;
  counselorName: (id: string | null) => string;
  onRowClick: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <tr className="hover:bg-gray-50/50 transition cursor-pointer" onClick={() => navigate(onRowClick)}>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect(lead.id)} className="rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={lead.name} />
          <div>
            <p className="text-sm font-medium text-gray-900">{lead.name}</p>
            <p className="text-xs text-gray-400">{lead.lead_id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-600">{lead.phone ?? '—'}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-600">{lead.email ?? '—'}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">{counselorName(lead.assigned_counselor_id)}</span>
      </td>
      <td className="px-4 py-3">
        <Badge className={LEAD_STATUS_COLORS[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
      </td>
      <td className="px-4 py-3">
        <Badge className={CALL_STATUS_COLORS[(lead.call_status ?? 'not_called') as CallStatus]}>
          {CALL_STATUS_LABELS[(lead.call_status ?? 'not_called') as CallStatus]}
        </Badge>
      </td>
    </tr>
  );
}

function LeadCard({ lead, counselorName, onRowClick, selected, onToggleSelect }: {
  lead: Lead;
  counselorName: (id: string | null) => string;
  onRowClick: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4 cursor-pointer transition hover:shadow-md hover:border-blue-200',
        selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
      )}
      onClick={() => navigate(onRowClick)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => { e.stopPropagation(); onToggleSelect(lead.id); }}
            onClick={(e) => e.stopPropagation()}
            className="rounded shrink-0"
          />
          <Avatar name={lead.name} className="w-10 h-10 text-sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
            <p className="text-xs text-gray-400">{lead.lead_id}</p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {lead.phone && (
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-gray-400" /> {lead.phone}
          </p>
        )}
        {lead.email && (
          <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate">
            <Mail className="w-3 h-3 text-gray-400 shrink-0" /> <span className="truncate">{lead.email}</span>
          </p>
        )}
        <p className="text-xs text-gray-500">
          Assigned: <span className="font-medium text-gray-700">{counselorName(lead.assigned_counselor_id)}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
        <Badge className={LEAD_STATUS_COLORS[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
        <Badge className={CALL_STATUS_COLORS[(lead.call_status ?? 'not_called') as CallStatus]}>
          {CALL_STATUS_LABELS[(lead.call_status ?? 'not_called') as CallStatus]}
        </Badge>
        {lead.labels?.[0] && (
          <Badge className={LEAD_LABEL_COLORS[lead.labels[0]] ?? 'bg-gray-100 text-gray-700 border-gray-200'}>
            {lead.labels[0]}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [counselors, setCounselors] = useState<Profile[]>([]);
  const [allLeadIds, setAllLeadIds] = useState<string[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [leadTasks, setLeadTasks] = useState<Task[]>([]);
  const [taskAssignees, setTaskAssignees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveIndicator, setSaveIndicator] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'activity'>('details');

  const fetchLead = useCallback(async () => {
    const [leadRes, srcRes, couRes] = await Promise.all([
      supabase.from('leads').select('*').eq('id', id).maybeSingle(),
      supabase.from('lead_sources').select('*').eq('is_active', true),
      supabase.from('profiles').select('*').in('role', ['counselor', 'team_leader', 'branch_manager', 'super_admin']),
    ]);
    setLead(leadRes.data as Lead | null);
    setSources((srcRes.data as LeadSource[]) ?? []);
    setCounselors((couRes.data as Profile[]) ?? []);
    setLoading(false);
  }, [id]);

  const fetchLeadTasks = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('related_lead_id', id)
      .order('due_date', { ascending: true, nullsFirst: false });
    setLeadTasks((data as Task[]) ?? []);
  }, [id]);

  useEffect(() => {
    supabase.from('profiles').select('*').eq('is_active', true).then(({ data }) => {
      setTaskAssignees((data as Profile[]) ?? []);
    });
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('leads').select('id').neq('status', 'converted').order('created_at', { ascending: false });
      setAllLeadIds((data ?? []).map((r: any) => r.id));
    })();
  }, []);

  useEffect(() => { fetchLead(); }, [fetchLead]);
  useEffect(() => { fetchLeadTasks(); }, [fetchLeadTasks]);

  const showSaved = () => {
    setSaveIndicator('Saved');
    setTimeout(() => setSaveIndicator(null), 1500);
  };

  const handleStageChange = async (newStatus: LeadStatus) => {
    if (!lead || !id) return;
    setLead({ ...lead, status: newStatus });
    await supabase.from('leads').update({ status: newStatus }).eq('id', id);
    await logActivity({ leadId: id, activityType: 'status_change', description: `Lead stage changed to ${LEAD_STATUS_LABELS[newStatus]}`, performedBy: profile?.id });
    showSaved();
  };

  const handleCallStatusChange = async (newCallStatus: CallStatus) => {
    if (!lead || !id) return;
    const newCount = (lead.call_count ?? 0) + 1;
    const currentLabels = lead.labels ?? [];
    const nextLabels = currentLabels.includes('No Response') ? currentLabels : [...currentLabels, 'No Response'];
    const updates: any = { call_status: newCallStatus, call_count: newCount, labels: nextLabels };
    if (newCallStatus === 'connected' && lead.status === 'new_lead') {
      updates.status = 'contacted';
    }
    setLead({ ...lead, ...updates });
    await supabase.from('leads').update(updates).eq('id', id);
    await logActivity({ leadId: id, activityType: 'call_status_change', description: `Call status changed to ${CALL_STATUS_LABELS[newCallStatus]} (call count: ${newCount}, label: No Response)`, performedBy: profile?.id });
    showSaved();
  };

  const handleDelete = async () => {
    if (!lead || !confirm(`Delete lead "${lead.name}"?`)) return;
    await supabase.from('leads').delete().eq('id', id);
    navigate('/leads');
  };

  const setLabel = async (label: string) => {
    if (!lead || !id) return;
    const next = label ? [label] : [];
    setLead({ ...lead, labels: next });
    await supabase.from('leads').update({ labels: next }).eq('id', id);
    showSaved();
  };

  const handleNext = () => {
    const currentIdx = allLeadIds.indexOf(id!);
    if (currentIdx >= 0 && currentIdx < allLeadIds.length - 1) {
      navigate(`/leads/${allLeadIds[currentIdx + 1]}`);
    }
  };

  const handleActivityFromChild = async (description: string) => {
    await logActivity({ leadId: id, activityType: 'task', description, performedBy: profile?.id });
  };

  const toggleLeadTask = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id);
    await handleActivityFromChild(`Task "${task.title}" marked as ${nextStatus}`);
    fetchLeadTasks();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!lead) return <div className="text-center py-20 text-gray-500">Lead not found. <button onClick={() => navigate('/leads')} className="text-blue-600 underline">Back to leads</button></div>;

  const counselorName = (cid: string | null) => counselors.find((c) => c.id === cid)?.full_name ?? 'Unassigned';
  const currentIdx = allLeadIds.indexOf(id!);
  const hasNext = currentIdx >= 0 && currentIdx < allLeadIds.length - 1;
  const openTasks = leadTasks.filter((task) => task.status !== 'completed');
  const completedTasks = leadTasks.filter((task) => task.status === 'completed');

  const tabs = [
    { key: 'details' as const, label: 'Details', icon: <LayoutList className="w-4 h-4" /> },
    { key: 'notes' as const, label: 'Notes', icon: <StickyNote className="w-4 h-4" /> },
    { key: 'activity' as const, label: 'Activity', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Top nav: Back + Next */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate('/leads')}>
          <ChevronLeft className="w-4 h-4" /> Back to Leads
        </Button>
        <div className="flex items-center gap-3">
          {saveIndicator && <span className="text-xs text-emerald-600 font-medium">{saveIndicator}</span>}
          <Button variant="outline" size="sm" onClick={handleNext} disabled={!hasNext}>
            Next Lead <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Header card: name, lead_id, phone, assigned user, edit/delete/convert */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={lead.name} className="w-12 h-12 text-base" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{lead.name}</h1>
              <p className="text-sm text-gray-400">{lead.lead_id}</p>
              {lead.phone && <p className="text-sm text-gray-600 mt-0.5">{lead.phone}</p>}
              <p className="text-sm text-gray-600 mt-0.5">
                <span className="text-xs text-gray-400">Assigned to </span>
                <span className="font-medium">{counselorName(lead.assigned_counselor_id)}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {lead.status !== 'converted' ? (
              <Button variant="secondary" size="sm" onClick={() => setShowConvert(true)}>
                <ArrowRight className="w-4 h-4" /> Convert
              </Button>
            ) : <span className="text-sm text-emerald-600 font-medium">Converted</span>}
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[minmax(180px,0.8fr)_170px_minmax(280px,1.4fr)] gap-4 items-start">
          <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5 min-h-[96px]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Education Summary</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-700">
                <span className="font-semibold text-gray-400">Degree</span>
                <ChevronRight className="w-3 h-3 text-blue-400" />
                <span className="font-semibold truncate">{lead.last_degree || 'Not provided'}</span>
              </div>
              <div className="ml-4 flex items-center gap-1.5 text-xs text-gray-700">
                <span className="font-semibold text-gray-400">Completed</span>
                <ChevronRight className="w-3 h-3 text-blue-400" />
                <span className="font-semibold">{lead.last_degree_year || 'Not provided'}</span>
              </div>
              <div className="ml-8 flex items-center gap-1.5 text-xs text-gray-700">
                <span className="font-semibold text-gray-400">Score</span>
                <ChevronRight className="w-3 h-3 text-blue-400" />
                <span className="font-semibold">{lead.last_degree_score || 'Not provided'}</span>
              </div>
              <div className="ml-12 flex items-center gap-1.5 text-xs text-gray-700">
                <span className="font-semibold text-gray-400">English</span>
                <ChevronRight className="w-3 h-3 text-blue-400" />
                <span className="font-semibold truncate">
                  {lead.english_test_type
                    ? `${ENGLISH_TEST_TYPES.find((t) => t.value === lead.english_test_type)?.label ?? lead.english_test_type}${lead.english_test_score ? ': ' + lead.english_test_score : ''}`
                    : 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className={cn('flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5', CALL_STATUS_COLORS[lead.call_status ?? 'not_called'])}>
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Call</span>
              <span className="text-xs font-semibold truncate">{CALL_STATUS_LABELS[lead.call_status ?? 'not_called']}</span>
            </div>
            <div className={cn('flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5', lead.labels?.[0] ? LEAD_LABEL_COLORS[lead.labels[0]] : 'bg-gray-100 text-gray-500 border-gray-200')}>
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Label</span>
              <select
                value={lead.labels?.[0] ?? ''}
                onChange={(e) => setLabel(e.target.value)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer max-w-[100px] truncate"
              >
                <option value="">No label</option>
                {LEAD_LABELS.map((label) => <option key={label} value={label}>{label}</option>)}
              </select>
            </div>
            <div className={cn('flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5', LEAD_STATUS_COLORS[lead.status])}>
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Lead</span>
              <span className="text-xs font-semibold truncate">{LEAD_STATUS_LABELS[lead.status]}</span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 min-h-[132px]">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Open Tasks</p>
              </div>
              <Button size="sm" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>
                <Plus className="w-3.5 h-3.5" /> Add Task
              </Button>
            </div>
            {openTasks.length === 0 ? (
              <p className="text-xs text-gray-400 py-3">No open tasks for this lead.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {openTasks.map((task) => (
                  <div key={task.id} className="rounded-md border border-gray-200 bg-white px-2.5 py-2">
                    <div className="flex items-start gap-2">
                      <button type="button" onClick={() => toggleLeadTask(task)} className="mt-0.5 w-4 h-4 rounded border border-gray-300 hover:border-emerald-500 shrink-0" title="Mark completed" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate">{task.title}</p>
                        {task.description && <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{task.description}</p>}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{task.due_date ? formatDate(task.due_date) : 'No due date'}</span>
                          <span className="capitalize">{task.priority} priority</span>
                          <span>{counselorName(task.assigned_to)}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => { setEditingTask(task); setShowTaskModal(true); }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit task">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fancy contact bar: WhatsApp, Call, Email + Call status with counter */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          {lead.phone && (
            <a
              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-[#25D366] rounded-xl hover:bg-[#1ebe5d] transition shadow-sm"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
          {lead.email ? (
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition shadow-sm"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="No email address available"
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-xl cursor-not-allowed"
            >
              <Mail className="w-4 h-4" /> Email
            </button>
          )}

          {/* Call status selector with call counter badge */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-2.5 py-1.5 min-w-[150px]">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Label Stage</p>
              <select
                value={lead.labels?.[0] ?? ''}
                onChange={(e) => setLabel(e.target.value)}
                className={cn('mt-0.5 w-full bg-transparent text-xs font-semibold focus:outline-none cursor-pointer', lead.labels?.[0] ? LEAD_LABEL_COLORS[lead.labels[0]].split(' ')[1] : 'text-gray-500')}
              >
                <option value="">No label</option>
                {LEAD_LABELS.map((label) => <option key={label} value={label}>{label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl shadow-sm">
              <PhoneCall className="w-4 h-4" />
              <span className="text-sm font-semibold">{lead.call_count ?? 0}</span>
              <span className="text-xs text-slate-300">calls made</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {CALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleCallStatusChange(s)}
                  className={cn(
                    'px-2 py-1 rounded-md text-[11px] font-medium border transition',
                    (lead.call_status ?? 'not_called') === s
                      ? CALL_STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-blue-300'
                      : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                  )}
                >
                  {CALL_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Lead Stage pipeline — redesigned */}
      <Card className="p-5">
        <p className="text-xs font-medium text-gray-500 mb-3">Lead Stage</p>
        <div className="flex flex-wrap gap-2">
          {LEAD_STATUSES.filter((s) => s !== 'converted').map((s, i) => {
            const stageIdx = LEAD_STATUSES.indexOf(s);
            const currentIdx = LEAD_STATUSES.indexOf(lead.status);
            const isPassed = stageIdx < currentIdx && s !== 'lost' && s !== 'duplicate';
            const isCurrent = lead.status === s;
            return (
              <button
                key={s}
                onClick={() => handleStageChange(s)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition flex items-center gap-1.5',
                  isCurrent
                    ? LEAD_STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-blue-300 shadow-sm'
                    : isPassed
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                )}
              >
                {isPassed && <CheckCircle2 className="w-3.5 h-3.5" />}
                {LEAD_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tabs: Details / Notes / Activity */}
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
        <>
          {/* Details — read-only display */}
          <Card className="p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailField label="Gender" value={lead.gender} />
              <DetailField label="Nationality" value={lead.country} />
              <DetailField label="Email" value={lead.email} />
              <DetailField label="Phone" value={lead.phone} />
              <DetailField label="Address" value={lead.address} />
              <DetailField label="City" value={lead.city} />
              <DetailField label="Last Degree" value={lead.last_degree} />
              <DetailField label="CGPA / Percentage" value={lead.last_degree_score} />
              <DetailField label="Year of Degree" value={lead.last_degree_year} />
              <DetailField label="English Test" value={lead.english_test_type ? (ENGLISH_TEST_TYPES.find((t) => t.value === lead.english_test_type)?.label ?? lead.english_test_type) : null} />
              <DetailField label="English Test Score" value={lead.english_test_score} />
              <DetailField label="English Test Date" value={lead.english_test_date} />
              <DetailField label="Lead Source" value={sources.find((s) => s.id === lead.lead_source_id)?.name} />
              <DetailField label="Campaign" value={lead.campaign} />
              <DetailField label="Interested Country" value={lead.interested_country} />
              <DetailField label="Interested Intake" value={lead.interested_intake} />
              <DetailField label="Interested Course" value={lead.interested_course} />
              <DetailField label="Interested Level" value={lead.interested_level} />
              <DetailField label="Budget" value={lead.budget} />
              <DetailField label="Follow-up Date" value={lead.follow_up_date ? formatDate(lead.follow_up_date) : null} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Completed Tasks</h3>
              <span className="text-xs text-gray-400">{completedTasks.length} completed</span>
            </div>
            {completedTasks.length === 0 ? (
              <p className="text-sm text-gray-400">Completed tasks will appear here.</p>
            ) : (
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                    <button type="button" onClick={() => toggleLeadTask(task)} className="mt-0.5 w-5 h-5 rounded-md bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center shrink-0" title="Reopen task">
                      <Check className="w-3 h-3 text-white" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-500 line-through">{task.title}</p>
                      {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{task.due_date ? `Due ${formatDate(task.due_date)}` : 'No due date'}</span>
                        <span className="capitalize">{task.priority} priority</span>
                        <span>{counselorName(task.assigned_to)}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setEditingTask(task); setShowTaskModal(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit task">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'notes' && (
        <NotesThread leadId={lead.id} onActivity={handleActivityFromChild} />
      )}

      {activeTab === 'activity' && (
        <ActivityTimeline leadId={lead.id} />
      )}

      {showEdit && (
        <LeadFormModal
          lead={lead}
          sources={sources}
          counselors={counselors}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); fetchLead(); }}
        />
      )}

      {showConvert && (
        <ConvertToStudentModal
          lead={lead}
          counselors={counselors}
          onClose={() => setShowConvert(false)}
          onSuccess={() => { setShowConvert(false); navigate('/leads'); }}
        />
      )}

      {showTaskModal && (
        <LeadTaskModal
          lead={lead}
          assignees={taskAssignees}
          existingTask={editingTask}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSuccess={() => { setShowTaskModal(false); setEditingTask(null); fetchLeadTasks(); }}
        />
      )}
    </div>
  );
}

function LeadTaskModal({ lead, assignees, existingTask, onClose, onSuccess }: {
  lead: Lead;
  assignees: Profile[];
  existingTask: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    title: existingTask?.title ?? '',
    description: existingTask?.description ?? '',
    assigned_to: existingTask?.assigned_to ?? lead.assigned_counselor_id ?? '',
    due_date: existingTask?.due_date ?? lead.follow_up_date ?? '',
    priority: existingTask?.priority ?? 'medium',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (existingTask) {
      await supabase.from('tasks').update({
        title: form.title,
        description: form.description || null,
        assigned_to: form.assigned_to || null,
        due_date: form.due_date || null,
        priority: form.priority,
      }).eq('id', existingTask.id);
    } else {
      await supabase.from('tasks').insert({
        title: form.title,
        description: form.description || null,
        assigned_to: form.assigned_to || null,
        due_date: form.due_date || null,
        priority: form.priority,
        status: 'pending',
        created_by: profile?.id,
        related_lead_id: lead.id,
      });
    }
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title={existingTask ? 'Edit Task' : 'New Task'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
          <span className="text-xs text-gray-500">Linked to:</span>
          <span className="text-sm font-medium text-blue-700">Lead: {lead.name}</span>
        </div>
        <Input label="Task / Follow-up Title" value={form.title} onChange={(v) => set('title', v)} required />
        <Textarea label="Details" value={form.description} onChange={(v) => set('description', v)} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Assign To" value={form.assigned_to} onChange={(v) => set('assigned_to', v)} placeholder="Anyone" options={assignees.map((a) => ({ value: a.id, label: a.full_name }))} />
          <Input label="Due Date" value={form.due_date} onChange={(v) => set('due_date', v)} type="date" />
        </div>
        <Select label="Priority" value={form.priority} onChange={(v) => set('priority', v)} options={[
          { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
        ]} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : existingTask ? 'Save Changes' : 'Create Task'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value ?? '—'}</p>
    </div>
  );
}

function LeadFormModal({ onClose, onSuccess, sources, counselors, lead }: {
  onClose: () => void;
  onSuccess: () => void;
  sources: LeadSource[];
  counselors: Profile[];
  lead?: Lead | null;
}) {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    name: lead?.name ?? '', gender: lead?.gender ?? '',
    email: lead?.email ?? '', phone: lead?.phone ?? '',
    address: lead?.address ?? '', city: lead?.city ?? '', country: lead?.country ?? '',
    lead_source_id: lead?.lead_source_id ?? '', campaign: lead?.campaign ?? '',
    assigned_counselor_id: lead?.assigned_counselor_id ?? '', interested_country: lead?.interested_country ?? '',
    interested_intake: lead?.interested_intake ?? '', interested_course: lead?.interested_course ?? '',
    interested_level: lead?.interested_level ?? '', budget: lead?.budget ?? '', notes: lead?.notes ?? '',
    follow_up_date: lead?.follow_up_date ?? '',
    last_degree: lead?.last_degree ?? '', last_degree_score: lead?.last_degree_score ?? '',
    last_degree_year: lead?.last_degree_year ?? '',
    english_test_type: lead?.english_test_type ?? '', english_test_score: lead?.english_test_score ?? '',
    english_test_date: lead?.english_test_date ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const isEdit = !!lead;
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isEdit) return;
    (async () => {
      const conditions: string[] = [];
      if (form.email) conditions.push(`email.eq.${form.email}`);
      if (form.phone) conditions.push(`phone.eq.${form.phone}`);
      if (conditions.length === 0) { setDuplicateWarning(null); return; }
      const { data } = await supabase.from('leads').select('id, name, lead_id, status').or(conditions.join(','));
      if (data && data.length > 0) {
        const dupes = data.map((d: any) => `${d.name} (${d.lead_id})`).join(', ');
        setDuplicateWarning(`Duplicate found: ${dupes}. A lead with this email or phone already exists.`);
      } else {
        setDuplicateWarning(null);
      }
    })();
  }, [form.email, form.phone, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateWarning) { setError('Please resolve the duplicate warning before adding.'); return; }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      gender: form.gender || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      country: form.country || null,
      lead_source_id: form.lead_source_id || null,
      campaign: form.campaign || null,
      assigned_counselor_id: form.assigned_counselor_id || null,
      interested_country: form.interested_country || null,
      interested_intake: form.interested_intake || null,
      interested_course: form.interested_course || null,
      interested_level: form.interested_level || null,
      budget: form.budget || null,
      notes: form.notes || null,
      follow_up_date: form.follow_up_date || null,
      last_degree: form.last_degree || null,
      last_degree_score: form.last_degree_score || null,
      last_degree_year: form.last_degree_year || null,
      english_test_type: form.english_test_type || null,
      english_test_score: form.english_test_score || null,
      english_test_date: form.english_test_date || null,
    };
    if (isEdit && lead) {
      const { error } = await supabase.from('leads').update(payload).eq('id', lead.id);
      if (error) setError(error.message);
      else onSuccess();
    } else {
      const leadId = generateId('LD');
      const { error } = await supabase.from('leads').insert({
        ...payload,
        lead_id: leadId,
        status: 'new_lead',
        call_status: 'not_called',
        created_by: profile?.id,
        branch_id: profile?.branch_id ?? null,
      });
      if (error) setError(error.message);
      else onSuccess();
    }
    setSaving(false);
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Lead' : 'Create New Lead'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name" value={form.name} onChange={(v) => set('name', v)} required />
          <Select label="Gender" value={form.gender} onChange={(v) => set('gender', v)} placeholder="Select" options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
          <Input label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" />
          <Input label="Phone / WhatsApp" value={form.phone} onChange={(v) => set('phone', v)} />
          <Input label="Address" value={form.address} onChange={(v) => set('address', v)} />
          <Input label="City" value={form.city} onChange={(v) => set('city', v)} />
          <Select label="Nationality" value={form.country} onChange={(v) => set('country', v)} placeholder="Select" options={COUNTRIES.map((c) => ({ value: c, label: c }))} />
          <Select label="Lead Source" value={form.lead_source_id} onChange={(v) => set('lead_source_id', v)} placeholder="Select source" options={sources.map((s) => ({ value: s.id, label: s.name }))} />
          <Input label="Campaign" value={form.campaign} onChange={(v) => set('campaign', v)} />
          <Select label="Assigned Counselor" value={form.assigned_counselor_id} onChange={(v) => set('assigned_counselor_id', v)} placeholder="Select counselor" options={counselors.map((c) => ({ value: c.id, label: c.full_name }))} />
          <Select label="Interested Country" value={form.interested_country} onChange={(v) => set('interested_country', v)} placeholder="Select" options={COUNTRIES.map((c) => ({ value: c, label: c }))} />
          <Select label="Interested Intake" value={form.interested_intake} onChange={(v) => set('interested_intake', v)} placeholder="Select" options={INTAKES.map((i) => ({ value: i, label: i }))} />
          <Input label="Interested Course" value={form.interested_course} onChange={(v) => set('interested_course', v)} />
          <Select label="Interested Level" value={form.interested_level} onChange={(v) => set('interested_level', v)} placeholder="Select" options={STUDY_LEVELS.map((l) => ({ value: l, label: l }))} />
          <Input label="Budget" value={form.budget} onChange={(v) => set('budget', v)} />
          <Input label="Follow-up Date" value={form.follow_up_date} onChange={(v) => set('follow_up_date', v)} type="date" />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Academic Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Last Degree" value={form.last_degree} onChange={(v) => set('last_degree', v)} placeholder="e.g. Bachelor of Science" />
            <Input label="CGPA / Percentage" value={form.last_degree_score} onChange={(v) => set('last_degree_score', v)} placeholder="e.g. 3.5 or 75%" />
            <Input label="Year of Degree" value={form.last_degree_year} onChange={(v) => set('last_degree_year', v)} placeholder="e.g. 2024" />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">English Proficiency Test</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Test Type" value={form.english_test_type} onChange={(v) => set('english_test_type', v)} placeholder="Select test" options={ENGLISH_TEST_TYPES} />
            <Input label="Score" value={form.english_test_score} onChange={(v) => set('english_test_score', v)} placeholder="e.g. 7.5 or 85" />
            <Input label="Test Date" value={form.english_test_date} onChange={(v) => set('english_test_date', v)} type="date" />
          </div>
        </div>

        {duplicateWarning && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{duplicateWarning}</p>
          </div>
        )}

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || (!isEdit && !!duplicateWarning)}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Lead'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ConvertToStudentModal({ lead, counselors, onClose, onSuccess }: {
  lead: Lead;
  counselors: Profile[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    student_number: '',
    country: lead.country ?? 'United Kingdom',
    interested_course: lead.interested_course ?? '',
    interested_intake: lead.interested_intake ?? '',
    passport_number: '',
    passport_expiry: '',
    date_of_birth: '',
    cnic: '',
    assigned_counselor_id: lead.assigned_counselor_id ?? '',
    gap_explanation: '',
    interview_notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      const conditions: string[] = [];
      if (lead.email) conditions.push(`email.eq.${lead.email}`);
      if (lead.phone) conditions.push(`phone.eq.${lead.phone}`);
      if (form.passport_number) conditions.push(`passport_number.eq.${form.passport_number}`);
      if (conditions.length === 0) return;
      const { data } = await supabase.from('students').select('id, name, student_id').or(conditions.join(','));
      if (data && data.length > 0) {
        const dupes = data.map((d: any) => `${d.name} (${d.student_id})`).join(', ');
        setDuplicateWarning(`Duplicate found: ${dupes}. A student with this email, phone, or passport already exists.`);
      } else {
        setDuplicateWarning(null);
      }
    })();
  }, [lead.email, lead.phone, form.passport_number]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateWarning) { setError('Please resolve the duplicate warning before converting.'); return; }
    setSaving(true);
    setError(null);
    const studentId = form.student_number || generateId('STU');
    const { error: insError } = await supabase.from('students').insert({
      student_id: studentId,
      lead_id: lead.id,
      name: lead.name,
      gender: lead.gender,
      nationality: lead.country,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      city: lead.city,
      country: form.country,
      assigned_counselor_id: form.assigned_counselor_id || null,
      branch_id: lead.branch_id,
      date_of_birth: form.date_of_birth || null,
      passport_number: form.passport_number || null,
      passport_expiry: form.passport_expiry || null,
      cnic: form.cnic || null,
      gap_explanation: form.gap_explanation || null,
      interview_notes: form.interview_notes || null,
      status: 'active',
      admission_stage: 'draft',
      created_by: profile?.id,
    });
    if (insError) { setError(insError.message); setSaving(false); return; }
    await supabase.from('leads').update({ status: 'converted' }).eq('id', lead.id);
    await logActivity({ leadId: lead.id, activityType: 'conversion', description: `Lead converted to mature student (${studentId})`, performedBy: profile?.id });
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title={`Convert ${lead.name} to Student`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Info banner */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Converting lead to mature student</p>
              <p className="text-xs text-blue-700 mt-0.5">Name, email, and phone are auto-filled from the lead. The lead will be removed from the lead list after conversion.</p>
            </div>
          </div>
        </div>

        {/* Auto-filled info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Name (auto-filled)</p>
            <p className="text-sm font-medium text-gray-900">{lead.name}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Email (auto-filled)</p>
            <p className="text-sm font-medium text-gray-900">{lead.email ?? '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Phone (auto-filled)</p>
            <p className="text-sm font-medium text-gray-900">{lead.phone ?? '—'}</p>
          </div>
        </div>

        {duplicateWarning && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{duplicateWarning}</p>
          </div>
        )}

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Student Number" value={form.student_number} onChange={(v) => set('student_number', v)} placeholder="Auto-generated if empty" />
          <Select label="Country" value={form.country} onChange={(v) => set('country', v)} options={COUNTRIES.map((c) => ({ value: c, label: c }))} />
          <Input label="Interested Course" value={form.interested_course} onChange={(v) => set('interested_course', v)} />
          <Input label="Interested Intake" value={form.interested_intake} onChange={(v) => set('interested_intake', v)} />
          <Input label="Passport Number" value={form.passport_number} onChange={(v) => set('passport_number', v)} />
          <Input label="Passport Expiry" value={form.passport_expiry} onChange={(v) => set('passport_expiry', v)} type="date" />
          <Input label="Date of Birth" value={form.date_of_birth} onChange={(v) => set('date_of_birth', v)} type="date" />
          <Input label="CNIC" value={form.cnic} onChange={(v) => set('cnic', v)} />
          <Select label="Assigned Counselor" value={form.assigned_counselor_id} onChange={(v) => set('assigned_counselor_id', v)} placeholder="Select" options={counselors.map((c) => ({ value: c.id, label: c.full_name }))} />
        </div>
        <Textarea label="Gap Explanation (if any)" value={form.gap_explanation} onChange={(v) => set('gap_explanation', v)} rows={2} />
        <Textarea label="Interview Notes" value={form.interview_notes} onChange={(v) => set('interview_notes', v)} rows={2} />

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !!duplicateWarning}>{saving ? 'Converting...' : 'Convert to Student'}</Button>
        </div>
      </form>
    </Modal>
  );
}

const FIELD_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone / WhatsApp' },
  { key: 'gender', label: 'Gender' },
  { key: 'country', label: 'Nationality' },
  { key: 'city', label: 'City' },
  { key: 'address', label: 'Address' },
  { key: 'interested_country', label: 'Interested Country' },
  { key: 'interested_course', label: 'Interested Course' },
  { key: 'interested_intake', label: 'Interested Intake' },
  { key: 'interested_level', label: 'Interested Level' },
  { key: 'budget', label: 'Budget' },
  { key: 'campaign', label: 'Campaign' },
  { key: 'last_degree', label: 'Last Degree' },
  { key: 'last_degree_score', label: 'CGPA / Percentage' },
  { key: 'last_degree_year', label: 'Year of Degree' },
  { key: 'english_test_type', label: 'English Test Type' },
  { key: 'english_test_score', label: 'English Test Score' },
  { key: 'english_test_date', label: 'English Test Date' },
];

function BulkUploadModal({ sources, counselors, onClose, onSuccess }: {
  sources: LeadSource[];
  counselors: Profile[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { profile } = useAuth();
  const [stage, setStage] = useState<'upload' | 'mapping' | 'preview' | 'done'>('upload');
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [fileName, setFileName] = useState('');
  const [assignedCounselor, setAssignedCounselor] = useState('');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  const handleFile = async (file: File) => {
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      if (data.length === 0) { setErrors(['The file is empty or has no data rows.']); return; }
      setRows(data);
      const cols = Object.keys(data[0]);
      const auto: Record<string, string> = {};
      const norm = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      cols.forEach((col) => {
        const n = norm(col);
        const match = FIELD_OPTIONS.find((f) => n === f.key || n.includes(f.key));
        if (match) auto[match.key] = col;
      });
      setColumnMapping(auto);
      setStage('mapping');
    } catch {
      setErrors(['Could not read the file. Please ensure it is a valid CSV or Excel file.']);
    }
  };

  const setField = (field: string, column: string) => setColumnMapping((m) => ({ ...m, [field]: column }));

  const getVal = (row: Record<string, any>, field: string) => {
    const col = columnMapping[field];
    return col ? String(row[col] ?? '').trim() : '';
  };

  const handleImport = async () => {
    setImporting(true);
    setErrors([]);
    let success = 0;
    const newErrors: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = getVal(row, 'name');
      if (!name) { newErrors.push(`Row ${i + 2}: Missing name`); continue; }
      const leadId = generateId('LD');
      const { error } = await supabase.from('leads').insert({
        lead_id: leadId, name,
        email: getVal(row, 'email') || null,
        phone: getVal(row, 'phone') || null,
        gender: getVal(row, 'gender') || null,
        country: getVal(row, 'country') || null,
        city: getVal(row, 'city') || null,
        address: getVal(row, 'address') || null,
        interested_country: getVal(row, 'interested_country') || null,
        interested_course: getVal(row, 'interested_course') || null,
        interested_intake: getVal(row, 'interested_intake') || null,
        interested_level: getVal(row, 'interested_level') || null,
        budget: getVal(row, 'budget') || null,
        campaign: getVal(row, 'campaign') || null,
        last_degree: getVal(row, 'last_degree') || null,
        last_degree_score: getVal(row, 'last_degree_score') || null,
        last_degree_year: getVal(row, 'last_degree_year') || null,
        english_test_type: getVal(row, 'english_test_type') || null,
        english_test_score: getVal(row, 'english_test_score') || null,
        english_test_date: getVal(row, 'english_test_date') || null,
        assigned_counselor_id: assignedCounselor || null,
        status: 'new_lead', call_status: 'not_called',
        branch_id: profile?.branch_id ?? null, created_by: profile?.id,
      });
      if (error) newErrors.push(`Row ${i + 2} (${name}): ${error.message}`);
      else success++;
    }
    setImportedCount(success);
    setErrors(newErrors);
    setImporting(false);
    setStage('done');
  };

  const downloadTemplate = () => {
    const template = [
      { Name: 'John Doe', Phone: '+92 300 1234567', Email: 'john@example.com', Gender: 'male', Nationality: 'Pakistan', City: 'Lahore', 'Last Degree': 'Bachelor of Science', 'CGPA / Percentage': '3.5', 'Year of Degree': '2024' },
      { Name: 'Jane Smith', Phone: '+92 301 2345678', Email: 'jane@example.com', Gender: 'female', Nationality: 'Pakistan', City: 'Karachi', 'Last Degree': 'Master of Arts', 'CGPA / Percentage': '75%', 'Year of Degree': '2023' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads Template');
    XLSX.writeFile(wb, 'leads_template.xlsx');
  };

  return (
    <Modal open onClose={onClose} title="Bulk Upload Leads" size="lg">
      {stage === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Upload a CSV or Excel file with lead data. You'll map columns next.</p>
            <Button variant="ghost" size="sm" onClick={downloadTemplate}><Download className="w-4 h-4" /> Template</Button>
          </div>
          <Select label="Assign all leads to" value={assignedCounselor} onChange={setAssignedCounselor} placeholder="Leave unassigned" options={counselors.map((c) => ({ value: c.id, label: c.full_name }))} />
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-blue-400 transition cursor-pointer" onClick={(e) => { const input = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement; input?.click(); }}>
            <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Click to select a CSV or Excel file</p>
            <p className="text-xs text-gray-400 mt-1">Supports .csv, .xlsx, .xls</p>
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />
          </div>
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {errors.map((e, i) => <p key={i} className="text-sm text-red-600">{e}</p>)}
            </div>
          )}
        </div>
      )}
      {stage === 'mapping' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{fileName}</p>
              <p className="text-xs text-gray-500">{rows.length} rows found. Map each field to a column.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setStage('upload'); setRows([]); setErrors([]); }}>Choose Different File</Button>
          </div>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {FIELD_OPTIONS.map((f) => (
              <div key={f.key} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-40 shrink-0">
                  <p className="text-sm font-medium text-gray-700">{f.label}</p>
                  {f.key === 'name' && <span className="text-xs text-red-500">Required</span>}
                </div>
                <select
                  value={columnMapping[f.key] ?? ''}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Skip —</option>
                  {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {columnMapping[f.key] && (
                  <span className="text-xs text-gray-400 truncate max-w-32">
                    e.g. {String(rows[0]?.[columnMapping[f.key]] ?? '').slice(0, 20)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => setStage('preview')}>Preview</Button>
          </div>
        </div>
      )}
      {stage === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Preview — {rows.length} leads</p>
              <p className="text-xs text-gray-500">Verify the mapped data before importing.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStage('mapping')}>Edit Mapping</Button>
          </div>
          <div className="overflow-x-auto max-h-80 border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>{FIELD_OPTIONS.filter((f) => columnMapping[f.key]).map((f) => <th key={f.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{f.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    {FIELD_OPTIONS.filter((f) => columnMapping[f.key]).map((f) => <td key={f.key} className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{getVal(row, f.key) || '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleImport} disabled={importing}>{importing ? 'Importing...' : `Import ${rows.length} Leads`}</Button>
          </div>
        </div>
      )}
      {stage === 'done' && (
        <div className="space-y-4 text-center py-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
          <p className="text-lg font-semibold text-gray-900">{importedCount} leads imported successfully</p>
          {errors.length > 0 && <p className="text-sm text-amber-600 mt-1">{errors.length} rows had errors</p>}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto text-left">
              {errors.map((e, i) => <p key={i} className="text-sm text-red-600">{e}</p>)}
            </div>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => { setStage('upload'); setRows([]); setErrors([]); setImportedCount(0); setColumnMapping({}); }}>Upload Another File</Button>
            <Button onClick={onSuccess}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
