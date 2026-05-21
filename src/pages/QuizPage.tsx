import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2, XCircle, ChevronRight, ChevronLeft, Flag } from 'lucide-react';
import { supabase, Test, Question } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: testData }, { data: questionsData }] = await Promise.all([
        supabase.from('tests').select('*').eq('id', id).maybeSingle(),
        supabase.from('questions').select('*').eq('test_id', id).order('order_index'),
      ]);
      if (testData) {
        setTest(testData);
        setTimeLeft(testData.time_limit);
        const qs = questionsData || [];
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(null));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const submit = useCallback(async (currentAnswers: (number | null)[]) => {
    if (submitted || !test || !profile) return;
    setSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const score = questions.reduce((sum, q, i) => sum + (currentAnswers[i] === q.correct_answer ? 1 : 0), 0);
    const timeSpent = test.time_limit - timeLeft;

    await supabase.from('test_attempts').insert({
      user_id: profile.id,
      test_id: test.id,
      score,
      max_score: questions.length,
      time_spent: timeSpent,
      answers: currentAnswers,
    });

    navigate(`/results?testId=${test.id}&score=${score}&max=${questions.length}&time=${timeSpent}`, { replace: true });
  }, [submitted, test, profile, questions, timeLeft, navigate]);

  useEffect(() => {
    if (!test || loading) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setAnswers(prev => {
            submit(prev);
            return prev;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [test, loading, submit]);

  function selectAnswer(optionIndex: number) {
    if (submitted) return;
    setAnswers(prev => {
      const next = [...prev];
      next[current] = optionIndex;
      return next;
    });
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft <= 60;
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;
  const answeredCount = answers.filter(a => a !== null).length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-slate-600 dark:text-slate-400">Тест не найден или вопросы отсутствуют</p>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-slate-800 dark:text-slate-100">{test.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Вопрос {current + 1} из {questions.length} · Отвечено: {answeredCount}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-semibold text-sm transition-all ${
          isUrgent
            ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 animate-pulse border border-red-200 dark:border-red-800'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
        }`}>
          <Clock className="w-4 h-4" />
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      {/* Progress */}
      <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question dots */}
      <div className="flex gap-1 flex-wrap">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
              i === current
                ? 'bg-blue-600 text-white shadow-sm'
                : answers[i] !== null
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <p className="text-base md:text-lg font-medium text-slate-800 dark:text-slate-100 mb-6 leading-relaxed">
          {q.question_text}
        </p>

        <div className="space-y-3">
          {q.options.map((option, i) => {
            const selected = answers[current] === i;
            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 text-sm font-medium ${
                  selected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                }`}
              >
                <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold mr-3 ${
                  selected ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Назад
        </button>

        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-all"
        >
          <Flag className="w-4 h-4" />
          Завершить
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-sm"
          >
            Далее
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all shadow-sm"
          >
            Сдать тест
            <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950 rounded-xl flex items-center justify-center">
                <Flag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Завершить тест?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Отвечено {answeredCount} из {questions.length}
                </p>
              </div>
            </div>
            {answeredCount < questions.length && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl px-3 py-2.5 text-xs mb-4">
                <XCircle className="w-4 h-4 shrink-0" />
                Есть {questions.length - answeredCount} неотвеченных вопросов
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Продолжить
              </button>
              <button
                onClick={() => submit(answers)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
