import { useEffect, useState, FormEvent } from 'react';
import { Plus, Edit3, Trash2, BookOpen, X, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase, Test } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const difficultyLabel: Record<string, string> = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
const difficultyColor: Record<string, string> = {
  easy: 'text-emerald-400 bg-emerald-900/30 border-emerald-700',
  medium: 'text-amber-400 bg-amber-900/30 border-amber-700',
  hard: 'text-red-400 bg-red-900/30 border-red-700',
};

type TestForm = {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number;
  is_active: boolean;
};

const emptyForm: TestForm = {
  title: '',
  description: '',
  difficulty: 'medium',
  time_limit: 600,
  is_active: true,
};

export default function AdminTests() {
  const { profile } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Test | null>(null);
  const [form, setForm] = useState<TestForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.from('tests').select('*').order('created_at');
    setTests(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditTarget(null);
    setError('');
    setModal('create');
  }

  function openEdit(test: Test) {
    setForm({
      title: test.title,
      description: test.description,
      difficulty: test.difficulty,
      time_limit: test.time_limit,
      is_active: test.is_active,
    });
    setEditTarget(test);
    setError('');
    setModal('edit');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Название обязательно'); return; }
    setSaving(true);
    setError('');

    if (modal === 'create') {
      const { error } = await supabase.from('tests').insert({ ...form, created_by: profile?.id });
      if (error) { setError('Ошибка создания теста'); setSaving(false); return; }
    } else if (editTarget) {
      const { error } = await supabase.from('tests').update(form).eq('id', editTarget.id);
      if (error) { setError('Ошибка обновления теста'); setSaving(false); return; }
    }

    setSaving(false);
    setModal(null);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from('tests').delete().eq('id', id);
    setDeleteConfirm(null);
    load();
  }

  async function toggleActive(test: Test) {
    await supabase.from('tests').update({ is_active: !test.is_active }).eq('id', test.id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Тесты</h1>
          <p className="text-slate-400 text-sm mt-1">{tests.length} тестов в системе</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/30"
        >
          <Plus className="w-4 h-4" />
          Создать тест
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-white/5">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">Тесты не найдены</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map(test => (
            <div key={test.id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
              <div className="w-10 h-10 bg-blue-900/50 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white truncate">{test.title}</span>
                  {!test.is_active && (
                    <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">Скрыт</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColor[test.difficulty]}`}>
                    {difficultyLabel[test.difficulty]}
                  </span>
                  <span className="text-xs text-slate-500">{Math.floor(test.time_limit / 60)} мин</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(test)}
                  className={`p-2 rounded-lg transition-all ${test.is_active ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-slate-500 hover:bg-slate-700'}`}
                  title={test.is_active ? 'Скрыть' : 'Показать'}
                >
                  {test.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEdit(test)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(test.id)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-red-900/30 hover:text-red-400 transition-all"
                >
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
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">{modal === 'create' ? 'Новый тест' : 'Редактировать тест'}</h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-700 text-red-400 rounded-xl px-3 py-2.5 text-xs mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Название</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="Название теста"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Описание</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  placeholder="Описание теста"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Сложность</label>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="easy">Лёгкий</option>
                    <option value="medium">Средний</option>
                    <option value="hard">Сложный</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Время (сек.)</label>
                  <input
                    type="number"
                    value={form.time_limit}
                    onChange={e => setForm(f => ({ ...f, time_limit: parseInt(e.target.value) || 600 }))}
                    min={60}
                    max={3600}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`w-10 h-5 rounded-full transition-all ${form.is_active ? 'bg-blue-500' : 'bg-slate-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-all ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-slate-300">Активен</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-white/10 rounded-xl text-slate-400 text-sm hover:bg-slate-800 transition-all">
                  Отмена
                </button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white text-sm font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-60">
                  <Check className="w-4 h-4" />
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Удалить тест?</h3>
                <p className="text-slate-400 text-xs">Вопросы и попытки тоже будут удалены</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-white/10 rounded-xl text-slate-400 text-sm hover:bg-slate-800 transition-all">
                Отмена
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-semibold transition-all">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
