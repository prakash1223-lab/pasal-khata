import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SearchBar({ value, onChange, placeholder = 'Search...', onClear }) {
  return (
    <div className="relative">
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent placeholder-gray-400"
      />
      {value && (
        <button
          onClick={() => { onChange(''); onClear && onClear(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <XMarkIcon className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}
