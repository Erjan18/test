import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  role: 'user' | 'admin';
  avatar_url: string | null;
  total_tests: number;
  total_score: number;
  created_at: string;
};

export type Test = {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
};

export type Question = {
  id: string;
  test_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  order_index: number;
  created_at: string;
};

export type TestAttempt = {
  id: string;
  user_id: string;
  test_id: string;
  score: number;
  max_score: number;
  time_spent: number;
  answers: number[];
  completed_at: string;
  tests?: Test;
};
