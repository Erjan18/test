import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Trophy, Clock, Target, BarChart2, ChevronRight, Award, BookOpen } from 'lucide-react';
import { supabase, TestAttempt, Test } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type AttemptWithTest = TestAttempt & { tests: Test };

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const [attempts, setAttempts] = useState<AttemptWithTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fromQuiz = searchParams.has('score');
  const score = parseInt(searchParams.get('score') || '0');
  const max = parseInt(searchParams.get('max') || '0');
  const time = parseInt(searchParams.get('time') || '0');
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('test_attempts')
      .select('*, tests(*)')
      .eq('user_id', profile.id)
      .order('completed_at', { ascending: false })
      .then(({ data }) => {
        setAttempts((data as AttemptWithTest[]) || []);
        setLoading(false);
      });
  }, [profile]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function getGrade(pct: number) {
    if (pct >= 90) return { label: 'Отлично!', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950' };
    if (pct >= 75) return { label: 'Хорошо', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' };
    if (pct >= 60) return { label: 'Удовлетворительно', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' };
    return { label: 'Нужно подтянуть', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950' };
  }

  return (
    <div className="space-y-8">
      {/* Latest result card (from quiz) */}
      {fromQuiz && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className={`p-6 md:p-8 text-center ${pct >= 75 ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30' : pct >= 60 ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30' : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30'}`}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-slate-900 shadow-lg mb-4">
              <Trophy className={`w-10 h-10 ${getGrade(pct).color}`} />
            </div>
            <div className="text-5xl font-black text-slate-800 dark:text-slate-100 mb-2">{pct}%</div>
            <div className={`inline-block text-sm font-semibold px-3 py-1.5 rounded-full mb-4 ${getGrade(pct).color} ${getGrade(pct).bg}`}>
              {getGrade(pct).label}
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                {score} / {max} баллов
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatTime(time)}
              </div>
            </div>
          </div>
          <div className="p-5 flex gap-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/tests"
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold rounded-xl text-center hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              Пройти ещё тест
            </Link>
            <Link
              to="/"
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              На главную
            </Link>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">История тестов</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Все ваши прохождения</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <BarChart2 className="w-4 h-4" />
            {attempts.length} тестов
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
          </div>
        ) : attempts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 mb-4">История пуста</p>
            <Link
              to="/tests"
              className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Начать первый тест <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map(attempt => {
              const p = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0;
              const grade = getGrade(p);
              return (
                <div
                  key={attempt.id}
                  className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-sm transition-all"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${grade.color} ${grade.bg} shrink-0`}>
                    {p}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">
                      {attempt.tests?.title || 'Тест удалён'}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />{attempt.score}/{attempt.max_score}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatTime(attempt.time_spent)}
                      </span>
                      <span>
                        {new Date(attempt.completed_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 hidden sm:block">
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p >= 75 ? 'bg-emerald-500' : p >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {attempts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{attempts.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">всего тестов</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {Math.max(...attempts.map(a => a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0))}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">лучший результат</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center">
            <BarChart2 className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {Math.round(attempts.reduce((s, a) => s + (a.max_score > 0 ? (a.score / a.max_score) * 100 : 0), 0) / attempts.length)}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">средний балл</div>
          </div>
        </div>
      )}
    </div>
  );
}
