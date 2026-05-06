type GroceryItem = {
  name: string;
  bought: boolean;
};

type GroceryListPreviewProps = {
  items: GroceryItem[];
  onToggleBought: (name: string) => void;
  onRemove: (name: string) => void;
  onClear: () => void;
};

function capitalizeWords(value: string) {
  return value
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export default function GroceryListPreview({
  items,
  onToggleBought,
  onRemove,
  onClear,
}: GroceryListPreviewProps) {
  const sortedItems = [...items].sort((a, b) => {
    if (a.bought !== b.bought) {
      return a.bought ? 1 : -1;
    }

    return a.name.localeCompare(b.name);
  });

  const boughtCount = items.filter((item) => item.bought).length;
  const remainingCount = items.length - boughtCount;

  return (
    <section className="rounded-4xl border border-white/8 bg-stone-900/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
      {" "}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">Grocery list</p>
          <h4 className="mt-1 text-lg font-semibold text-stone-50">
            Shopping essentials
          </h4>
          <p className="mt-1 text-sm text-stone-400">
            Missing ingredients from your selected recipes.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-medium text-stone-300 transition hover:bg-white/10 hover:text-stone-50"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/6 bg-stone-900/50 p-3">
          <p className="text-xs text-stone-400">Remaining</p>
          <p className="mt-1 text-lg font-semibold text-stone-50">
            {remainingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-white/6 bg-stone-900/50 p-3">
          <p className="text-xs text-stone-400">Bought</p>
          <p className="mt-1 text-lg font-semibold text-stone-50">
            {boughtCount}
          </p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-stone-700 bg-stone-900/40 p-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-stone-300">
            🛒
          </div>
          <p className="text-sm font-medium text-stone-200">
            Your grocery list is empty
          </p>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            Add missing ingredients from recipe pages or your meal planner to
            build your shopping list.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {sortedItems.map((item) => (
              <div
                key={item.name}
                className={`group flex items-center justify-between gap-3 rounded-[1.1rem] border px-3 py-3 transition ${
                  item.bought
                    ? "border-emerald-500/10 bg-emerald-500/5"
                    : "border-white/6 bg-stone-900/40 hover:border-white/10 hover:bg-stone-900/70"
                }`}
              >
                <div className="min-w-0 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleBought(item.name)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition ${
                      item.bought
                        ? "border-emerald-400 bg-emerald-400 text-stone-950"
                        : "border-stone-600 bg-transparent text-transparent hover:border-emerald-400"
                    }`}
                    aria-label={
                      item.bought
                        ? `Mark ${item.name} as not bought`
                        : `Mark ${item.name} as bought`
                    }
                  >
                    ✓
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-medium ${
                        item.bought
                          ? "text-stone-500 line-through"
                          : "text-stone-100"
                      }`}
                    >
                      {capitalizeWords(item.name)}
                    </p>

                    <p className="mt-0.5 text-xs text-stone-500">
                      {item.bought ? "Already picked up" : "Still needed"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      item.bought
                        ? "bg-emerald-500/10 text-emerald-200"
                        : "bg-amber-500/10 text-amber-200"
                    }`}
                  >
                    {item.bought ? "Bought" : "Need"}
                  </span>

                  <button
                    type="button"
                    onClick={() => onRemove(item.name)}
                    className="rounded-full p-2 text-stone-500 transition hover:bg-white/5 hover:text-red-300"
                    aria-label={`Remove ${item.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/6 pt-3">
            <p className="text-xs text-stone-500">
              {items.length} item{items.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
