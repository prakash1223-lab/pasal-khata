export default function EmptyState({ icon = '📭', title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-base font-bold text-gray-700 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mb-5 max-w-[240px]">{subtitle}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-[#1a56db] text-white text-sm font-semibold px-5 py-2.5 rounded-xl active:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
