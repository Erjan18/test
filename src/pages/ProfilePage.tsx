import { useState, FormEvent } from 'react';
import { User, Award, BookOpen, TrendingUp, Edit3, Check, X, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError('');
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      setError('Ошибка сохранения');
    } else {
      await refreshProfile();
      setEditing(false);
    }
  }

  if (!profile) return null;

  const initials = profile.username
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = new Date(profile.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-cyan-500" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{initials}</span>
            </div>
            {!editing ? (
              <button
                onClick={() => { setEditing(true); setUsername(profile.username); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Изменить
              </button>
            ) : null}
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Имя пользователя</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? 'Сохраняем...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{profile.username}</h2>
                {profile.role === 'admin' && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <Shield className="w-3 h-3" />
                    Администратор
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">В системе с {memberSince}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Тестов пройдено', value: profile.total_tests, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Всего баллов', value: profile.total_score, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' },
          {
            label: 'Ср. балл',
            value: profile.total_tests > 0 ? `~${Math.round(profile.total_score / profile.total_tests)}` : '—',
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-950'
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Account info */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          Данные аккаунта
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">Email</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">Роль</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">
              {profile.role === 'admin' ? 'Администратор' : 'Пользователь'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Дата регистрации</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{memberSince}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
