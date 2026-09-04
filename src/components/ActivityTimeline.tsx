import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ActivityItem, Profile } from '@/lib/types';
import { Card } from '@/components/ui';
import { Activity } from 'lucide-react';

interface ActivityTimelineProps {
  leadId?: string;
  studentId?: string;
  applicationId?: string;
}

export function ActivityTimeline({ leadId, studentId, applicationId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [performers, setPerformers] = useState<Record<string, string>>({});

  const fetchActivities = useCallback(async () => {
    let query = supabase.from('activity_timeline').select('*');
    if (leadId) query = query.eq('lead_id', leadId);
    if (studentId) query = query.eq('student_id', studentId);
    if (applicationId) query = query.eq('application_id', applicationId);
    const { data } = await query.order('created_at', { ascending: false }).limit(50);
    setActivities((data as ActivityItem[]) ?? []);

    if (data && data.length > 0) {
      const ids = [...new Set(data.map((a) => a.performed_by).filter(Boolean))] as string[];
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids);
        const map: Record<string, string> = {};
        (profiles ?? []).forEach((p: any) => { map[p.id] = p.full_name; });
        setPerformers(map);
      }
    }
  }, [leadId, studentId, applicationId]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const performerName = (id: string | null) => {
    if (!id) return 'System';
    return performers[id] ?? 'User';
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-gray-500" />
        <h3 className="text-base font-semibold text-gray-900">Activity Timeline</h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No activity recorded yet.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((a, idx) => (
            <div key={a.id} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />
                {idx < activities.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-3">
                <p className="text-sm text-gray-700">{a.description ?? a.activity_type}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {performerName(a.performed_by)} · {formatTime(a.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export async function logActivity(params: {
  leadId?: string;
  studentId?: string;
  applicationId?: string;
  activityType: string;
  description: string;
  performedBy?: string | null;
}) {
  const payload: any = {
    activity_type: params.activityType,
    description: params.description,
    performed_by: params.performedBy ?? null,
  };
  if (params.leadId) payload.lead_id = params.leadId;
  if (params.studentId) payload.student_id = params.studentId;
  if (params.applicationId) payload.application_id = params.applicationId;
  await supabase.from('activity_timeline').insert(payload);
}
