const stripApiPrefix = (value) => {
  const base = (value || 'http://localhost:8010').replace(/\/+$/, '');
  return base.replace(/\/api\/v1$/, '');
};

export const MODEL_API_BASE = stripApiPrefix(
  import.meta.env.VITE_MODEL_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8010'
);

const parseJson = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `Model API HTTP ${response.status}`);
  }
  return payload;
};

const ECG_UPLOAD_MAX_BYTES = Number(import.meta.env.VITE_ECG_UPLOAD_MAX_BYTES || 2_000_000);

export const modelApi = {
  health: async () => parseJson(await fetch(`${MODEL_API_BASE}/api/v1/health`)),

  metrics: async () => parseJson(await fetch(`${MODEL_API_BASE}/api/v1/localization/metrics`)),

  samples: async (limit = 24) =>
    parseJson(await fetch(`${MODEL_API_BASE}/api/v1/localization/samples?limit=${limit}`)),

  demoSamples: async (limit = 24) =>
    parseJson(await fetch(`${MODEL_API_BASE}/api/v1/localization/demo-samples?limit=${limit}`)),

  analyzeSample: async (sampleId) => {
    const form = new FormData();
    form.append('sample_id', sampleId);
    return parseJson(await fetch(`${MODEL_API_BASE}/api/v1/localization/analyze`, {
      method: 'POST',
      body: form,
    }));
  },

  analyzeFile: async (file) => {
    if (file.size > ECG_UPLOAD_MAX_BYTES) {
      throw new Error(`ECG file is too large. Max ${(ECG_UPLOAD_MAX_BYTES / 1024 / 1024).toFixed(1)} MB.`);
    }
    const form = new FormData();
    form.append('file', file);
    return parseJson(await fetch(`${MODEL_API_BASE}/api/v1/localization/analyze`, {
      method: 'POST',
      body: form,
    }));
  },

  // Real clinical-file path: standard formats + neurokit2 measurements + honest
  // localizer gating (see backend /ecg/analyze).
  analyzeEcgFile: async (file) => {
    if (file.size > ECG_UPLOAD_MAX_BYTES) {
      throw new Error(`ECG file is too large. Max ${(ECG_UPLOAD_MAX_BYTES / 1024 / 1024).toFixed(1)} MB.`);
    }
    const form = new FormData();
    form.append('file', file);
    return parseJson(await fetch(`${MODEL_API_BASE}/api/v1/ecg/analyze`, {
      method: 'POST',
      body: form,
    }));
  },

  ecgFormats: async () => parseJson(await fetch(`${MODEL_API_BASE}/api/v1/ecg/formats`)),

  ecgSamples: async () => parseJson(await fetch(`${MODEL_API_BASE}/api/v1/ecg/samples`)),

  analyzeEcgSample: async (sampleId) => {
    const form = new FormData();
    form.append('sample_id', sampleId);
    return parseJson(await fetch(`${MODEL_API_BASE}/api/v1/ecg/analyze`, {
      method: 'POST',
      body: form,
    }));
  },
};
