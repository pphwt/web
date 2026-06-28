const stripApiPrefix = (value) => {
  const base = (value || 'http://localhost:8010').replace(/\/+$/, '');
  return base.replace(/\/api\/v1$/, '');
};

export const MODEL_API_BASE = stripApiPrefix(
  import.meta.env.VITE_MODEL_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8010'
);
