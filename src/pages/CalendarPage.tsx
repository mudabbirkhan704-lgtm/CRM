import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge } from '@/components/ui';
import { formatDate, cn } from '@/lib/utils';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<{ date: string; title: string; type: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [tasksRes, followupsRes, visasRes] = await Promise.all([
        supabase.from('tasks').select('title, due_date').not('due_date', 'is', null),
        supabase.from('follow_ups').select('follow_up_date, notes').eq('status', 'pending'),
        supabase.from('visas').select('appointment_date, student_id').not('appointment_date', 'is', null),
      ]);
      const all: { date: string; title: string; type: string }[] = [];
      (tasksRes.data ?? []).forEach((t) => all.push({ date: t.due_date, title: t.title, type: 'task' }));
      (followupsRes.data ?? []).forEach((f) => all.push({ date: f.follow_up_date, title: f.notes ?? 'Follow-up', type: 'followup' }));
      (visasRes.data ?? []).forEach((v) => all.push({ date: v.appointment_date, title: 'Visa Appointment', type: 'visa' }));
      setEvents(all);
    })();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const monthName = currentDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const eventsForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().slice(0, 10);
    return events.filter((e) => e.date === dateStr);
  };

  const typeColors: Record<string, string> = {
    task: 'bg-blue-100 text-blue-700',
    followup: 'bg-amber-100 text-amber-700',
    visa: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-1">Appointments, deadlines, and reminders</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">Today</button>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
          ))}
          {days.map((day, i) => {
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const dayEvents = day ? eventsForDay(day) : [];
            return (
              <div key={i} className={cn('min-h-[80px] sm:min-h-[100px] p-1.5 rounded-lg border', day ? 'border-gray-100' : 'border-transparent', isToday && 'bg-blue-50 border-blue-200')}>
                {day && (
                  <>
                    <p className={cn('text-xs font-medium mb-1', isToday ? 'text-blue-600' : 'text-gray-500')}>{day}</p>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((e, j) => (
                        <div key={j} className={cn('text-xs px-1.5 py-0.5 rounded truncate', typeColors[e.type])}>{e.title}</div>
                      ))}
                      {dayEvents.length > 3 && <p className="text-xs text-gray-400">+{dayEvents.length - 3} more</p>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
