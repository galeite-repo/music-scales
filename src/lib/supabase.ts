import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Scale {
  id: string;
  name: string;
  type: 'mixolidio' | 'menor';
  notes: string;
  exercise: string;
  lick: string;
  dominantes: string;
  lick_inicio: string;
  lick_final: string;
  order_index: number;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}
