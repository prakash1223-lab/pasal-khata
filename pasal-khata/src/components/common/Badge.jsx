export default function Badge({ label, color = 'gray', size = 'sm' }) {
  const colorMap = {
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-600',
    teal: 'bg-teal-100 text-teal-700',
  };

  const sizeMap = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorMap[color] || colorMap.gray} ${sizeMap[size] || sizeMap.sm}`}>
      {label}
    </span>
  );
}
