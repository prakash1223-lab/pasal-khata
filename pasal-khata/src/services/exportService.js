import api from './api';

const TOKEN_KEY = 'pasal_khata_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

/** Download any blob from the API as a file */
async function downloadBlob(url, filename) {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Export failed');
  }
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(objectUrl);
}

export const exportService = {
  /** Download full Excel workbook (5 sheets) */
  excel() {
    const date = new Date().toISOString().split('T')[0];
    return downloadBlob(
      `${import.meta.env.VITE_API_URL}/export/excel`,
      `pasal-khata-${date}.xlsx`
    );
  },

  /** Download full JSON backup */
  json() {
    const date = new Date().toISOString().split('T')[0];
    return downloadBlob(
      `${import.meta.env.VITE_API_URL}/export/all`,
      `pasal-khata-backup-${date}.json`
    );
  },

  /** Trigger a server-side backup and return status */
  async triggerBackup() {
    const res = await api.post('/export/backup');
    return res.data ?? res;
  },

  /** Get info about the last backup */
  async getBackupStatus() {
    const res = await api.get('/export/backup-status');
    return res.data ?? res;
  },
};
