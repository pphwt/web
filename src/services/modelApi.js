const stripApiPrefix = (value) => {
  const base = (value || 'http://localhost:8010').replace(/\/+$/, '');
  return base.replace(/\/api\/v1$/, '');
};

export const MODEL_API_BASE = stripApiPrefix(
  import.meta.env.VITE_MODEL_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8010'
);

export const CLINICAL_API_BASE = stripApiPrefix(
  import.meta.env.VITE_API_URL ||
  'http://localhost:8020'
);

const parseJson = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `Model API HTTP ${response.status}`);
  }
  return payload;
};

const ECG_UPLOAD_MAX_BYTES = Number(import.meta.env.VITE_ECG_UPLOAD_MAX_BYTES || 2_000_000);
const ECG_IMAGE_UPLOAD_MAX_BYTES = Number(import.meta.env.VITE_ECG_IMAGE_UPLOAD_MAX_BYTES || 20_000_000);

// Exported so every upload surface (Analysis.jsx, ClinicalEcgAnalyzer.jsx)
// shares one definition instead of re-declaring this regex -- previously
// duplicated in 4 places, which is how new formats (e.g. webp) silently
// missed some of them.
export const isImageEcgFile = (file) => {
  if (!file) return false;
  return file.type?.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(file.name || '');
};

const assertEcgUploadSize = (file) => {
  const limit = isImageEcgFile(file) ? ECG_IMAGE_UPLOAD_MAX_BYTES : ECG_UPLOAD_MAX_BYTES;
  if (file.size > limit) {
    throw new Error(`ECG file ${file.name || ''} is too large. Max ${(limit / 1024 / 1024).toFixed(1)} MB.`);
  }
};

// Clinical /ecg endpoints require JWT (PHI). Attach the stored token.
const authHeaders = () => {
  const token = localStorage.getItem('bio_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
  analyzeEcgFile: async (fileOrFiles, ocrOnly = false, layoutOverride = null) => {
    const form = new FormData();
    if (Array.isArray(fileOrFiles)) {
      fileOrFiles.forEach(f => {
        assertEcgUploadSize(f);
        form.append('files', f);
      });
    } else if (fileOrFiles) {
      assertEcgUploadSize(fileOrFiles);
      form.append('file', fileOrFiles);
    }
    if (ocrOnly) {
      form.append('ocr_only', 'true');
    }
    if (layoutOverride) {
      form.append('layout_override', layoutOverride);
    }
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/ecg/analyze`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    }));
  },

  ecgFormats: async () => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/ecg/formats`, {
    headers: authHeaders(),
  })),

  saveEcgReport: async ({ patient_id, result, notes, source_name }) => {
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/ecg/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ patient_id, result, notes: notes || '', source_name: source_name || null }),
    }));
  },

  ecgReportBlob: async ({ file, files, sampleId, locale = 'th-TH' }) => {
    const form = new FormData();
    if (file) form.append('file', file);
    else if (files) {
      files.forEach(f => form.append('files', f));
    }
    else form.append('sample_id', sampleId);
    form.append('locale', locale);
    const res = await fetch(`${CLINICAL_API_BASE}/api/v1/ecg/report`, {
      method: 'POST', headers: authHeaders(), body: form,
    });
    if (!res.ok) throw new Error(`Report HTTP ${res.status}`);
    return res.blob();
  },

  ecgSamples: async () => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/ecg/samples`, {
    headers: authHeaders(),
  })),

  analyzeEcgSample: async (sampleId) => {
    const form = new FormData();
    form.append('sample_id', sampleId);
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/ecg/analyze`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    }));
  },

  uploadConsentFile: async (patientId, file) => {
    const form = new FormData();
    form.append('file', file);
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/attachments/patients/${patientId}/consent-file`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    }));
  },

  getConsentFile: async (patientId) => {
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/attachments/patients/${patientId}/consent-file`, {
      headers: authHeaders(),
    }));
  },

  uploadReportAttachment: async (reportId, file) => {
    const form = new FormData();
    form.append('file', file);
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/attachments/reports/${reportId}/attachments`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    }));
  },

  getReportAttachments: async (reportId) => {
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/attachments/reports/${reportId}/attachments`, {
      headers: authHeaders(),
    }));
  },
};
