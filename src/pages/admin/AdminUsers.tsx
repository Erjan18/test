import { useEffect, useState } from 'react';
import { Users, Shield, User, Search, Award, BookOpen } from 'lucide-react';
import { supabase, Profile } from '../../lib/supabase';

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setUsers(data || []);
      setLoading(false);
    });
  }, []);

  async function toggleRole(user: Profile) {
    setUpdating(user.id);
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    setUpdating(null);
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const totalTests = users.reduce((s, u) => s + u.total_tests, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Пользователи</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} зарегистрированных</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
          <div className="text-2xl font-bold text-white">{users.length}</div>
          <div className="text-xs text-slate-400">пользователей</div>
        </div>
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-center">
          <Shield className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
          <div className="text-2xl font-bold text-white">{adminCount}</div>
          <div className="text-xs text-slate-400">администраторов</div>
        </div>
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-4 text-center">
          <BookOpen className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
          <div className="text-2xl font-bold text-white">{totalTests}</div>
          <div className="text-xs text-slate-400">тестов пройдено</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск пользователей..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-white/5">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">Пользователи не найдены</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => {
            const initials = user.username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div key={user.id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initials || <User className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-white">{user.username}</span>
                    {user.role === 'admin' && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-700">
                        <Shield className="w-2.5 h-2.5" />
                        Админ
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />{user.total_tests} тестов
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />{user.total_score} баллов
                    </span>
                    <span>{new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleRole(user)}
                  disabled={updating === user.id}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-60 ${
                    user.role === 'admin'
                      ? 'bg-amber-900/30 text-amber-400 border border-amber-700 hover:bg-amber-900/50'
                      : 'bg-slate-700 text-slate-400 border border-white/10 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  {updating === user.id ? '...' : user.role === 'admin' ? 'Снять права' : 'Сделать админом'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
