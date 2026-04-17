/**
 * @typedef {Object} Patient
 * @property {string} id - The unique identifier of the patient.
 * @property {string} name - The name of the patient.
 * @property {number} [age] - The age of the patient.
 * @property {string} [gender] - The gender of the patient.
 * @property {string} status - Current clinical status.
 * @property {string} [color] - The UI color associated with the patient's status.
 * @property {number} [bpm] - The average heart rate.
 * @property {string} [type] - Rhythm type, e.g., 'Sinus Rhythm' or 'Tachycardia'.
 */

/**
 * @typedef {Object} ReportDetail
 * @property {string} label - The metric label.
 * @property {string} value - The metric value.
 * @property {string} [color] - Optional color to highlight the value.
 */

/**
 * @typedef {Object} Report
 * @property {string} patientId - Associated patient ID.
 * @property {string} type - Report descriptive type.
 * @property {'URGENT ALERT' | 'ANALYZING' | 'COMPLETED'} status - Report processing status.
 * @property {'Heart' | 'Brain' | 'Activity'} icon - Icon type for the report.
 * @property {string} time - Report generation time.
 * @property {ReportDetail[]} details - The details array.
 */
