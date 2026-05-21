import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, ChevronRight, Search, Filter } from 'lucide-react';
import { supabase, Test } from '../lib/supabase';

const difficultyLabel: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
const difficultyColor: Record<string, string> = {
  easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  hard: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
};
const difficultyBg: Record<string, string> = {
  easy: 'from-emerald-400 to-teal-500',
  medium: 'from-amber-400 to-orange-500',
  hard: 'from-red-400 to-rose-600',
};

type Difficulty = 'all' | 'easy' | 'medium' | 'hard';

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('all');

  useEffect(() => {
    supabase.from('tests').select('*').eq('is_active', true).order('created_at').then(({ data }) => {
      setTests(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = tests.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchDiff = difficulty === 'all' || t.difficulty === difficulty;
    return matchSearch && matchDiff;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Тесты по грамматике</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Выберите тест и проверьте свои знания</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск тестов..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex gap-1">
            {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  difficulty === d
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {d === 'all' ? 'Все' : difficultyLabel[d]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Тесты не найдены</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(test => (
            <Link
              key={test.id}
              to={`/tests/${test.id}`}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`h-2 bg-gradient-to-r ${difficultyBg[test.difficulty]}`} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${difficultyColor[test.difficulty]}`}>
                    {difficultyLabel[test.difficulty]}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {test.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{test.description}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.floor(test.time_limit / 60)} минут
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                    Начать <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
