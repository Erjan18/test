import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, BookOpen, Award, Target, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type TestStat = {
  id: string;
  title: string;
  attempts: number;
  avgScore: number;
  avgTime: number;
};

export default function AdminStats() {
  const [testStats, setTestStats] = useState<TestStat[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [globalAvg, setGlobalAvg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: tests }, { data: attempts }] = await Promise.all([
        supabase.from('tests').select('id, title').eq('is_active', true),
        supabase.from('test_attempts').select('test_id, score, max_score, time_spent'),
      ]);

      const allAttempts = attempts || [];
      setTotalAttempts(allAttempts.length);

      const avg = allAttempts.length > 0
        ? Math.round(allAttempts.reduce((s, a) => s + (a.max_score > 0 ? (a.score / a.max_score) * 100 : 0), 0) / allAttempts.length)
        : 0;
      setGlobalAvg(avg);

      const stats = (tests || []).map(test => {
        const testAttempts = allAttempts.filter(a => a.test_id === test.id);
        const avgScore = testAttempts.length > 0
          ? Math.round(testAttempts.reduce((s, a) => s + (a.max_score > 0 ? (a.score / a.max_score) * 100 : 0), 0) / testAttempts.length)
          : 0;
        const avgTime = testAttempts.length > 0
          ? Math.round(testAttempts.reduce((s, a) => s + a.time_spent, 0) / testAttempts.length)
          : 0;
        return { id: test.id, title: test.title, attempts: testAttempts.length, avgScore, avgTime };
      });

      setTestStats(stats.sort((a, b) => b.attempts - a.attempts));
      setLoading(false);
    }
    load();
  }, []);

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  const maxAttempts = Math.max(...testStats.map(t => t.attempts), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Статистика</h1>
        <p className="text-slate-400 text-sm mt-1">Аналитика прохождения тестов</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всего попыток', value: loading ? '...' : totalAttempts, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-900/30' },
          { label: 'Средний балл', value: loading ? '...' : `${globalAvg}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
          { label: 'Популярных тестов', value: loading ? '...' : testStats.filter(t => t.attempts > 0).length, icon: Award, color: 'text-amber-400', bg: 'bg-amber-900/30' },
          { label: 'Тестов в системе', value: loading ? '...' : testStats.length, icon: Target, color: 'text-rose-400', bg: 'bg-rose-900/30' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-slate-800/50 border border-white/10 rounded-2xl p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-3xl font-black text-white">{value}</div>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Per-test stats */}
      <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Статистика по тестам
        </h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-700/50 rounded-xl animate-pulse" />)}
          </div>
        ) : testStats.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">Нет данных</p>
        ) : (
          <div className="space-y-4">
            {testStats.map(stat => (
              <div key={stat.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-200 font-medium">{stat.title}</span>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{stat.attempts}</span>
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />{stat.avgScore}%</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(stat.avgTime)}</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stat.avgScore >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : stat.avgScore >= 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-red-500 to-rose-500'
                    }`}
                    style={{ width: `${(stat.attempts / maxAttempts) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Активность</span>
                  <span>{stat.attempts > 0 ? `Ср. балл: ${stat.avgScore}%` : 'Нет прохождений'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score distribution */}
      <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          Распределение баллов
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Отлично (90%+)', color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800' },
            { label: 'Хорошо (75–89%)', color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800' },
            { label: 'Нужно учиться (<75%)', color: 'text-red-400', bg: 'bg-red-900/30 border-red-800' },
          ].map(({ label, color, bg }) => (
            <div key={label} className={`${bg} border rounded-xl p-4`}>
              <div className={`text-lg font-bold ${color}`}>—</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
