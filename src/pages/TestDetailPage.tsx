import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Target, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase, Test, Question } from '../lib/supabase';

const difficultyLabel: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
const difficultyColor: Record<string, string> = {
  easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950',
  hard: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
};

export default function TestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: testData }, { data: questionsData }] = await Promise.all([
        supabase.from('tests').select('*').eq('id', id).maybeSingle(),
        supabase.from('questions').select('*').eq('test_id', id).order('order_index'),
      ]);
      setTest(testData);
      setQuestions(questionsData || []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-slate-600 dark:text-slate-400">Тест не найден</p>
      </div>
    );
  }

  const minutes = Math.floor(test.time_limit / 60);
  const seconds = test.time_limit % 60;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/tests')}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к тестам
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-blue-900/50 shrink-0">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{test.title}</h1>
              <span className={`inline-block mt-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${difficultyColor[test.difficulty]}`}>
                {difficultyLabel[test.difficulty]}
              </span>
            </div>
          </div>

          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">{test.description}</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <Target className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{questions.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">вопросов</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <Clock className="w-5 h-5 text-cyan-500 mx-auto mb-1.5" />
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {minutes}{seconds > 0 ? `:${seconds.toString().padStart(2, '0')}` : ''}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">минут</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <BookOpen className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{questions.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">баллов макс.</div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 text-sm text-blue-700 dark:text-blue-300 space-y-1.5">
            <p className="font-semibold">Правила теста:</p>
            <ul className="space-y-1 text-blue-600 dark:text-blue-400">
              <li>• Каждый вопрос — один правильный ответ из четырёх</li>
              <li>• За каждый правильный ответ начисляется 1 балл</li>
              <li>• Таймер начнётся сразу после старта</li>
              <li>• При истечении времени тест завершается автоматически</li>
            </ul>
          </div>

          <button
            onClick={() => navigate(`/tests/${id}/quiz`)}
            disabled={questions.length === 0}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-200 dark:hover:shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Начать тест
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
