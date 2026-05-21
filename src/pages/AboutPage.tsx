import { BookOpen, Target, Zap, Shield, Award, Users, CheckCircle2 } from 'lucide-react';

const features = [
  { icon: Target, title: 'Точные тесты', desc: 'Вопросы составлены по правилам современного русского литературного языка' },
  { icon: Zap, title: 'Мгновенные результаты', desc: 'Получайте оценку и подробный разбор ошибок сразу после теста' },
  { icon: Shield, title: 'Уровни сложности', desc: 'Три уровня: лёгкий, средний и сложный — для любого уровня знаний' },
  { icon: Award, title: 'Система баллов', desc: 'Отслеживайте прогресс и сравнивайте результаты с прошлыми попытками' },
  { icon: Users, title: 'Личный профиль', desc: 'Сохраняйте историю прохождений и следите за своим развитием' },
  { icon: BookOpen, title: 'Разделы грамматики', desc: 'Тесты охватывают пунктуацию, орфографию, морфологию и синтаксис' },
];

const topics = [
  'Правила пунктуации',
  'Части речи',
  'Склонения и спряжения',
  'Сложные предложения',
  'Орфография',
  'Морфология',
  'Лексика',
  'Стилистика',
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/50 mb-5">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">О программе ГрамТест</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-xl mx-auto">
          Интерактивная платформа для проверки и улучшения знаний грамматики русского языка.
          Создана для учеников, студентов и всех, кто хочет говорить и писать грамотно.
        </p>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Возможности платформы</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-all">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Темы тестов</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {topics.map(topic => (
            <div key={topic} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              {topic}
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Как это работает</h2>
        <div className="space-y-3">
          {[
            { step: '01', title: 'Зарегистрируйтесь', desc: 'Создайте аккаунт, чтобы сохранять результаты и отслеживать прогресс' },
            { step: '02', title: 'Выберите тест', desc: 'Выберите тему и уровень сложности из доступных тестов' },
            { step: '03', title: 'Пройдите тест', desc: 'Отвечайте на вопросы с учётом ограничения по времени' },
            { step: '04', title: 'Изучите результаты', desc: 'Просматривайте правильные ответы, объяснения и статистику' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center py-6 border-t border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-400 dark:text-slate-500">
          ГрамТест — учитесь, проверяйте знания, совершенствуйтесь
        </p>
        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Версия 1.0 · 2025</p>
      </div>
    </div>
  );
}
