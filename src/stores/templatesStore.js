import { create } from 'zustand';
import { supabase } from '@/utils/supabase';

export const useTemplatesStore = create((set, get) => ({
  templates: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('type', 'template')
      .order('name');
    if (!error && data) set({ templates: data });
    set({ loading: false });
  },

  save: async (template) => {
    const { data, error } = await supabase
      .from('designs')
      .upsert(template)
      .select()
      .single();
    if (!error && data) {
      set((s) => {
        const existing = s.templates.findIndex((t) => t.id === data.id);
        if (existing >= 0) {
          const arr = [...s.templates];
          arr[existing] = data;
          return { templates: arr };
        }
        return { templates: [...s.templates, data] };
      });
    }
    return { data, error };
  },

  remove: async (id) => {
    const { error } = await supabase.from('designs').delete().eq('id', id);
    if (!error) {
      set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
    }
    return { error };
  },
}));
