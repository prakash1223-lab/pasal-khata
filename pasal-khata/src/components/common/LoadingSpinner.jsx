export default function LoadingSpinner({ size = 'md', color = 'blue' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const colorMap = { blue: 'border-[#1a56db]', green: 'border-[#057a55]', white: 'border-white' };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeMap[size]} ${colorMap[color]} border-2 border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}
