import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Award, Clock, TrendingUp, ChevronRight, Zap, Target, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Test, TestAttempt } from '../lib/supabase';

const difficultyLabel: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
const difficultyColor: Record<string, string> = {
  easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950',
  hard: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
};

export default function HomePage() {
  const { profile } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: testsData }, { data: attemptsData }] = await Promise.all([
        supabase.from('tests').select('*').eq('is_active', true).order('created_at').limit(3),
        supabase.from('test_attempts').select('*').eq('user_id', profile!.id).order('completed_at', { ascending: false }).limit(5),
      ]);
      setTests(testsData || []);
      setAttempts(attemptsData || []);
      setLoading(false);
    }
    if (profile) load();
  }, [profile]);

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + (a.max_score > 0 ? (a.score / a.max_score) * 100 : 0), 0) / attempts.length)
    : 0;

  const stats = [
    { label: 'Тестов пройдено', value: profile?.total_tests ?? 0, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Всего баллов', value: profile?.total_score ?? 0, icon: Award, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' },
    { label: 'Средний балл', value: `${avgScore}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Активных тестов', value: tests.length, icon: Target, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/30">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative">
          <div className="flex items-center gap-2 text-blue-100 text-sm mb-3">
            <Zap className="w-4 h-4" />
            <span>Добро пожаловать в Грамматика!</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Привет, {profile?.username?.split(' ')[0]}!
          </h1>
          <p className="text-blue-100 mb-6 max-w-lg text-base">
            Проверьте свои знания грамматики русского языка с помощью интерактивных тестов
          </p>
          <Link
            to="/tests"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-sm text-sm"
          >
            Начать тест
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all duration-200">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Available Tests */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Доступные тесты</h2>
            <Link to="/tests" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Все тесты <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map(test => (
                <Link
                  key={test.id}
                  to={`/tests/${test.id}`}
                  className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-150 group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{test.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[test.difficulty]}`}>
                        {difficultyLabel[test.difficulty]}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{Math.floor(test.time_limit / 60)} мин
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent results */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Последние результаты</h2>
            <Link to="/results" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Все <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : attempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <Star className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Пройдите первый тест!</p>
              <Link to="/tests" className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline">Перейти к тестам</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map(attempt => {
                const pct = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0;
                const color = pct >= 80 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
                return (
                  <div key={attempt.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${color} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700`}>
                      {pct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(attempt.completed_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {attempt.score} из {attempt.max_score} баллов
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
