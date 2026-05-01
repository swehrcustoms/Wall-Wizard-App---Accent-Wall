import raw from './patternTemplates.json';

const STATIC_TEMPLATES = raw.map((t, i) => ({
  id: `static-${t.key}`,
  user_id: null,
  type: 'template',
  status: 'draft',
  name: t.name,
  wall_dims: t.wall_dims,
  obstacles: [],
  pattern: t.pattern,
  materials: t.materials,
  pricing: t.pricing,
  client: null,
  thumbnail_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  _key: t.key,
}));

export default STATIC_TEMPLATES;
