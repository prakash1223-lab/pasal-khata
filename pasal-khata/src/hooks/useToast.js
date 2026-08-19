import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  const showSuccess = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const showError   = useCallback((msg) => showToast(msg, 'error'),   [showToast]);
  const showWarning = useCallback((msg) => showToast(msg, 'warning'), [showToast]);

  return { toasts, showToast, showSuccess, showError, showWarning, remove };
}
