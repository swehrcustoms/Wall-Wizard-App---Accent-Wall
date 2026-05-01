import { create } from 'zustand';
import { supabase } from '@/utils/supabase';

const DEFAULT_SETTINGS = {
  business_info: { name: '', address: '', phone: '', email: '', logo_url: '' },
  defaults: { margin: 0.4, labor_hrs: 8, labor_rate: 50, supplier: 'hd' },
  tax_rate: 0.06875,
  quote_terms:
    'Quote valid for 30 days. 50% deposit required to schedule. Final payment due upon completion.',
};

export const useSessionStore = create((set, get) => ({
  user: null,
  settings: DEFAULT_SETTINGS,
  loading: true,

  hydrate: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    set({ user, loading: false });

    if (user) {
      await get().fetchSettings(user.id);
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      set({ user: u });
      if (u) await get().fetchSettings(u.id);
    });
  },

  fetchSettings: async (userId) => {
    const { data } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) set({ settings: { ...DEFAULT_SETTINGS, ...data } });
  },

  signIn: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, settings: DEFAULT_SETTINGS });
  },

  updateSettings: async (patch) => {
    const { user } = get();
    if (!user) return;
    const merged = { ...get().settings, ...patch };
    set({ settings: merged });
    await supabase.from('settings').upsert({ user_id: user.id, ...merged });
  },
}));
