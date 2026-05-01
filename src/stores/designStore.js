import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_WALL_DIMS = { width_in: 144, height_in: 96 };
const DEFAULT_PATTERN = {
  type: 'shiplap',
  params: { board_w_in: 7.25, overlap_in: 1, orientation: 'horizontal' },
  layers: { boards: true, trim: true, baseboard: true, background: true },
};
const DEFAULT_PRICING = {
  cost: 0,
  margin: 0.4,
  labor_hrs: 8,
  labor_rate: 50,
  client_price: 0,
  tax: 0,
  profit: 0,
};

const HISTORY_LIMIT = 20;

const blankDraft = () => ({
  id: null,
  name: 'New Job',
  status: 'draft',
  wallDims: { ...DEFAULT_WALL_DIMS },
  obstacles: [],
  pattern: { ...DEFAULT_PATTERN },
  materials: [],
  pricing: { ...DEFAULT_PRICING },
  client: { name: '', email: '', phone: '', address: '' },
  thumbnail_url: null,
});

export const useDesignStore = create(
  persist(
    (set, get) => ({
      ...blankDraft(),
      _history: [],
      _historyIndex: -1,

      setWallDims: (dims) => {
        get()._pushHistory();
        set({ wallDims: dims });
      },

      addObstacle: (obstacle) => {
        get()._pushHistory();
        set((s) => ({ obstacles: [...s.obstacles, obstacle] }));
      },

      removeObstacle: (id) => {
        get()._pushHistory();
        set((s) => ({ obstacles: s.obstacles.filter((o) => o.id !== id) }));
      },

      updateObstacle: (id, patch) => {
        set((s) => ({
          obstacles: s.obstacles.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        }));
      },

      setPattern: (pattern) => {
        get()._pushHistory();
        set({ pattern });
      },

      setMaterials: (materials) => set({ materials }),

      setPricing: (pricing) => set({ pricing }),

      setClient: (client) => set({ client }),

      setName: (name) => set({ name }),

      loadDesign: (design) => {
        set({
          id: design.id,
          name: design.name,
          status: design.status,
          wallDims: design.wall_dims,
          obstacles: design.obstacles ?? [],
          pattern: design.pattern ?? { ...DEFAULT_PATTERN },
          materials: design.materials ?? [],
          pricing: design.pricing ?? { ...DEFAULT_PRICING },
          client: design.client ?? { name: '', email: '', phone: '', address: '' },
          thumbnail_url: design.thumbnail_url ?? null,
          _history: [],
          _historyIndex: -1,
        });
      },

      reset: () =>
        set({
          ...blankDraft(),
          _history: [],
          _historyIndex: -1,
        }),

      undo: () => {
        const { _history, _historyIndex } = get();
        if (_historyIndex < 0) return;
        const snap = _history[_historyIndex];
        set({ ...snap, _historyIndex: _historyIndex - 1 });
      },

      redo: () => {
        const { _history, _historyIndex } = get();
        if (_historyIndex >= _history.length - 1) return;
        const snap = _history[_historyIndex + 1];
        set({ ...snap, _historyIndex: _historyIndex + 1 });
      },

      _pushHistory: () => {
        const { _history, _historyIndex, ...rest } = get();
        const snap = {
          wallDims: rest.wallDims,
          obstacles: rest.obstacles,
          pattern: rest.pattern,
          materials: rest.materials,
          pricing: rest.pricing,
        };
        const trimmed = _history.slice(0, _historyIndex + 1);
        const next = [...trimmed, snap].slice(-HISTORY_LIMIT);
        set({ _history: next, _historyIndex: next.length - 1 });
      },
    }),
    {
      name: 'ww-design-draft',
      partialize: (s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        wallDims: s.wallDims,
        obstacles: s.obstacles,
        pattern: s.pattern,
        materials: s.materials,
        pricing: s.pricing,
        client: s.client,
        thumbnail_url: s.thumbnail_url,
      }),
    }
  )
);
