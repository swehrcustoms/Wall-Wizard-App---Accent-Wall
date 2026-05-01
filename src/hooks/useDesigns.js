import { supabase } from '@/utils/supabase';
import { useSessionStore } from '@/stores/sessionStore';

export function useDesigns() {
  const user = useSessionStore((s) => s.user);

  const list = async (type = 'job') => {
    if (!user) return { data: [], error: null };
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', type)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false });
    return { data: data ?? [], error };
  };

  const get = async (id) => {
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  };

  const save = async (design) => {
    const payload = {
      ...design,
      user_id: user?.id,
      wall_dims: design.wallDims ?? design.wall_dims,
      updated_at: new Date().toISOString(),
    };
    delete payload.wallDims;

    if (payload.id) {
      const { data, error } = await supabase
        .from('designs')
        .update(payload)
        .eq('id', payload.id)
        .select()
        .single();
      return { data, error };
    } else {
      const { data, error } = await supabase
        .from('designs')
        .insert(payload)
        .select()
        .single();
      return { data, error };
    }
  };

  const remove = async (id) => {
    const { error } = await supabase.from('designs').delete().eq('id', id);
    return { error };
  };

  return { list, get, save, remove };
}
