import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Task, Profile, Student, Lead, Application } from '@/lib/types';
import { formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Select, Textarea, Modal, Badge, Card, EmptyState } from '@/components/ui';
import { CheckSquare, Plus, Check, Clock, AlertCircle, Calendar, ChevronLeft, ChevronRight, X, Pencil, Phone, Filter, List, LayoutGrid, AlertTriangle } from 'lucide-react';

const TASK_STATUSES = ['pending', 'in_progress', 'completed'] as const;
const TASK_STATUS_LABELS: Record<string, string> = { pending: 'Pending', in_progress: 'Ongoing', completed: 'Completed' };
const TASK_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function TasksPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Profile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);

  // Filters
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>(() => localStorage.getItem('tasksViewMode') === 'cards' ? 'cards' : 'list');

  const hasFilters = assigneeFilter || statusFilter || dateFrom || dateTo;

  const clearFilters = () => { setAssigneeFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (assigneeFilter) query = query.eq('assigned_to', assigneeFilter);
    if (statusFilter) query = query.eq('status', statusFilter);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
    const { data } = await query.limit(100);
    setTasks((data as Task[]) ?? []);
    setLoading(false);
  }, [assigneeFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    (async () => {
      const [profRes, leadRes, stuRes, appRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('is_active', true),
        supabase.from('leads').select('id, name, lead_id, phone'),
        supabase.from('students').select('id, name, student_id, phone'),
        supabase.from('applications').select('id, application_id, university_name, course'),
      ]);
      setAssignees((profRes.data as Profile[]) ?? []);
      setLeads((leadRes.data as Lead[]) ?? []);
      setStudents((stuRes.data as Student[]) ?? []);
      setApps((appRes.data as Application[]) ?? []);
    })();
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { localStorage.setItem('tasksViewMode', viewMode); }, [viewMode]);

  const toggleComplete = async (task: Task, remarks?: string) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const update: any = { status: newStatus };
    if (newStatus === 'completed') {
      update.completed_at = new Date().toISOString();
      if (remarks) update.description = remarks;
    }
    await supabase.from('tasks').update(update).eq('id', task.id);
    fetchTasks();
    if (selectedTask?.id === task.id) setSelectedTask({ ...task, ...update });
  };

  const handleCompleteClick = (task: Task) => {
    if (task.status === 'completed') {
      toggleComplete(task);
    } else {
      setConfirmTask(task);
    }
  };

  const confirmComplete = () => {
    if (confirmTask) {
      toggleComplete(confirmTask);
      setConfirmTask(null);
    }
  };

  const assigneeName = (id: string | null) => assignees.find((a) => a.id === id)?.full_name ?? 'Unassigned';

  const relatedInfo = (t: Task): { label: string; subLabel?: string; onClick?: () => void } | null => {
    if (t.related_lead_id) { const l = leads.find((l) => l.id === t.related_lead_id); return l ? { label: `Lead: ${l.name}`, subLabel: l.phone ?? undefined, onClick: () => navigate(`/leads/${l.id}`) } : null; }
    if (t.related_student_id) { const s = students.find((s) => s.id === t.related_student_id); return s ? { label: `Student: ${s.name}`, subLabel: s.phone ?? undefined, onClick: () => navigate('/students') } : null; }
    if (t.related_application_id) { const a = apps.find((a) => a.id === t.related_application_id); return a ? { label: `App: ${a.application_id}`, onClick: () => navigate(`/applications/${a.id}`) } : null; }
    return null;
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600 border-gray-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    urgent: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">{tasks.length} tasks</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Task</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1" />
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Assigned User</label>
              <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Users</option>
                {assignees.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Statuses</option>
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
        ) : tasks.length === 0 ? (
          <EmptyState icon={<CheckSquare className="w-7 h-7" />} title="No tasks found" description="Create a task to get started." action={<Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Task</Button>} />
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map((t) => {
                  const ri = relatedInfo(t);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50 cursor-pointer transition" onClick={() => setSelectedTask(t)}>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCompleteClick(t); }}
                          className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition shrink-0', t.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-blue-500')}
                        >
                          {t.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className={cn('text-sm font-medium', t.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900')}>{t.title}</p>
                        {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                        {ri && (
                          <div className="mt-0.5">
                            <button onClick={(e) => { e.stopPropagation(); ri.onClick?.(); }} className="text-xs text-blue-600 hover:underline cursor-pointer text-left">
                              {ri.label}
                            </button>
                            {ri.subLabel && <span className="text-xs text-gray-500 ml-2">{ri.subLabel}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge className={priorityColors[t.priority]}>{t.priority}</Badge></td>
                      <td className="px-4 py-3"><Badge className={TASK_STATUS_COLORS[t.status]}>{TASK_STATUS_LABELS[t.status]}</Badge></td>
                      <td className="px-4 py-3"><span className="text-sm text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(t.due_date)}</span></td>
                      <td className="px-4 py-3"><span className="text-xs text-gray-500">{assigneeName(t.assigned_to)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {tasks.map((t) => {
              const ri = relatedInfo(t);
              return (
                <div key={t.id} onClick={() => setSelectedTask(t)} className="p-4 rounded-xl border border-gray-100 bg-white hover:shadow-md hover:border-gray-200 cursor-pointer transition group">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCompleteClick(t); }}
                      className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center transition shrink-0 mt-0.5', t.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-blue-500')}
                    >
                      {t.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', t.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900')}>{t.title}</p>
                      {t.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>}
                      {ri && (
                        <button onClick={(e) => { e.stopPropagation(); ri.onClick?.(); }} className="text-xs text-blue-600 hover:underline mt-1 block text-left">
                          {ri.label}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <Badge className={priorityColors[t.priority]}>{t.priority}</Badge>
                      <Badge className={TASK_STATUS_COLORS[t.status]}>{TASK_STATUS_LABELS[t.status]}</Badge>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(t.due_date)}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">{assigneeName(t.assigned_to)}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showCreate && <TaskFormModal assignees={assignees} onClose={() => setShowCreate(false)} onSuccess={(task) => { setShowCreate(false); fetchTasks(); setSelectedTask(task); }} />}
      {selectedTask && <TaskDetailModal task={selectedTask} assignees={assignees} leads={leads} students={students} onClose={() => setSelectedTask(null)} onToggleComplete={toggleComplete} onUpdated={(t) => { setSelectedTask(t); fetchTasks(); }} />}
      {confirmTask && (
        <Modal open onClose={() => setConfirmTask(null)} title="Confirm Completion" size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Are you sure you want to complete this task?</p>
                <p className="text-xs text-gray-500 mt-1">{confirmTask.title}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setConfirmTask(null)}>Cancel</Button>
              <Button onClick={confirmComplete}><Check className="w-4 h-4" /> Yes, Complete</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TaskDetailModal({ task, assignees, leads, students, onClose, onToggleComplete, onUpdated }: {
  task: Task;
  assignees: Profile[];
  leads: Lead[];
  students: Student[];
  onClose: () => void;
  onToggleComplete: (task: Task, remarks?: string) => void;
  onUpdated: (task: Task) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [completeRemarks, setCompleteRemarks] = useState('');
  const [form, setForm] = useState({ title: task.title, description: task.description ?? '', due_date: task.due_date ?? '', priority: task.priority, assigned_to: task.assigned_to ?? '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('tasks').update({
      title: form.title, description: form.description || null,
      due_date: form.due_date || null, priority: form.priority,
      assigned_to: form.assigned_to || null,
    }).eq('id', task.id);
    setSaving(false);
    setEditing(false);
    onUpdated({ ...task, ...form, description: form.description || null, due_date: form.due_date || null });
  };

  const isCompleted = task.status === 'completed';
  const assigneeName = assignees.find((a) => a.id === task.assigned_to)?.full_name ?? 'Unassigned';

  const relatedLead = leads.find((l) => l.id === task.related_lead_id);
  const relatedStudent = students.find((s) => s.id === task.related_student_id);
  const relatedName = relatedLead?.name ?? relatedStudent?.name;
  const relatedPhone = relatedLead?.phone ?? relatedStudent?.phone;

  return (
    <Modal open onClose={onClose} title="Task Details" size="md">
      {editing ? (
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(v) => set('title', v)} />
          <Textarea label="Description" value={form.description} onChange={(v) => set('description', v)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date" value={form.due_date} onChange={(v) => set('due_date', v)} type="date" />
            <Select label="Priority" value={form.priority} onChange={(v) => set('priority', v)} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
          </div>
          <Select label="Assign To" value={form.assigned_to} onChange={(v) => set('assigned_to', v)} placeholder="Select" options={assignees.map((a) => ({ value: a.id, label: a.full_name }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={TASK_STATUS_COLORS[task.status]}>{TASK_STATUS_LABELS[task.status]}</Badge>
            <Badge className={task.priority === 'urgent' ? 'bg-red-100 text-red-700 border-red-200' : task.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' : task.priority === 'medium' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
              {task.priority}
            </Badge>
          </div>

          {relatedName && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {relatedName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{relatedName}</p>
                {relatedPhone && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {relatedPhone}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-base font-semibold text-gray-900">{task.title}</p>
            {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Due Date</p>
              <p className="text-sm text-gray-900 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> {formatDate(task.due_date)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Assigned To</p>
              <p className="text-sm text-gray-900">{assigneeName}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Created</p>
              <p className="text-sm text-gray-900">{formatDate(task.created_at)}</p>
            </div>
            {task.completed_at && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Completed</p>
                <p className="text-sm text-gray-900">{formatDate(task.completed_at)}</p>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            {!isCompleted && (
              <>
                <Input label="Completion Remarks (optional)" value={completeRemarks} onChange={(v) => setCompleteRemarks(v)} placeholder="Add a note about task completion..." />
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => onToggleComplete(task, completeRemarks || undefined)} className="flex-1">
                    <Check className="w-4 h-4" /> Mark as Complete
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Pencil className="w-3.5 h-3.5" /> Reschedule / Edit
                  </Button>
                  <Button variant="ghost" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
            {isCompleted && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onToggleComplete(task)} className="flex-1">
                  Reopen Task
                </Button>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function TaskFormModal({ assignees, onClose, onSuccess }: { assignees: Profile[]; onClose: () => void; onSuccess: (task: Task) => void }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium', linkType: '', linkId: '' });
  const [saving, setSaving] = useState(false);
  const [linkOptions, setLinkOptions] = useState<{ id: string; label: string }[]>([]);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setForm((f) => ({ ...f, linkId: '' }));
    if (form.linkType === 'lead') {
      supabase.from('leads').select('id, name').order('name').limit(200).then(({ data }) => setLinkOptions((data ?? []).map((l: any) => ({ id: l.id, label: l.name }))));
    } else if (form.linkType === 'student') {
      supabase.from('students').select('id, name').order('name').limit(200).then(({ data }) => setLinkOptions((data ?? []).map((s: any) => ({ id: s.id, label: s.name }))));
    } else if (form.linkType === 'application') {
      supabase.from('applications').select('id, application_id').order('created_at', { ascending: false }).limit(200).then(({ data }) => setLinkOptions((data ?? []).map((a: any) => ({ id: a.id, label: a.application_id }))));
    } else {
      setLinkOptions([]);
    }
  }, [form.linkType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload: any = {
      title: form.title,
      description: form.description || null,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      priority: form.priority,
      status: 'pending',
      created_by: profile?.id,
    };
    if (form.linkType === 'lead' && form.linkId) payload.related_lead_id = form.linkId;
    if (form.linkType === 'student' && form.linkId) payload.related_student_id = form.linkId;
    if (form.linkType === 'application' && form.linkId) payload.related_application_id = form.linkId;
    const { data } = await supabase.from('tasks').insert(payload).select().single();
    setSaving(false);
    if (data) onSuccess(data as Task);
    else onSuccess({ ...form, id: '', status: 'pending', created_at: new Date().toISOString() } as Task);
  };

  return (
    <Modal open onClose={onClose} title="New Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={form.title} onChange={(v) => set('title', v)} required />
        <Textarea label="Description" value={form.description} onChange={(v) => set('description', v)} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Link To" value={form.linkType} onChange={(v) => set('linkType', v)} placeholder="None" options={[{ value: 'lead', label: 'Lead' }, { value: 'student', label: 'Mature Student' }, { value: 'application', label: 'Application' }]} />
          {form.linkType ? (
            <Select label="Select Record" value={form.linkId} onChange={(v) => set('linkId', v)} placeholder="Choose..." options={linkOptions.map((o) => ({ value: o.id, label: o.label }))} />
          ) : <div />}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Assign To" value={form.assigned_to} onChange={(v) => set('assigned_to', v)} placeholder="Select" options={assignees.map((a) => ({ value: a.id, label: a.full_name }))} />
          <Input label="Due Date" value={form.due_date} onChange={(v) => set('due_date', v)} type="date" />
        </div>
        <Select label="Priority" value={form.priority} onChange={(v) => set('priority', v)} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Task'}</Button>
        </div>
      </form>
    </Modal>
  );
}
