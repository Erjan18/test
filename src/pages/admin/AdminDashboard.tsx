import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, HelpCircle, Users, BarChart3, TrendingUp, Award, Activity, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Stats = {
  testsCount: number;
  questionsCount: number;
  usersCount: number;
  attemptsCount: number;
  avgScore: number;
  recentAttempts: Array<{
    id: string;
    score: number;
    max_score: number;
    completed_at: string;
    profiles: { username: string } | null;
    tests: { title: string } | null;
  }>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { count: testsCount },
        { count: questionsCount },
        { count: usersCount },
        { data: attempts },
      ] = await Promise.all([
        supabase.from('tests').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('test_attempts').select('id, score, max_score, completed_at, profiles(username), tests(title)').order('completed_at', { ascending: false }).limit(5),
      ]);

      const { count: attemptsCount } = await supabase.from('test_attempts').select('*', { count: 'exact', head: true });
      const { data: allAttempts } = await supabase.from('test_attempts').select('score, max_score');
      const avgScore = allAttempts && allAttempts.length > 0
        ? Math.round(allAttempts.reduce((s, a) => s + (a.max_score > 0 ? (a.score / a.max_score) * 100 : 0), 0) / allAttempts.length)
        : 0;

      setStats({
        testsCount: testsCount || 0,
        questionsCount: questionsCount || 0,
        usersCount: usersCount || 0,
        attemptsCount: attemptsCount || 0,
        avgScore,
        recentAttempts: (attempts as any) || [],
      });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: 'Тесты', value: stats?.testsCount, icon: BookOpen, color: 'from-blue-500 to-cyan-500', to: '/admin/tests' },
    { label: 'Вопросы', value: stats?.questionsCount, icon: HelpCircle, color: 'from-emerald-500 to-teal-500', to: '/admin/questions' },
    { label: 'Пользователи', value: stats?.usersCount, icon: Users, color: 'from-amber-500 to-orange-500', to: '/admin/users' },
    { label: 'Попыток', value: stats?.attemptsCount, icon: Activity, color: 'from-rose-500 to-pink-500', to: '/admin/stats' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Панель управления</h1>
        <p className="text-slate-400 text-sm mt-1">Обзор системы ГрамТест</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, to }) => (
          <Link
            key={label}
            to={to}
            className="group relative overflow-hidden bg-slate-800/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-200"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-black text-white">
              {loading ? <div className="w-12 h-8 bg-slate-700 rounded animate-pulse" /> : value}
            </div>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Avg score */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 text-center">
          <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <div className="text-4xl font-black text-white">{loading ? '...' : `${stats?.avgScore}%`}</div>
          <div className="text-xs text-slate-400 mt-1">Средний балл по всем тестам</div>
        </div>
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 text-center">
          <Award className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <div className="text-4xl font-black text-white">{loading ? '...' : stats?.attemptsCount}</div>
          <div className="text-xs text-slate-400 mt-1">Всего прохождений</div>
        </div>
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 text-center">
          <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-4xl font-black text-white">
            {loading ? '...' : (stats && stats.usersCount > 0 ? (stats.attemptsCount / stats.usersCount).toFixed(1) : '0')}
          </div>
          <div className="text-xs text-slate-400 mt-1">Тестов на пользователя</div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Последние прохождения
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-700/50 rounded-xl animate-pulse" />)}
          </div>
        ) : stats?.recentAttempts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">Нет данных</p>
        ) : (
          <div className="space-y-2">
            {stats?.recentAttempts.map(attempt => {
              const pct = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0;
              return (
                <div key={attempt.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/50 border border-white/5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    pct >= 75 ? 'bg-emerald-900/50 text-emerald-400' : pct >= 60 ? 'bg-amber-900/50 text-amber-400' : 'bg-red-900/50 text-red-400'
                  }`}>
                    {pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 truncate">{(attempt.profiles as any)?.username || 'Аноним'}</div>
                    <div className="text-xs text-slate-500 truncate">{(attempt.tests as any)?.title || '—'}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(attempt.completed_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
