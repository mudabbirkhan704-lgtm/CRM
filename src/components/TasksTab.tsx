import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Task, Profile, Lead, Student, Application } from '@/lib/types';
import { formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Select, Textarea, Modal, Badge, Card } from '@/components/ui';
import { Plus, Check, Calendar, CheckSquare, Pencil, Trash2 } from 'lucide-react';

interface TasksTabProps {
  leadId?: string;
  studentId?: string;
  applicationId?: string;
  onActivity?: (description: string) => void;
}

export function TasksTab({ leadId, studentId, applicationId, onActivity }: TasksTabProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Profile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    let query = supabase.from('tasks').select('*');
    if (leadId) query = query.eq('related_lead_id', leadId);
    if (studentId) query = query.eq('related_student_id', studentId);
    if (applicationId) query = query.eq('related_application_id', applicationId);
    if (filter === 'pending') query = query.in('status', ['pending', 'in_progress']);
    if (filter === 'completed') query = query.eq('status', 'completed');
    const { data } = await query.order('due_date', { ascending: true });
    setTasks((data as Task[]) ?? []);
  }, [leadId, studentId, applicationId, filter]);

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

  const toggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    if (onActivity) onActivity(`Task "${task.title}" marked as ${newStatus}`);
    fetchTasks();
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    await supabase.from('tasks').delete().eq('id', task.id);
    if (onActivity) onActivity(`Task "${task.title}" deleted`);
    fetchTasks();
  };

  const assigneeName = (id: string | null) => assignees.find((a) => a.id === id)?.full_name ?? 'Unassigned';

  const relatedInfo = (t: Task): { label: string; subLabel?: string; onClick?: () => void } | null => {
    if (t.related_lead_id) { const l = leads.find((l) => l.id === t.related_lead_id); return l ? { label: `Lead: ${l.name}`, subLabel: l.phone ?? undefined, onClick: () => navigate(`/leads/${l.id}`) } : null; }
    if (t.related_student_id) { const s = students.find((s) => s.id === t.related_student_id); return s ? { label: `Student: ${s.name}`, subLabel: s.phone ?? undefined, onClick: () => navigate('/students') } : null; }
    if (t.related_application_id) { const a = apps.find((a) => a.id === t.related_application_id); return a ? { label: `App: ${a.application_id}`, onClick: () => navigate(`/applications/${a.id}`) } : null; }
    return null;
  };

  const relatedDisplayName = (): string | undefined => {
    if (leadId) { const l = leads.find((l) => l.id === leadId); return l ? `Lead: ${l.name}` : undefined; }
    if (studentId) { const s = students.find((s) => s.id === studentId); return s ? `Student: ${s.name}` : undefined; }
    if (applicationId) { const a = apps.find((a) => a.id === applicationId); return a ? `App: ${a.application_id}` : undefined; }
    return undefined;
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600 border-gray-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    urgent: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">Tasks</h3>
          <div className="flex gap-1">
            {(['all', 'pending', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition',
                  filter === f ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <CheckSquare className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No tasks yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition">
              <button
                onClick={() => toggleComplete(t)}
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition',
                  t.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-blue-500'
                )}
              >
                {t.status === 'completed' && <Check className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', t.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900')}>
                  {t.title}
                </p>
                {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                {relatedInfo(t) && (
                  <div className="mt-0.5">
                    <button onClick={(e) => { e.stopPropagation(); relatedInfo(t)?.onClick?.(); }} className="text-xs text-blue-600 hover:underline cursor-pointer text-left">
                      {relatedInfo(t)!.label}
                    </button>
                    {relatedInfo(t)!.subLabel && (
                      <span className="text-xs text-gray-500 ml-2">{relatedInfo(t)!.subLabel}</span>
                    )}
                  </div>
                )}
              </div>
              <Badge className={priorityColors[t.priority]}>{t.priority}</Badge>
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" /> {formatDate(t.due_date)}
              </div>
              <span className="text-xs text-gray-400 hidden md:block">{assigneeName(t.assigned_to)}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingTask(t)}
                  title="Edit"
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  title="Delete"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <TaskFormModal
          assignees={assignees}
          leadId={leadId}
          studentId={studentId}
          applicationId={applicationId}
          relatedName={relatedDisplayName()}
          onClose={() => setShowCreate(false)}
          onSuccess={(title) => {
            setShowCreate(false);
            if (onActivity) onActivity(`Task "${title}" created`);
            fetchTasks();
          }}
        />
      )}

      {editingTask && (
        <TaskFormModal
          assignees={assignees}
          leadId={leadId}
          studentId={studentId}
          applicationId={applicationId}
          task={editingTask}
          relatedName={relatedDisplayName()}
          onClose={() => setEditingTask(null)}
          onSuccess={(title) => {
            setEditingTask(null);
            if (onActivity) onActivity(`Task "${title}" updated`);
            fetchTasks();
          }}
        />
      )}
    </Card>
  );
}

function TaskFormModal({ assignees, leadId, studentId, applicationId, task, relatedName, onClose, onSuccess }: {
  assignees: Profile[];
  leadId?: string;
  studentId?: string;
  applicationId?: string;
  task?: Task;
  relatedName?: string;
  onClose: () => void;
  onSuccess: (title: string) => void;
}) {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    assigned_to: task?.assigned_to ?? '',
    due_date: task?.due_date ?? '',
    priority: task?.priority ?? 'medium',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
      priority: form.priority,
    };
    if (task) {
      await supabase.from('tasks').update(payload).eq('id', task.id);
    } else {
      await supabase.from('tasks').insert({
        ...payload,
        status: 'pending',
        created_by: profile?.id,
        related_lead_id: leadId ?? null,
        related_student_id: studentId ?? null,
        related_application_id: applicationId ?? null,
      });
    }
    setSaving(false);
    onSuccess(form.title);
  };

  return (
    <Modal open onClose={onClose} title={task ? 'Edit Task' : 'New Task'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={form.title} onChange={(v) => set('title', v)} required />
        {relatedName && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
            <span className="text-xs text-gray-500">Linked to:</span>
            <span className="text-sm font-medium text-blue-700">{relatedName}</span>
          </div>
        )}
        <Textarea label="Description" value={form.description} onChange={(v) => set('description', v)} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Assign To" value={form.assigned_to} onChange={(v) => set('assigned_to', v)} placeholder="Anyone" options={assignees.map((a) => ({ value: a.id, label: a.full_name }))} />
          <Input label="Due Date" value={form.due_date} onChange={(v) => set('due_date', v)} type="date" />
        </div>
        <Select label="Priority" value={form.priority} onChange={(v) => set('priority', v)} options={[
          { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
        ]} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}</Button>
        </div>
      </form>
    </Modal>
  );
}
