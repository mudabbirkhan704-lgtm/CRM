import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS, ALL_ROLES } from '@/lib/constants';
import type { Profile, Branch } from '@/lib/types';
import { Button, Input, Select, Modal, Badge, Card } from '@/components/ui';
import {
  Settings as SettingsIcon, Building2, Users, Plus,
  Shield, Phone, Mail, UserPlus, Power, Trash2, Pencil,
} from 'lucide-react';

export function SettingsPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'office' | 'users' | 'roles'>('office');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) ?? []);
  };

  const fetchBranches = async () => {
    const { data } = await supabase.from('branches').select('*').order('name');
    setBranches((data as Branch[]) ?? []);
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'branch_manager';
  const isSuperAdmin = profile?.role === 'super_admin';

  const toggleUserActive = async (user: Profile) => {
    await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
    fetchUsers();
  };

  const changeUserRole = async (user: Profile, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    fetchUsers();
  };

  const handleDeleteUser = async (user: Profile) => {
    if (user.id === profile?.id) { alert('You cannot delete your own account.'); return; }
    if (!confirm(`Remove ${user.full_name}? This will delete their account.`)) return;
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.admin.deleteUser(user.id);
    fetchUsers();
  };

  const tabs = [
    { key: 'office', label: 'Office & Branches', icon: <Building2 className="w-4 h-4" /> },
    { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { key: 'roles', label: 'Roles & Permissions', icon: <Shield className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'office' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Branches</h3>
            {isAdmin && <Button size="sm" onClick={() => setShowAddBranch(true)}><Plus className="w-4 h-4" /> Add Branch</Button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div>
                  <Badge className={b.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>{b.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="text-sm font-medium text-gray-900">{b.name}</p>
                <p className="text-xs text-gray-500">{b.code} · {b.city ?? '—'}, {b.country}</p>
                {b.phone && <p className="text-xs text-gray-500 mt-1">{b.phone}</p>}
                {b.email && <p className="text-xs text-gray-500">{b.email}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'users' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Users ({users.length})</h3>
            {isAdmin && <Button size="sm" onClick={() => setShowAddUser(true)}><UserPlus className="w-4 h-4" /> Add User</Button>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  {isAdmin && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900">{u.full_name}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-gray-600">{u.email}</span></td>
                    <td className="px-4 py-3"><Badge className="bg-blue-100 text-blue-700 border-blue-200">{ROLE_LABELS[u.role]}</Badge></td>
                    <td className="px-4 py-3"><Badge className={u.is_active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>{u.is_active ? 'Active' : 'Inactive'}</Badge></td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isSuperAdmin && u.id !== profile?.id && (
                            <select
                              value={u.role}
                              onChange={(e) => changeUserRole(u, e.target.value)}
                              title="Change role"
                              className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 mr-1"
                            >
                              {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                            </select>
                          )}
                          <button
                            onClick={() => toggleUserActive(u)}
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg transition ${u.is_active ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Remove user"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'roles' && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Roles & Permissions</h3>
          <div className="space-y-3">
            {ALL_ROLES.map((role) => (
              <div key={role} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><Shield className="w-5 h-5 text-slate-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ROLE_LABELS[role]}</p>
                    <p className="text-xs text-gray-500">{getRoleDescription(role)}</p>
                  </div>
                </div>
                <Badge className="bg-gray-100 text-gray-600 border-gray-200">Full Access</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showAddBranch && <AddBranchModal onClose={() => setShowAddBranch(false)} onSuccess={() => { setShowAddBranch(false); fetchBranches(); }} />}
      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} onSuccess={() => { setShowAddUser(false); fetchUsers(); }} />}
    </div>
  );
}

function getRoleDescription(role: string): string {
  const desc: Record<string, string> = {
    super_admin: 'Full system access and configuration',
    branch_manager: 'Manage branch operations and staff',
    team_leader: 'Lead and monitor counselor teams',
    counselor: 'Manage leads and student counseling',
    admission_officer: 'Process university applications',
    finance_officer: 'Manage payments and finances',
    visa_officer: 'Handle visa processing',
    marketing_officer: 'Manage campaigns and lead sources',
    receptionist: 'Front desk and walk-in leads',
    read_only: 'View-only access to all data',
  };
  return desc[role] ?? '';
}

function AddBranchModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', code: '', address: '', city: '', country: 'United Kingdom', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('branches').insert({
      name: form.name, code: form.code.toUpperCase(), address: form.address || null,
      city: form.city || null, country: form.country, phone: form.phone || null, email: form.email || null,
    });
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title="Add Branch" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name" value={form.name} onChange={(v) => set('name', v)} required />
          <Input label="Code" value={form.code} onChange={(v) => set('code', v)} required placeholder="e.g. LDN01" />
          <Input label="Address" value={form.address} onChange={(v) => set('address', v)} />
          <Input label="City" value={form.city} onChange={(v) => set('city', v)} />
          <Input label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
          <Input label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Branch'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'counselor' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, role: form.role } },
    });
    if (signUpError) { setError(signUpError.message); setSaving(false); return; }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: form.email,
        full_name: form.full_name,
        role: form.role,
        is_active: true,
      });
    }
    setSaving(false);
    onSuccess();
  };

  return (
    <Modal open onClose={onClose} title="Add New User" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" value={form.full_name} onChange={(v) => set('full_name', v)} required />
        <Input label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" required />
        <Input label="Password" value={form.password} onChange={(v) => set('password', v)} type="password" required />
        <Select label="Role" value={form.role} onChange={(v) => set('role', v)} options={ALL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create User'}</Button>
        </div>
      </form>
    </Modal>
  );
}
