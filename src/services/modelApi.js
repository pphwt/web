import { API_ORIGIN } from '../utils/constants';

const stripApiPrefix = (value) => {
  const base = value.replace(/\/+$/, '');
  return base.replace(/\/api\/v1$/, '');
};

export const MODEL_API_BASE = stripApiPrefix(
  import.meta.env.VITE_MODEL_API_URL ||
  API_ORIGIN
);

export const CLINICAL_API_BASE = API_ORIGIN;

const parseJson = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `Model API HTTP ${response.status}`);
  }
  return payload;
};

const ECG_UPLOAD_MAX_BYTES = Number(import.meta.env.VITE_ECG_UPLOAD_MAX_BYTES || 2_000_000);
const ECG_IMAGE_UPLOAD_MAX_BYTES = Number(import.meta.env.VITE_ECG_IMAGE_UPLOAD_MAX_BYTES || 20_000_000);

// Exported so every upload surface shares the same ECG format and size rules.
// shares one definition instead of re-declaring this regex -- previously
// duplicated in 4 places, which is how new formats (e.g. webp) silently
// missed some of them.
export const isImageEcgFile = (file) => {
  if (!file) return false;
  return file.type?.startsWith('image/') || file.type === 'application/pdf' || /\.(png|jpe?g|webp|bmp|tiff?|hei[cf]|pdf)$/i.test(file.name || '');
};

export const canPreviewImageFile = (file) => {
  if (!file || !isImageEcgFile(file)) return false;
  // PDF and HEIF-family inputs are decoded by the backend; cross-browser img
  // support is inconsistent, so the UI switches to processed_image afterward.
  return !/\.(pdf|hei[cf])$/i.test(file.name || '') && file.type !== 'application/pdf';
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
  refreshAccessToken: async (options = {}) => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: authHeaders(),
    signal: options.signal,
  })),

  progressSummary: async (options = {}) => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/progress/summary`, {
    headers: authHeaders(),
    signal: options.signal,
  })),

  evidencePack: async (options = {}) => {
    const response = await fetch(`${CLINICAL_API_BASE}/api/v1/progress/evidence-pack`, {
      headers: authHeaders(),
      signal: options.signal,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || `Evidence pack HTTP ${response.status}`);
    }
    const disposition = response.headers.get('content-disposition') || '';
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'bioelectric-evidence.zip';
    return { blob: await response.blob(), filename };
  },

  researchRuns: async (options = {}) => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/research/runs`, {
    headers: authHeaders(),
    signal: options.signal,
  })),

  researchRun: async (runId, options = {}) => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/research/runs/${encodeURIComponent(runId)}`, {
    headers: authHeaders(),
    signal: options.signal,
  })),

  auditEvents: async (options = {}) => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/audit/events?limit=${options.limit || 100}`, {
    headers: authHeaders(),
    signal: options.signal,
  })),

  auditIntegrity: async (options = {}) => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/audit/integrity`, {
    headers: authHeaders(),
    signal: options.signal,
  })),

  health: async () => parseJson(await fetch(`${MODEL_API_BASE}/api/v1/health`)),

  metrics: async () => parseJson(await fetch(`${MODEL_API_BASE}/api/v1/localization/metrics`, {
    headers: authHeaders(),
  })),

  samples: async (limit = 24) =>
    parseJson(await fetch(`${MODEL_API_BASE}/api/v1/localization/samples?limit=${limit}`, {
      headers: authHeaders(),
    })),

  demoSamples: async (limit = 24) =>
    parseJson(await fetch(`${MODEL_API_BASE}/api/v1/localization/demo-samples?limit=${limit}`, {
      headers: authHeaders(),
    })),

  demoCases: async (options = {}) => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/demo/cases`, {
    headers: authHeaders(),
    signal: options.signal,
  })),

  runDemoCase: async (caseId, options = {}) => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/demo/cases/${encodeURIComponent(caseId)}/run`, {
    method: 'POST',
    headers: authHeaders(),
    signal: options.signal,
  })),

  analyzeSample: async (sampleId, options = {}) => {
    const form = new FormData();
    form.append('sample_id', sampleId);
    return parseJson(await fetch(`${MODEL_API_BASE}/api/v1/localization/analyze`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
      signal: options.signal,
    }));
  },

  analyzeFile: async (file, options = {}) => {
    if (file.size > ECG_UPLOAD_MAX_BYTES) {
      throw new Error(`ECG file is too large. Max ${(ECG_UPLOAD_MAX_BYTES / 1024 / 1024).toFixed(1)} MB.`);
    }
    const form = new FormData();
    form.append('file', file);
    return parseJson(await fetch(`${MODEL_API_BASE}/api/v1/localization/analyze`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
      signal: options.signal,
    }));
  },

  // Real clinical-file path: standard formats + neurokit2 measurements + honest
  // localizer gating (see backend /ecg/analyze).
  analyzeEcgFile: async (fileOrFiles, ocrOnly = false, layoutOverride = null, options = {}) => {
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
    if (options.localizationMode) {
      form.append('localization_mode', options.localizationMode);
    }
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/ecg/analyze`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
      signal: options.signal,
    }));
  },

  ecgFormats: async () => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/ecg/formats`, {
    headers: authHeaders(),
  })),

  saveEcgReport: async ({ patient_id, result, notes, source_name, referral_destination }, options = {}) => {
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/ecg/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        patient_id,
        result,
        notes: notes || '',
        source_name: source_name || null,
        referral_destination: referral_destination || null,
      }),
      signal: options.signal,
    }));
  },

  ecgReferralLetterBlob: async ({ result, files, file, sampleId, patient, clinicianNote, referralDestination, locale = 'th-TH' }, options = {}) => {
    const form = new FormData();
    form.append('patient_name', patient?.name || 'ไม่ระบุชื่อ');
    form.append('patient_id_card', patient?.id_card || '');
    form.append('patient_age', String(patient?.age || ''));
    form.append('patient_gender', patient?.gender || '');
    form.append('patient_blood_type', patient?.blood_type || '');
    form.append('patient_allergies', patient?.allergies || '');
    form.append('clinician_note', clinicianNote || '');
    form.append('referral_destination', referralDestination || '');
    form.append('locale', locale);
    if (result) form.append('ecg_result_json', JSON.stringify(result));
    else if (Array.isArray(files)) files.forEach((item) => form.append('files', item));
    else if (file) form.append('file', file);
    else form.append('sample_id', sampleId || '');

    const response = await fetch(`${CLINICAL_API_BASE}/api/v1/ecg/referral-letter`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
      signal: options.signal,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || `Referral letter HTTP ${response.status}`);
    }
    return response.blob();
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

  analyzeEcgSample: async (sampleId, options = {}) => {
    const form = new FormData();
    form.append('sample_id', sampleId);
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/ecg/analyze`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
      signal: options.signal,
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

  uploadReportAttachment: async (reportId, file, options = {}) => {
    const form = new FormData();
    form.append('file', file);
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/attachments/reports/${reportId}/attachments`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
      signal: options.signal,
    }));
  },

  getPatientReports: async (patientId) => parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/reports/history/${encodeURIComponent(patientId)}`, {
    headers: authHeaders(),
  })),

  getReportAttachments: async (reportId) => {
    return parseJson(await fetch(`${CLINICAL_API_BASE}/api/v1/attachments/reports/${reportId}/attachments`, {
      headers: authHeaders(),
    }));
  },
};
