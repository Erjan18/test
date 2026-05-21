import { useEffect, useState, FormEvent } from 'react';
import { Plus, Edit3, Trash2, HelpCircle, X, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { supabase, Question, Test } from '../../lib/supabase';

type QuestionForm = {
  test_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: number;
  explanation: string;
};

const emptyForm: QuestionForm = {
  test_id: '',
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 0,
  explanation: '',
};

export default function AdminQuestions() {
  const [tests, setTests] = useState<Test[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    const [{ data: testsData }, { data: questionsData }] = await Promise.all([
      supabase.from('tests').select('*').order('title'),
      supabase.from('questions').select('*').order('test_id').order('order_index'),
    ]);
    setTests(testsData || []);
    setQuestions(questionsData || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm({ ...emptyForm, test_id: tests[0]?.id || '' });
    setEditTarget(null);
    setError('');
    setModal('create');
  }

  function openEdit(q: Question) {
    const opts = q.options;
    setForm({
      test_id: q.test_id,
      question_text: q.question_text,
      option_a: opts[0] || '',
      option_b: opts[1] || '',
      option_c: opts[2] || '',
      option_d: opts[3] || '',
      correct_answer: q.correct_answer,
      explanation: q.explanation || '',
    });
    setEditTarget(q);
    setError('');
    setModal('edit');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.question_text.trim() || !form.option_a.trim() || !form.option_b.trim()) {
      setError('Заполните текст вопроса и минимум 2 варианта');
      return;
    }
    setSaving(true);
    setError('');

    const options = [form.option_a, form.option_b, form.option_c, form.option_d].filter(o => o.trim());
    const payload = {
      test_id: form.test_id,
      question_text: form.question_text,
      options,
      correct_answer: form.correct_answer,
      explanation: form.explanation || null,
      order_index: questions.filter(q => q.test_id === form.test_id).length,
    };

    if (modal === 'create') {
      const { error } = await supabase.from('questions').insert(payload);
      if (error) { setError('Ошибка создания вопроса'); setSaving(false); return; }
    } else if (editTarget) {
      const { error } = await supabase.from('questions').update(payload).eq('id', editTarget.id);
      if (error) { setError('Ошибка обновления вопроса'); setSaving(false); return; }
    }

    setSaving(false);
    setModal(null);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from('questions').delete().eq('id', id);
    setDeleteConfirm(null);
    load();
  }

  const filtered = selectedTest === 'all' ? questions : questions.filter(q => q.test_id === selectedTest);
  const testMap = Object.fromEntries(tests.map(t => [t.id, t.title]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Вопросы</h1>
          <p className="text-slate-400 text-sm mt-1">{filtered.length} вопросов</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedTest}
              onChange={e => setSelectedTest(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="all">Все тесты</option>
              {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-white/5">
          <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">Вопросы не найдены</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, idx) => (
            <div key={q.id} className="flex items-start gap-4 p-4 bg-slate-800/50 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
              <div className="w-8 h-8 bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white leading-relaxed">{q.question_text}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {q.options.map((opt, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded-lg ${
                        i === q.correct_answer
                          ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}: {opt.length > 30 ? opt.slice(0, 30) + '...' : opt}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-slate-500 mt-1 block">{testMap[q.test_id] || 'Неизвестный тест'}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(q)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteConfirm(q.id)} className="p-2 rounded-lg text-slate-500 hover:bg-red-900/30 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">{modal === 'create' ? 'Новый вопрос' : 'Редактировать вопрос'}</h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-700 text-red-400 rounded-xl px-3 py-2.5 text-xs mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Тест</label>
                <select
                  value={form.test_id}
                  onChange={e => setForm(f => ({ ...f, test_id: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                >
                  {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Текст вопроса</label>
                <textarea
                  value={form.question_text}
                  onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                  required
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none transition-all"
                  placeholder="Текст вопроса..."
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Варианты ответов</label>
                <div className="space-y-2">
                  {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map((key, i) => (
                    <div key={key} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, correct_answer: i }))}
                        className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-all ${
                          form.correct_answer === i
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </button>
                      <input
                        value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        required={i < 2}
                        className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                        placeholder={`Вариант ${String.fromCharCode(65 + i)}${i >= 2 ? ' (необязательно)' : ''}`}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-slate-500">Нажмите на букву, чтобы отметить правильный ответ</p>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Объяснение (необязательно)</label>
                <textarea
                  value={form.explanation}
                  onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 resize-none transition-all"
                  placeholder="Объяснение правильного ответа..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-white/10 rounded-xl text-slate-400 text-sm hover:bg-slate-800 transition-all">
                  Отмена
                </button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-60">
                  <Check className="w-4 h-4" />
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-white font-semibold text-sm">Удалить вопрос?</h3>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-white/10 rounded-xl text-slate-400 text-sm hover:bg-slate-800 transition-all">Отмена</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-semibold transition-all">Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
