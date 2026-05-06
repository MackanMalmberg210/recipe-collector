type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
};

export default function SearchBar({
  value,
  onChange,
  suggestions,
}: SearchBarProps) {
  const showSuggestions = value.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="relative mb-8 w-full max-w-xl">
      <input
        type="text"
        placeholder="Search recipes or ingredients..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3.5 text-white placeholder:text-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
      />

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onChange(suggestion)}
              className="block w-full px-4 py-3 text-left text-sm text-white transition hover:bg-zinc-800"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
