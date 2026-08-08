/**
 * Bioelectric PINN Clinical Constants
 */

// Single source of truth for the backend base URL. VITE_API_URL is documented
// (bioelectric-web skill, .env.local) as the bare host with no /api/v1 suffix,
// but several call sites historically appended paths straight onto the raw
// env var and broke as soon as it lacked the suffix — this normalizes both
// forms so it works either way instead of silently 404ing.
const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const runtimeLocation = globalThis.location;
const runtimeOrigin = runtimeLocation?.origin || '';
const developmentApiUrl = runtimeLocation?.hostname
    ? `${runtimeLocation.protocol}//${runtimeLocation.hostname}:8000`
    : 'http://localhost:8000';
const rawApiUrl = (configuredApiUrl || (import.meta.env.DEV ? developmentApiUrl : runtimeOrigin))
    .replace(/\/+$/, '');

export const API_ORIGIN = rawApiUrl.replace(/\/api\/v1$/, '');
export const API_BASE = `${API_ORIGIN}/api/v1`;

const retiredApiHosts = new Set(['bioelectric-backend.onrender.com']);
let apiConfigurationError = '';

try {
    const apiUrl = new URL(API_ORIGIN);
    if (import.meta.env.PROD && !configuredApiUrl) {
        apiConfigurationError = 'Production build ยังไม่ได้กำหนด VITE_API_URL สำหรับ ECG backend';
    } else if (retiredApiHosts.has(apiUrl.hostname)) {
        apiConfigurationError = `ECG backend เดิม (${apiUrl.hostname}) ไม่ได้ให้บริการแล้ว`;
    } else if (runtimeLocation?.protocol === 'https:' && apiUrl.protocol !== 'https:') {
        apiConfigurationError = 'หน้าเว็บ HTTPS ไม่สามารถเรียก ECG backend ผ่าน HTTP ได้';
    }
} catch {
    apiConfigurationError = 'VITE_API_URL ไม่ใช่ URL ที่ถูกต้อง';
}

export const API_CONFIGURATION_ERROR = apiConfigurationError;

export const CLINICAL_THRESHOLDS = {
    HEART_RATE: {
        BRADYCARDIA: 60,
        TACHYCARDIA: 100,
        UNIT: 'BPM'
    },
    QTC_INTERVAL: {
        NORMAL_MAX: 450,
        CRITICAL_MAX: 500,
        UNIT: 'ms'
    },
    QRS_DURATION: {
        NORMAL_MAX: 120,
        UNIT: 'ms'
    },
    PR_INTERVAL: {
        NORMAL_MIN: 120,
        NORMAL_MAX: 200,
        UNIT: 'ms'
    },
    AI_CONFIDENCE: {
        HIGH: 0.95,
        MEDIUM: 0.85,
        LOW: 0.70
    }
};

export const ORGAN_MODES = {
    CARDIAC: 'cardiac',
    NEUROLOGICAL: 'neurological'
};

export const PHYSICS_DEFAULTS = {
    EXCITATION_THRESHOLD: 0.1,
    POTENTIAL_SCALING: 8.0,
    DIFFUSION_COEFFICIENT: 0.0001
};
