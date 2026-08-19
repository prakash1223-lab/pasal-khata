import { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/solid';

const STYLES = {
  success: { bg: 'bg-green-600',  icon: CheckCircleIcon },
  error:   { bg: 'bg-[#e02424]', icon: XCircleIcon },
  warning: { bg: 'bg-amber-500',  icon: ExclamationTriangleIcon },
};

function Toast({ id, message, type = 'success', onClose }) {
  const { bg, icon: Icon } = STYLES[type] ?? STYLES.success;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => { setVisible(false); setTimeout(() => onClose(id), 300); }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex items-start gap-3 ${bg} text-white px-4 py-3 rounded-2xl shadow-lg
        transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      <button onClick={() => onClose(id)} className="flex-shrink-0">
        <XMarkIcon className="w-4 h-4 opacity-70 hover:opacity-100" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-4 left-4 right-4 max-w-[430px] mx-auto z-[100] space-y-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
