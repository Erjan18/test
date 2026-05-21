/*
  # Grammar Test Application Schema

  1. New Tables
    - `profiles` - Extended user profiles with role, stats
      - `id` (uuid, FK to auth.users)
      - `username` (text)
      - `role` (text: 'user' | 'admin')
      - `avatar_url` (text, nullable)
      - `total_tests` (int)
      - `total_score` (int)
      - `created_at` (timestamp)

    - `tests` - Grammar test definitions
      - `id` (uuid, PK)
      - `title` (text)
      - `description` (text)
      - `difficulty` (text: 'easy' | 'medium' | 'hard')
      - `time_limit` (int, seconds)
      - `is_active` (bool)
      - `created_by` (uuid, FK profiles)
      - `created_at` (timestamp)

    - `questions` - Test questions
      - `id` (uuid, PK)
      - `test_id` (uuid, FK tests)
      - `question_text` (text)
      - `options` (jsonb, array of strings)
      - `correct_answer` (int, index of correct option)
      - `explanation` (text, nullable)
      - `order_index` (int)
      - `created_at` (timestamp)

    - `test_attempts` - User test attempts/history
      - `id` (uuid, PK)
      - `user_id` (uuid, FK profiles)
      - `test_id` (uuid, FK tests)
      - `score` (int)
      - `max_score` (int)
      - `time_spent` (int, seconds)
      - `answers` (jsonb)
      - `completed_at` (timestamp)

  2. Security
    - RLS enabled on all tables
    - Profiles: users can read all, update own; admins can manage all
    - Tests: all can read active; admins can manage all
    - Questions: all can read; admins can manage all
    - Test attempts: users can read/insert own; admins can read all

  3. Seed Data
    - Admin profile setup trigger
    - Sample grammar tests and questions
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url text,
  total_tests int NOT NULL DEFAULT 0,
  total_score int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_limit int NOT NULL DEFAULT 600,
  is_active bool NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tests"
  ON tests FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert tests"
  ON tests FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update tests"
  ON tests FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete tests"
  ON tests FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_answer int NOT NULL DEFAULT 0,
  explanation text,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Test attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  max_score int NOT NULL DEFAULT 0,
  time_spent int NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '[]',
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON test_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own attempts"
  ON test_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can delete attempts"
  ON test_attempts FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update profile stats after test attempt
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET
    total_tests = total_tests + 1,
    total_score = total_score + NEW.score
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_test_attempt_completed ON test_attempts;
CREATE TRIGGER on_test_attempt_completed
  AFTER INSERT ON test_attempts
  FOR EACH ROW EXECUTE FUNCTION update_profile_stats();

-- Insert sample tests and questions
INSERT INTO tests (id, title, description, difficulty, time_limit, is_active) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Правила пунктуации', 'Проверьте свои знания о расстановке знаков препинания в русском языке', 'easy', 300, true),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Части речи', 'Определите части речи и их грамматические признаки', 'medium', 480, true),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Сложные предложения', 'Анализ сложных синтаксических конструкций', 'hard', 600, true),
  ('a1b2c3d4-0001-0001-0001-000000000004', 'Орфография', 'Правила написания слов русского языка', 'easy', 360, true),
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Морфология', 'Склонения, спряжения и другие морфологические категории', 'hard', 720, true)
ON CONFLICT DO NOTHING;

INSERT INTO questions (test_id, question_text, options, correct_answer, explanation, order_index) VALUES
  -- Test 1: Punctuation
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Где нужна запятая?', '["Я пошёл в магазин и купил хлеб", "Я пошёл в магазин, и купил хлеб", "Я пошёл, в магазин и купил хлеб", "Я, пошёл в магазин и купил хлеб"]', 0, 'Однородные члены, соединённые одиночным союзом «и», запятой не разделяются', 0),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Укажите предложение с правильной пунктуацией:', '["Солнце, взошло над горизонтом.", "Солнце взошло, над горизонтом.", "Солнце взошло над горизонтом.", "Солнце взошло над, горизонтом."]', 2, 'В этом простом предложении запятые не нужны', 1),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Как правильно расставить знаки препинания в предложении с обращением «Иван»?', '["Иван принеси воды.", "Иван, принеси воды.", "Иван! принеси воды.", "Иван принеси, воды."]', 1, 'Обращение выделяется запятой', 2),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Нужна ли запятая: «Он устал(,) но продолжал работать»?', '["Да, запятая нужна", "Нет, запятая не нужна", "Нужна точка с запятой", "Нужно тире"]', 0, 'Перед противительным союзом «но» всегда ставится запятая', 3),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Как выделяются вводные слова?', '["Не выделяются", "Выделяются запятыми", "Выделяются скобками", "Выделяются тире"]', 1, 'Вводные слова и словосочетания выделяются запятыми с обеих сторон', 4),
  -- Test 2: Parts of Speech
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Какой частью речи является слово «бегать»?', '["Существительное", "Прилагательное", "Глагол", "Наречие"]', 2, 'Слово «бегать» обозначает действие и является глаголом', 0),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Определите падеж существительного «дому» в предложении «Я иду к дому»', '["Именительный", "Родительный", "Дательный", "Винительный"]', 2, 'После предлога «к» существительное стоит в дательном падеже', 1),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Какое из слов является наречием?', '["красивый", "красиво", "красота", "красить"]', 1, 'Наречие «красиво» отвечает на вопрос «как?» и не изменяется', 2),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Укажите прилагательное в краткой форме:', '["красивый", "красивее", "красив", "красота"]', 2, 'Краткая форма прилагательного «красив» образована усечением окончания', 3),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Местоимение «себя» является:', '["Личным", "Возвратным", "Притяжательным", "Указательным"]', 1, 'Местоимение «себя» — возвратное, указывает на того, кто совершает действие', 4),
  -- Test 3: Complex sentences
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Сложносочинённое предложение соединяется:', '["Подчинительными союзами", "Сочинительными союзами", "Без союзов", "Союзными словами"]', 1, 'Сложносочинённые предложения соединяются сочинительными союзами (и, а, но, или и др.)', 0),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Укажите сложноподчинённое предложение:', '["Светит солнце, дует ветер.", "Я знаю, что ты прав.", "Пришла весна — растаял снег.", "Он читал, она писала."]', 1, 'Придаточное предложение присоединяется к главному союзом «что»', 1),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Какой союз используется в условных придаточных?', '["потому что", "хотя", "если", "который"]', 2, 'Союз «если» используется в условных придаточных предложениях', 2),
  -- Test 4: Orthography
  ('a1b2c3d4-0001-0001-0001-000000000004', 'Как правильно написать: «прИложение» или «прЕложение»?', '["прИложение", "прЕложение", "Оба варианта верны", "прАложение"]', 0, 'В слове «приложение» пишется приставка «при-» со значением присоединения', 0),
  ('a1b2c3d4-0001-0001-0001-000000000004', 'Выберите правильное написание:', '["рости", "расти", "разти", "ращти"]', 1, 'Правильное написание — «расти», корень «-раст-/-рос-»', 1),
  ('a1b2c3d4-0001-0001-0001-000000000004', 'Как пишется «не» с прилагательным «красивый»?', '["не красивый (всегда раздельно)", "некрасивый (всегда слитно)", "Зависит от контекста", "нэкрасивый"]', 2, '«Не» с прилагательными пишется слитно, если нет противопоставления, и раздельно при противопоставлении', 2),
  ('a1b2c3d4-0001-0001-0001-000000000004', 'Выберите слово с удвоенной согласной:', '["калорийный", "коллекция", "колонна выбор a или b?", "коллонна"]', 1, 'Слово «коллекция» пишется с удвоенной «л»', 3),
  -- Test 5: Morphology
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Глагол «читать» относится к:', '["I спряжению", "II спряжению", "Разноспрягаемым глаголам", "Недостаточным глаголам"]', 0, 'Глаголы на «-ать» (кроме исключений) относятся к I спряжению', 0),
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Существительное «путь» относится к:', '["I склонению", "II склонению", "III склонению", "Разносклоняемым"]', 2, 'Существительное «путь» — единственное существительное мужского рода, относящееся к III склонению', 1),
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Какой вид имеет глагол «написать»?', '["Несовершенный", "Совершенный", "Двувидовой", "Не имеет вида"]', 1, 'Глагол «написать» отвечает на вопрос «что сделать?» и имеет совершенный вид', 2),
  ('a1b2c3d4-0001-0001-0001-000000000005', 'Определите число имени существительного «ножницы»:', '["Единственное", "Множественное", "Имеет оба числа", "Нет числа (Pluralia tantum)"]', 3, 'Слово «ножницы» употребляется только во множественном числе (Pluralia tantum)', 3)
ON CONFLICT DO NOTHING;
