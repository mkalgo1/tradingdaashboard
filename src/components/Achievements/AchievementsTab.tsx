import { useState, useRef } from 'react';
import { Plus, Trash2, Upload, Trophy, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Achievement } from '../../types';

const today = new Date().toISOString().split('T')[0];

export default function AchievementsTab() {
  const { state, accountAchievements, refreshAchievements } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(today);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.selectedAccountId) { setError('No account selected'); return; }
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');

    let imageUrl = '';
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${state.selectedAccountId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('achievements')
        .upload(path, imageFile, { upsert: false });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('achievements').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }
    }

    await supabase.from('achievements').insert({
      account_id: state.selectedAccountId,
      name: name.trim(),
      date,
      image_url: imageUrl,
    });

    await refreshAchievements();
    setSaving(false);
    setShowForm(false);
    setName('');
    setDate(today);
    setImageFile(null);
    setImagePreview(null);
  }

  async function handleDelete(achievement: Achievement) {
    if (achievement.image_url) {
      const url = new URL(achievement.image_url);
      const pathParts = url.pathname.split('/achievements/');
      if (pathParts[1]) {
        await supabase.storage.from('achievements').remove([pathParts[1]]);
      }
    }
    await supabase.from('achievements').delete().eq('id', achievement.id);
    await refreshAchievements();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Achievements</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track your trading milestones</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Achievement
        </button>
      </div>

      {showForm && (
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <h3 className="text-sm font-bold text-white mb-4">New Achievement</h3>
          {error && <p className="text-[#ef4444] text-xs mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Achievement Name *</label>
                <input
                  className="field-input"
                  placeholder="e.g. First Funded Account"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label">Date *</label>
                <input
                  className="field-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label">Image (optional)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {imagePreview ? (
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="text-xs text-slate-400 hover:text-[#ef4444] flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 text-sm transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Achievement'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="btn-ghost flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {accountAchievements.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No achievements yet. Keep trading and unlock your first milestone!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accountAchievements.map((a: Achievement) => (
            <div
              key={a.id}
              className="glass-panel rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-[#fbbf24] flex-shrink-0" />
                  <h3 className="font-bold text-white text-sm truncate">{a.name}</h3>
                </div>
                <p className="text-xs text-slate-500 font-mono">{a.date}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {a.image_url ? (
                  <img
                    src={a.image_url}
                    alt={a.name}
                    className="w-14 h-14 rounded-xl object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-slate-600" />
                  </div>
                )}
                <button
                  onClick={() => handleDelete(a)}
                  className="w-7 h-7 rounded-lg bg-white/3 hover:bg-[#ef4444]/10 flex items-center justify-center text-slate-600 hover:text-[#ef4444] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
