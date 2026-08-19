import { useNetwork } from '../../context/NetworkContext';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * Slim banner shown at the top of every page to show sync status.
 * Hidden when fully online with no pending items.
 */
export function OfflineBar() {
  const { isOnline, pendingCount, isSyncing } = useNetwork();
  const { lang } = useTranslation();

  // Fully online and synced — hide completely
  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  if (!isOnline) {
    return (
      <div style={{
        background:    '#92400e',
        color:         '#fff',
        padding:       '7px 16px',
        display:       'flex',
        alignItems:    'center',
        gap:           '8px',
        fontSize:      '12px',
        fontWeight:    '500',
        letterSpacing: '0.01em',
      }}>
        <span>📴</span>
        <span>
          {lang === 'np'
            ? `अफलाइन — ${pendingCount} कारोबार sync हुन बाँकी`
            : `Offline mode — ${pendingCount} action${pendingCount !== 1 ? 's' : ''} pending sync`}
        </span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div style={{
        background:    '#1d4ed8',
        color:         '#fff',
        padding:       '7px 16px',
        display:       'flex',
        alignItems:    'center',
        gap:           '8px',
        fontSize:      '12px',
        fontWeight:    '500',
      }}>
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>🔄</span>
        <span>
          {lang === 'np'
            ? `सर्भरसँग sync हुँदैछ...`
            : `Syncing ${pendingCount} pending action${pendingCount !== 1 ? 's' : ''}...`}
        </span>
        <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (isOnline && pendingCount > 0) {
    return (
      <div style={{
        background:    '#d97706',
        color:         '#fff',
        padding:       '7px 16px',
        display:       'flex',
        alignItems:    'center',
        gap:           '8px',
        fontSize:      '12px',
        fontWeight:    '500',
      }}>
        <span>⏳</span>
        <span>
          {lang === 'np'
            ? `${pendingCount} कारोबार sync हुन बाँकी`
            : `${pendingCount} action${pendingCount !== 1 ? 's' : ''} waiting to sync`}
        </span>
      </div>
    );
  }

  return null;
}

export default OfflineBar;
