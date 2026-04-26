/**
 * DiagnosticService
 * Handles communication with the backend for capturing snapshots and retrieving history.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('bio_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const diagnosticService = {
  /**
   * Capture current diagnostic state
   */
  async captureSnapshot(data) {
    try {
      const response = await fetch(`${API_URL}/reports/capture/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Failed to capture snapshot');
      }
      return result;
    } catch (error) {
      console.error('Failed to capture snapshot:', error);
      throw error;
    }
  },

  /**
   * Get past snapshots for a patient
   */
  async getHistory(patientId) {
    try {
      const response = await fetch(`${API_URL}/reports/history/${patientId}/`, {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Failed to fetch history');
      }
      return result;
    } catch (error) {
      console.error('Failed to fetch history:', error);
      throw error;
    }
  },

  /**
   * Download a report as PDF
   */
  async downloadReportPDF(reportId) {
    try {
      const response = await fetch(`${API_URL}/reports/export/${reportId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('bio_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Diagnostic_Report_${reportId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw error;
    }
  }
};
