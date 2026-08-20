/**
 * Checks if the server is actually reachable, not just if the browser
 * thinks we're online. navigator.onLine can be true even when the server
 * is down or sleeping (Render cold start).
 */

/**
 * Returns true if the error is a network/timeout issue
 * (server unreachable, sleeping, or connection refused)
 */
export function isNetworkError(err) {
  const msg = err?.message?.toLowerCase() || '';
  return (
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('connect') ||
    msg.includes('waking') ||
    msg.includes('econnrefused') ||
    msg.includes('failed to fetch') ||
    msg.includes('load failed') ||
    msg.includes('503') ||
    msg.includes('internet')
  );
}

/**
 * True if we should treat this as offline
 */
export function isEffectivelyOffline(err) {
  return !navigator.onLine || isNetworkError(err);
}
