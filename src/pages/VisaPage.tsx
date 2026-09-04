import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Visa, Student } from '@/lib/types';
import { formatDate, cn } from '@/lib/utils';
import { Button, Input, Textarea, Select, Modal, Badge, Card, EmptyState } from '@/components/ui';
import { Plane, Plus, Check, X, Clock, FileCheck } from 'lucide-react';

export function VisaPage() {
  const [visas, setVisas] = useState<Visa[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'refused'>('all');
  const [showCreate, setShowCreate] = useState(false);

  const fetchVisas = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('visas').select('*').order('created_at', { ascending: false });
    if (filter === 'pending') query = query.or('decision.is.null,decision.eq.pending');
    if (filter === 'approved') query = query.eq('decision', 'approved');
    if (filter === 'refused') query = query.eq('decision', 'refused');
    const { data } = await query.limit(100);
    setVisas((data as Visa[]) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('students').select('id, name, student_id');
      setStudents((data as Student[]) ?? []);
    })();
    fetchVisas();
  }, [fetchVisas]);

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? 'Unknown';

  const decisionBadge = (decision: string | null) => {
    if (!decision || decision === 'pending') return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
    if (decision === 'approved') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approved</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200">Refused</Badge>;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visa Processing</h1>
          <p className="text-sm text-gray-500 mt-1">{visas.length} visa applications</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Visa Record</Button>
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'refused'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-4 py-2 text-sm font-medium rounded-lg transition', filter === f ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50')}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : visas.length === 0 ? (
          <EmptyState icon={<Plane className="w-7 h-7" />} title="No visa records found" />
        ) : (
          <div className="divide-y divide-gray-50">
            {visas.map((v) => (
              <div key={v.id} className="px-4 py-4 hover:bg-gray-50/50 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center"><Plane className="w-5 h-5 text-sky-600" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{studentName(v.student_id)}</p>
                      <p className="text-xs text-gray-500">{v.visa_type}</p>
                    </div>
                  </div>
                  {decisionBadge(v.decision)}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 ml-13">
                  <ChecklistItem label="Financial Verification" done={v.financial_verification} />
                  <ChecklistItem label="TB Test" done={v.tb_test_done} date={v.tb_test_date} />
                  <ChecklistItem label="Biometrics" done={v.biometrics_done} date={v.biometrics_date} />
                  <div>
                    <p className="text-xs text-gray-500">Appointment</p>
                    <p className="text-sm text-gray-700">{formatDate(v.appointment_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="text-sm text-gray-700">{formatDate(v.submission_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Decision Date</p>
                    <p className="text-sm text-gray-700">{formatDate(v.decision_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Visa Expiry</p>
                    <p className="text-sm text-gray-700">{formatDate(v.visa_expiry)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showCreate && <VisaFormModal students={students} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchVisas(); }} />}
    </div>
  );
}

function ChecklistItem({ label, done, date }: { label: string; done: boolean; date?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="flex items-center gap-1">
        {done ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-gray-400" />}
        <span className="text-sm text-gray-700">{done ? 'Done' : 'Pending'}{date ? ` · ${formatDate(date)}` : ''}</span>
      </div>
    </div>
  );
}

export function VisaTab({ studentId }: { studentId: string }) {
  const [visa, setVisa] = useState<Visa | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(false);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('visas').select('*').eq('student_id', studentId).maybeSingle();
    setVisa((data as Visa) ?? null);
  }, [studentId]);

  useEffect(() => { fetch(); }, [fetch]);

  if (!visa) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Visa</h3>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Create Visa Record</Button>
        </div>
        <p className="text-sm text-gray-400 py-8 text-center">No visa record yet.</p>
        {showCreate && <VisaFormModal studentId={studentId} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetch(); }} />}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Visa Record</h3>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Update</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div><p className="text-xs text-gray-500">Visa Type</p><p className="text-sm text-gray-900">{visa.visa_type}</p></div>
        <div><p className="text-xs text-gray-500">Decision</p><p className="text-sm text-gray-900">{visa.decision ?? 'Pending'}</p></div>
        <div><p className="text-xs text-gray-500">Appointment</p><p className="text-sm text-gray-900">{formatDate(visa.appointment_date)}</p></div>
        <div><p className="text-xs text-gray-500">Submission</p><p className="text-sm text-gray-900">{formatDate(visa.submission_date)}</p></div>
        <div><p className="text-xs text-gray-500">Decision Date</p><p className="text-sm text-gray-900">{formatDate(visa.decision_date)}</p></div>
        <div><p className="text-xs text-gray-500">Expiry</p><p className="text-sm text-gray-900">{formatDate(visa.visa_expiry)}</p></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
        <ChecklistItem label="Financial Verification" done={visa.financial_verification} />
        <ChecklistItem label="TB Test" done={visa.tb_test_done} date={visa.tb_test_date} />
        <ChecklistItem label="Biometrics" done={visa.biometrics_done} date={visa.biometrics_date} />
      </div>
      {visa.notes && <div className="mt-4 pt-4 border-t border-gray-100"><p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-sm text-gray-700">{visa.notes}</p></div>}
      {editing && <VisaEditModal visa={visa} onClose={() => setEditing(false)} onSuccess={() => { setEditing(false); fetch(); }} />}
    </Card>
  );
}

function VisaFormModal({ students, studentId, onClose, onSuccess }: {
  students?: Student[];
  studentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ student_id: studentId ?? '', visa_type: 'Student Visa' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('visas').insert({
      student_id: form.student_id,
      visa_type: form.visa_type,
    });
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title="New Visa Record" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!studentId && (
          <Select label="Student" value={form.student_id} onChange={(v) => setForm((f) => ({ ...f, student_id: v }))} required placeholder="Select student" options={(students ?? []).map((s) => ({ value: s.id, label: `${s.name} (${s.student_id})` }))} />
        )}
        <Input label="Visa Type" value={form.visa_type} onChange={(v) => setForm((f) => ({ ...f, visa_type: v }))} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function VisaEditModal({ visa, onClose, onSuccess }: { visa: Visa; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    financial_verification: visa.financial_verification,
    tb_test_done: visa.tb_test_done,
    tb_test_date: visa.tb_test_date ?? '',
    biometrics_done: visa.biometrics_done,
    biometrics_date: visa.biometrics_date ?? '',
    appointment_date: visa.appointment_date ?? '',
    submission_date: visa.submission_date ?? '',
    decision_date: visa.decision_date ?? '',
    decision: visa.decision ?? 'pending',
    visa_expiry: visa.visa_expiry ?? '',
    notes: visa.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('visas').update({
      financial_verification: form.financial_verification,
      tb_test_done: form.tb_test_done,
      tb_test_date: form.tb_test_date || null,
      biometrics_done: form.biometrics_done,
      biometrics_date: form.biometrics_date || null,
      appointment_date: form.appointment_date || null,
      submission_date: form.submission_date || null,
      decision_date: form.decision_date || null,
      decision: form.decision,
      visa_expiry: form.visa_expiry || null,
      notes: form.notes || null,
    }).eq('id', visa.id);
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title="Update Visa Record" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.financial_verification} onChange={(e) => set('financial_verification', e.target.checked)} className="rounded" /> Financial Verification</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.tb_test_done} onChange={(e) => set('tb_test_done', e.target.checked)} className="rounded" /> TB Test Done</label>
          <Input label="TB Test Date" value={form.tb_test_date} onChange={(v) => set('tb_test_date', v)} type="date" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.biometrics_done} onChange={(e) => set('biometrics_done', e.target.checked)} className="rounded" /> Biometrics Done</label>
          <Input label="Biometrics Date" value={form.biometrics_date} onChange={(v) => set('biometrics_date', v)} type="date" />
          <Input label="Appointment Date" value={form.appointment_date} onChange={(v) => set('appointment_date', v)} type="date" />
          <Input label="Submission Date" value={form.submission_date} onChange={(v) => set('submission_date', v)} type="date" />
          <Input label="Decision Date" value={form.decision_date} onChange={(v) => set('decision_date', v)} type="date" />
          <Select label="Decision" value={form.decision} onChange={(v) => set('decision', v)} options={[
            { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'refused', label: 'Refused' },
          ]} />
          <Input label="Visa Expiry" value={form.visa_expiry} onChange={(v) => set('visa_expiry', v)} type="date" />
        </div>
        <Textarea label="Notes" value={form.notes} onChange={(v) => set('notes', v)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Update'}</Button>
        </div>
      </form>
    </Modal>
  );
}
