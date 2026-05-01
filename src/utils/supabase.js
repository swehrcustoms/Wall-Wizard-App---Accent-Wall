import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn(
    'Supabase env vars missing. Copy .env.example → .env.local and fill in your project credentials.'
  );
}

// Fall back to a placeholder URL so createClient doesn't throw when env vars
// are absent (e.g. local preview without .env.local). All Supabase calls will
// fail gracefully — auth store handles errors without crashing the app.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key'
);
