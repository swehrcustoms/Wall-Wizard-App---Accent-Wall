import { supabase } from '@/utils/supabase';
import { useSessionStore } from '@/stores/sessionStore';
import STATIC_TEMPLATES from '@/constants/staticTemplates';

export function useTemplates() {
  const user = useSessionStore((s) => s.user);

  const list = async () => {
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('type', 'template')
      .or(`user_id.is.null,user_id.eq.${user?.id ?? '00000000-0000-0000-0000-000000000000'}`)
      .order('name');

    if (error) {
      return { data: STATIC_TEMPLATES, error: null };
    }
    return { data: data ?? STATIC_TEMPLATES, error: null };
  };

  const save = async (template) => {
    const payload = {
      ...template,
      user_id: user?.id,
      type: 'template',
    };
    const { data, error } = await supabase
      .from('designs')
      .upsert(payload)
      .select()
      .single();
    return { data, error };
  };

  const remove = async (id) => {
    const { error } = await supabase.from('designs').delete().eq('id', id);
    return { error };
  };

  return { list, save, remove };
}
