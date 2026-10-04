import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, X, Trash2, Edit3, Save, ChevronRight } from 'lucide-react';
import { journalApi, JournalEntry } from '../api/journal';

const MOOD_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: 'Struggling', emoji: '😔', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  2: { label: 'Low', emoji: '😕', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  3: { label: 'Okay', emoji: '😐', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  4: { label: 'Good', emoji: '🙂', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  5: { label: 'Great', emoji: '😊', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (iso: string) => {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Compose/Edit form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMood, setFormMood] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEntries = async () => {
    try {
      const data = await journalApi.list();
      setEntries(data);
    } catch {
      setError('Failed to load journal entries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const openCompose = () => {
    setFormTitle('');
    setFormContent('');
    setFormMood(null);
    setIsEditing(false);
    setShowCompose(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setFormTitle(entry.title || '');
    setFormContent(entry.content);
    setFormMood(entry.mood ?? null);
    setIsEditing(true);
    setSelectedEntry(entry);
    setShowCompose(true);
  };

  const handleSave = async () => {
    if (!formContent.trim()) return;
    setIsSaving(true);
    try {
      if (isEditing && selectedEntry) {
        const updated = await journalApi.update(selectedEntry.id, {
          title: formTitle || undefined,
          content: formContent,
          mood: formMood ?? undefined,
        });
        setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
        setSelectedEntry(updated);
      } else {
        const created = await journalApi.create({
          title: formTitle || undefined,
          content: formContent,
          mood: formMood ?? undefined,
        });
        setEntries(prev => [created, ...prev]);
      }
      setShowCompose(false);
    } catch {
      setError('Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await journalApi.delete(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      if (selectedEntry?.id === id) setSelectedEntry(null);
      setDeleteConfirm(null);
    } catch {
      setError('Failed to delete entry.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-28 space-y-5 font-sans animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white">Daily Journal</h2>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                Private
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Unfiltered emotional release & self-reflection</p>
          </div>
        </div>
        <button
          onClick={openCompose}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-950/30 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Entry</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Empty State */}
      {entries.length === 0 && (
        <div className="text-center py-16 space-y-3 glass-card rounded-3xl p-8 border border-white/[0.05]">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Your journal is waiting</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">Write your reflections freely — your thoughts are completely confidential and never shared.</p>
          </div>
          <button
            onClick={openCompose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Write First Entry</span>
          </button>
        </div>
      )}

      {/* Entry List */}
      <div className="space-y-2.5">
        {entries.map(entry => {
          const mood = entry.mood ? MOOD_LABELS[entry.mood] : null;
          return (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className="glass-card rounded-2xl p-4 border border-white/[0.05] hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group shadow-surface-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] text-slate-400 font-mono">{formatDate(entry.created_at)}</span>
                    {mood && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-md border font-semibold ${mood.color}`}>
                        {mood.emoji} {mood.label}
                      </span>
                    )}
                  </div>
                  {entry.title && (
                    <h3 className="text-xs font-bold text-white truncate mb-0.5">{entry.title}</h3>
                  )}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{entry.content}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && !showCompose && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-dark-900 border border-white/[0.08] rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-surface-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">{formatDate(selectedEntry.created_at)} · {formatTime(selectedEntry.created_at)}</span>
                  {selectedEntry.mood && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-md border font-semibold ${MOOD_LABELS[selectedEntry.mood].color}`}>
                      {MOOD_LABELS[selectedEntry.mood].emoji} {MOOD_LABELS[selectedEntry.mood].label}
                    </span>
                  )}
                </div>
                {selectedEntry.title && (
                  <h3 className="text-sm font-bold text-white mt-1.5">{selectedEntry.title}</h3>
                )}
              </div>
              <button 
                onClick={() => setSelectedEntry(null)} 
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-dark-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">{selectedEntry.content}</p>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-white/[0.06] flex gap-2">
              <button
                onClick={() => openEdit(selectedEntry)}
                className="flex-1 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setDeleteConfirm(selectedEntry.id)}
                className="flex-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose / Edit Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-dark-900 border border-white/[0.08] rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-surface-lg">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-bold text-sm text-white">
                {isEditing ? 'Edit Reflection' : 'New Journal Reflection'}
              </h3>
              <button 
                onClick={() => setShowCompose(false)} 
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-dark-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Title */}
              <input
                type="text"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Entry title (optional)..."
                className="w-full bg-dark-850/80 border border-slate-700/70 rounded-xl px-4 py-2.5 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/80 transition-colors"
              />

              {/* Mood Picker */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                  Current Emotional Weather
                </label>
                <div className="flex gap-2">
                  {([1, 2, 3, 4, 5] as number[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setFormMood(formMood === m ? null : m)}
                      title={MOOD_LABELS[m].label}
                      className={`flex-1 py-2.5 rounded-xl border text-base transition-all active:scale-95 ${
                        formMood === m
                          ? MOOD_LABELS[m].color + ' shadow-surface-sm scale-105'
                          : 'border-white/[0.05] bg-dark-850/60 hover:border-slate-600 text-slate-400'
                      }`}
                    >
                      {MOOD_LABELS[m].emoji}
                    </button>
                  ))}
                </div>
                {formMood && (
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                    Feeling: <strong className="text-slate-200">{MOOD_LABELS[formMood].label}</strong>
                  </p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                  Stream of Consciousness
                </label>
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder="Write freely — this is completely private. How are you feeling right now? What urges or moments of peace arose today?"
                  rows={8}
                  className="w-full bg-dark-850/80 border border-slate-700/70 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/80 transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 border-t border-white/[0.06] flex gap-2">
              <button
                onClick={() => setShowCompose(false)}
                className="flex-1 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 text-slate-300 text-xs font-semibold transition-all active:scale-98"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formContent.trim() || isSaving}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-md shadow-indigo-950/30"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Entry'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-rose-500/20 rounded-3xl max-w-xs w-full p-6 space-y-4 shadow-surface-lg">
            <h3 className="text-sm font-bold text-white">Delete this entry?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">This reflection will be permanently erased.</p>
            <div className="flex gap-2 pt-1">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 rounded-xl bg-dark-800 hover:bg-dark-750 disabled:opacity-50 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-all active:scale-98"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
