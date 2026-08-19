import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function TopBar({ title, subtitle, showBack = false, rightElement }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {rightElement && <div className="flex items-center gap-2">{rightElement}</div>}
      </div>
    </div>
  );
}
