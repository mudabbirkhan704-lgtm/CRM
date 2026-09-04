import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Note, Profile } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button, Card } from '@/components/ui';
import { Send, MessageSquare, Pencil, Check, X } from 'lucide-react';

interface NotesThreadProps {
  leadId?: string;
  studentId?: string;
  applicationId?: string;
  onActivity?: (description: string) => void;
}

export function NotesThread({ leadId, studentId, applicationId, onActivity }: NotesThreadProps) {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchNotes = useCallback(async () => {
    let query = supabase.from('notes').select('*');
    if (leadId) query = query.eq('lead_id', leadId);
    if (studentId) query = query.eq('student_id', studentId);
    if (applicationId) query = query.eq('application_id', applicationId);
    const { data } = await query.order('created_at', { ascending: false });
    setNotes((data as Note[]) ?? []);

    if (data && data.length > 0) {
      const authorIds = [...new Set(data.map((n) => n.author_id).filter(Boolean))] as string[];
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', authorIds);
        const map: Record<string, string> = {};
        (profiles ?? []).forEach((p: any) => { map[p.id] = p.full_name; });
        setAuthors(map);
      }
    }
  }, [leadId, studentId, applicationId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleAdd = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const payload: any = {
      content: content.trim(),
      author_id: profile?.id ?? null,
    };
    if (leadId) payload.lead_id = leadId;
    if (studentId) payload.student_id = studentId;
    if (applicationId) payload.application_id = applicationId;

    await supabase.from('notes').insert(payload);
    if (onActivity) onActivity('Note added');
    setContent('');
    setSaving(false);
    fetchNotes();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAdd();
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (noteId: string) => {
    if (!editContent.trim()) return;
    await supabase.from('notes').update({ content: editContent.trim() }).eq('id', noteId);
    if (onActivity) onActivity('Note edited');
    setEditingId(null);
    setEditContent('');
    fetchNotes();
  };

  const authorName = (id: string | null) => {
    if (!id) return 'Unknown';
    return authors[id] ?? 'User';
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        <h3 className="text-base font-semibold text-gray-900">Notes</h3>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto mb-4 pr-1">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No notes yet. Start the conversation below.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {authorName(note.author_id).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-900">{authorName(note.author_id)}</span>
                  <span className="text-xs text-gray-400">{formatTime(note.created_at)}</span>
                  {editingId !== note.id && (
                    <button
                      onClick={() => startEdit(note)}
                      title="Edit note"
                      className="ml-auto p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {editingId === note.id ? (
                  <div className="mt-1 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(note.id)} disabled={!editContent.trim()}>
                        <Check className="w-3.5 h-3.5" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="w-3.5 h-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {note.content}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a note... (Ctrl+Enter to send)"
          rows={2}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <Button onClick={handleAdd} disabled={saving || !content.trim()} className="self-end">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}
