export default function MetricCard({ label, value, color = 'blue', fullWidth = false, icon }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      label: 'text-blue-600',
      value: 'text-blue-700',
      dot: 'bg-blue-500',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-100',
      label: 'text-green-600',
      value: 'text-green-700',
      dot: 'bg-green-500',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      label: 'text-red-600',
      value: 'text-red-700',
      dot: 'bg-red-500',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      label: 'text-amber-600',
      value: 'text-amber-700',
      dot: 'bg-amber-500',
    },
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`${c.bg} border ${c.border} rounded-2xl p-4 ${fullWidth ? 'col-span-2' : ''}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-base">{icon}</span>}
        <p className={`text-xs font-medium ${c.label}`}>{label}</p>
      </div>
      <p className={`text-xl font-bold ${c.value}`}>{value}</p>
    </div>
  );
}
