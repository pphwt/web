/**
 * Bioelectric PINN Clinical Constants
 */

// Single source of truth for the backend base URL. VITE_API_URL is documented
// (bioelectric-web skill, .env.local) as the bare host with no /api/v1 suffix,
// but several call sites historically appended paths straight onto the raw
// env var and broke as soon as it lacked the suffix — this normalizes both
// forms so it works either way instead of silently 404ing.
const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
export const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

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
