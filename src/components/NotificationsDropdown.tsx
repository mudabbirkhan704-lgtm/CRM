import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import type { Task, Profile, Lead } from '@/lib/types';
import { Bell, CheckSquare, Phone, Calendar } from 'lucide-react';

interface CounselorTaskCount {
  profile: Profile;
  pendingCount: number;
  overdueCount: number;
}

export function NotificationsDropdown({ darkMode }: { darkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [totalPending, setTotalPending] = useState(0);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [counselorCounts, setCounselorCounts] = useState<CounselorTaskCount[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const [taskRes, profRes, leadRes] = await Promise.all([
      supabase.from('tasks').select('*').in('status', ['pending', 'in_progress']),
      supabase.from('profiles').select('*').eq('is_active', true).in('role', ['counselor', 'team_leader', 'branch_manager', 'super_admin']),
      supabase.from('leads').select('id, name, phone, follow_up_date, assigned_counselor_id').not('follow_up_date', 'is', null).lte('follow_up_date', todayStr).neq('status', 'converted'),
    ]);

    const tasks = (taskRes.data as Task[]) ?? [];
    const profiles = (profRes.data as Profile[]) ?? [];
    const leads = (leadRes.data as Lead[]) ?? [];

    setTotalPending(tasks.length);
    setTotalOverdue(tasks.filter((t) => t.due_date && t.due_date < now).length);

    const counts: CounselorTaskCount[] = profiles
      .map((p) => {
        const pending = tasks.filter((t) => t.assigned_to === p.id).length;
        const overdue = tasks.filter((t) => t.assigned_to === p.id && t.due_date && t.due_date < now).length;
        return { profile: p, pendingCount: pending, overdueCount: overdue };
      })
      .filter((c) => c.pendingCount > 0)
      .sort((a, b) => b.pendingCount - a.pendingCount);
    setCounselorCounts(counts);

    setUpcomingFollowUps(leads.slice(0, 10));
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hasItems = totalPending > 0 || upcomingFollowUps.length > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-lg transition ${darkMode ? 'text-gray-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {hasItems && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
      </button>

      {open && (
        <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-lg border z-50 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className={`px-4 py-3 border-b ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
            <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !hasItems ? (
              <div className="py-8 text-center">
                <CheckSquare className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-slate-600' : 'text-gray-300'}`} />
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>All caught up. No pending tasks.</p>
              </div>
            ) : (
              <div className="py-2">
                {/* Summary */}
                <div className="px-4 py-2 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                  <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalPending} Pending Tasks</span>
                  {totalOverdue > 0 && (
                    <span className="ml-auto text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{totalOverdue} overdue</span>
                  )}
                </div>

                {/* Per-counselor breakdown */}
                {counselorCounts.length > 0 && (
                  <div className={`px-4 py-2 space-y-1.5 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    {counselorCounts.map((c) => (
                      <button
                        key={c.profile.id}
                        onClick={() => { navigate('/tasks'); setOpen(false); }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                          {c.profile.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-sm flex-1 truncate ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{c.profile.full_name}</span>
                        <span className="text-xs font-medium text-gray-500">{c.pendingCount} pending</span>
                        {c.overdueCount > 0 && (
                          <span className="text-xs font-medium text-red-600">{c.overdueCount} overdue</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Follow-ups due/overdue */}
                {upcomingFollowUps.length > 0 && (
                  <div className={`px-4 py-2 space-y-1.5 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>Follow-ups due</p>
                    {upcomingFollowUps.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => { navigate(`/leads/${lead.id}`); setOpen(false); }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}
                      >
                        <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{lead.name}</p>
                          {lead.phone && (
                            <p className={`text-xs flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>
                              <Phone className="w-3 h-3" /> {lead.phone}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-red-600 font-medium shrink-0">
                          {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`px-4 py-2 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
            <button
              onClick={() => { navigate('/tasks'); setOpen(false); }}
              className={`text-sm font-medium text-blue-600 hover:text-blue-700`}
            >
              View all tasks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
