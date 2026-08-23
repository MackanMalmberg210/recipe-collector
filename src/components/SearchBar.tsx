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
    <div className="relative w-full">
      <div className="relative flex items-center">
        {/* Sleek SVG Search Icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-500 dark:text-stone-300">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>

        <input
          type="text"
          placeholder="Search recipes, ingredients, or meal types..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-stone-300 bg-white py-3 pl-11 pr-10 text-sm font-semibold text-stone-950 placeholder:text-stone-500 placeholder:font-normal outline-none transition duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-white/20 dark:bg-[#221d19] dark:text-stone-50 dark:placeholder:text-stone-300 dark:focus:border-amber-400 dark:focus:bg-[#2a241f]"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-700 dark:text-stone-400 dark:hover:text-white cursor-pointer"
            title="Clear search"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl backdrop-blur-xl dark:border-white/12 dark:bg-[#1b1714]">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onChange(suggestion)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-950 dark:text-stone-200 dark:hover:bg-white/5 dark:hover:text-amber-300 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
