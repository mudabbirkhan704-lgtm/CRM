import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Payment, Student } from '@/lib/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, Select, Textarea, Modal, Badge, Card, EmptyState } from '@/components/ui';
import { Wallet, Plus, Search, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

export function FinancePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState({ revenue: 0, pending: 0, commission: 0, expenses: 0 });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('payments').select('*').order('payment_date', { ascending: false });
    if (typeFilter) query = query.eq('payment_type', typeFilter);
    const { data } = await query.limit(100);
    const allPayments = (data as Payment[]) ?? [];
    setPayments(allPayments);
    setStats({
      revenue: allPayments.filter((p) => p.payment_type === 'student_payment' && p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0),
      pending: allPayments.filter((p) => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0),
      commission: allPayments.filter((p) => p.payment_type === 'commission' && p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0),
      expenses: allPayments.filter((p) => p.payment_type === 'expense' && p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0),
    });
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('students').select('id, name, student_id');
      setStudents((data as Student[]) ?? []);
    })();
    fetchPayments();
  }, [fetchPayments]);

  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? 'Unknown';

  const typeLabels: Record<string, string> = {
    student_payment: 'Student Payment', university_deposit: 'University Deposit', refund: 'Refund', commission: 'Commission', expense: 'Expense',
  };

  const typeColors: Record<string, string> = {
    student_payment: 'bg-green-100 text-green-700 border-green-200',
    university_deposit: 'bg-blue-100 text-blue-700 border-blue-200',
    refund: 'bg-orange-100 text-orange-700 border-orange-200',
    commission: 'bg-purple-100 text-purple-700 border-purple-200',
    expense: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusColors: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    failed: 'bg-red-100 text-red-700 border-red-200',
    refunded: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-1">Track payments, deposits, and commissions</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Add Payment</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-medium text-gray-500">Revenue</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.revenue)}</p></div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-medium text-gray-500">Pending</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.pending)}</p></div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Receipt className="w-5 h-5 text-amber-600" /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-medium text-gray-500">Commission</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.commission)}</p></div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Wallet className="w-5 h-5 text-purple-600" /></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-medium text-gray-500">Expenses</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.expenses)}</p></div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payments..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Types</option>
            <option value="student_payment">Student Payment</option>
            <option value="university_deposit">University Deposit</option>
            <option value="refund">Refund</option>
            <option value="commission">Commission</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : payments.length === 0 ? (
          <EmptyState icon={<Wallet className="w-7 h-7" />} title="No payments found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900">{studentName(p.student_id)}</span></td>
                    <td className="px-4 py-3"><Badge className={typeColors[p.payment_type]}>{typeLabels[p.payment_type]}</Badge></td>
                    <td className="px-4 py-3"><span className="text-sm font-semibold text-gray-900">{formatCurrency(p.amount, p.currency)}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-gray-500">{formatDate(p.payment_date)}</span></td>
                    <td className="px-4 py-3"><Badge className={statusColors[p.status]}>{p.status}</Badge></td>
                    <td className="px-4 py-3"><span className="text-sm text-gray-500">{p.invoice_number ?? '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCreate && <PaymentFormModal students={students} onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchPayments(); }} />}
    </div>
  );
}

function PaymentFormModal({ students, onClose, onSuccess }: { students: Student[]; onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({ student_id: '', payment_type: 'student_payment', amount: '', payment_method: '', payment_date: '', invoice_number: '', receipt_number: '', description: '', status: 'completed' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('payments').insert({
      student_id: form.student_id,
      payment_type: form.payment_type,
      amount: Number(form.amount),
      payment_method: form.payment_method || null,
      payment_date: form.payment_date || new Date().toISOString().slice(0, 10),
      invoice_number: form.invoice_number || null,
      receipt_number: form.receipt_number || null,
      description: form.description || null,
      status: form.status,
      created_by: profile?.id,
    });
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title="Add Payment" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Student" value={form.student_id} onChange={(v) => set('student_id', v)} required placeholder="Select student" options={students.map((s) => ({ value: s.id, label: `${s.name} (${s.student_id})` }))} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" value={form.payment_type} onChange={(v) => set('payment_type', v)} options={[
            { value: 'student_payment', label: 'Student Payment' }, { value: 'university_deposit', label: 'University Deposit' },
            { value: 'refund', label: 'Refund' }, { value: 'commission', label: 'Commission' }, { value: 'expense', label: 'Expense' },
          ]} />
          <Input label="Amount" value={form.amount} onChange={(v) => set('amount', v)} type="number" required />
          <Input label="Payment Method" value={form.payment_method} onChange={(v) => set('payment_method', v)} />
          <Input label="Payment Date" value={form.payment_date} onChange={(v) => set('payment_date', v)} type="date" />
          <Input label="Invoice #" value={form.invoice_number} onChange={(v) => set('invoice_number', v)} />
          <Input label="Receipt #" value={form.receipt_number} onChange={(v) => set('receipt_number', v)} />
        </div>
        <Select label="Status" value={form.status} onChange={(v) => set('status', v)} options={[
          { value: 'completed', label: 'Completed' }, { value: 'pending', label: 'Pending' }, { value: 'failed', label: 'Failed' },
        ]} />
        <Textarea label="Description" value={form.description} onChange={(v) => set('description', v)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Payment'}</Button>
        </div>
      </form>
    </Modal>
  );
}
