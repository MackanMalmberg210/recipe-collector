type GroceryItem = {
  name: string;
  bought: boolean;
};

type GroceryPanelProps = {
  items: GroceryItem[];
  onToggleBought: (name: string) => void;
  onRemove: (name: string) => void;
  onClear: () => void;
};

type GroceryCategory = {
  id: string;
  title: string;
  icon: string;
  keywords: string[];
};

const GROCERY_CATEGORIES: GroceryCategory[] = [
  {
    id: "produce",
    title: "Produce",
    icon: "🥬",
    keywords: [
      "lettuce",
      "tomato",
      "onion",
      "garlic",
      "lemon",
      "lime",
      "pepper",
      "bell pepper",
      "carrot",
      "potato",
      "mushroom",
      "spinach",
      "parsley",
      "dill",
      "basil",
      "cilantro",
      "avocado",
      "broccoli",
      "peas",
    ],
  },
  {
    id: "meat-fish",
    title: "Meat & fish",
    icon: "🥩",
    keywords: [
      "chicken",
      "beef",
      "pork",
      "bacon",
      "ham",
      "turkey",
      "shrimp",
      "salmon",
      "tuna",
      "cod",
      "fish",
    ],
  },
  {
    id: "dairy",
    title: "Dairy & eggs",
    icon: "🥚",
    keywords: [
      "milk",
      "cream",
      "butter",
      "cheese",
      "feta",
      "parmesan",
      "mozzarella",
      "halloumi",
      "yogurt",
      "egg",
      "eggs",
    ],
  },
  {
    id: "pantry",
    title: "Pantry",
    icon: "🫙",
    keywords: [
      "pasta",
      "rice",
      "noodles",
      "flour",
      "sugar",
      "salt",
      "pepper",
      "oil",
      "olive oil",
      "soy sauce",
      "maple syrup",
      "peanut butter",
      "sriracha",
      "vinegar",
      "breadcrumbs",
      "stock",
      "broth",
      "beans",
      "lentils",
    ],
  },
];

function capitalizeWords(value: string) {
  return value
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function getGroceryCategory(itemName: string) {
  const normalizedName = itemName.toLowerCase();

  return (
    GROCERY_CATEGORIES.find((category) =>
      category.keywords.some((keyword) => normalizedName.includes(keyword)),
    ) ?? {
      id: "other",
      title: "Other",
      icon: "🛒",
      keywords: [],
    }
  );
}

export default function GroceryPanel({
  items,
  onToggleBought,
  onRemove,
  onClear,
}: GroceryPanelProps) {
  const boughtCount = items.filter((item) => item.bought).length;
  const remainingCount = items.length - boughtCount;

  const groupedItems = items.reduce<Record<string, GroceryItem[]>>(
    (groups, item) => {
      const category = getGroceryCategory(item.name);

      if (!groups[category.id]) {
        groups[category.id] = [];
      }

      groups[category.id].push(item);

      return groups;
    },
    {},
  );

  const visibleCategories = [
    ...GROCERY_CATEGORIES,
    { id: "other", title: "Other", icon: "🛒", keywords: [] },
  ].filter((category) => groupedItems[category.id]?.length);

  return (
    <section className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.3)] ring-1 ring-white/3">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-4 text-amber-100/55">
            Grocery list
          </p>

          <h2 className="text-3xl font-semibold tracking-tight text-[#fff8ef]">
            Shopping list
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
            Ingredients grouped by category so your shopping trip feels easier
            to scan.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-white/10 bg-[#211915]/80 px-4 py-3">
            <p className="text-xs text-stone-500">Remaining</p>
            <p className="mt-1 text-xl font-bold text-[#fff8ef]">
              {remainingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#211915]/80 px-4 py-3">
            <p className="text-xs text-stone-500">Bought</p>
            <p className="mt-1 text-xl font-bold text-[#fff8ef]">
              {boughtCount}
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-2xl border border-red-300/15 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-100 transition hover:bg-red-400/15"
            >
              Clear list
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-white/10 bg-white/3 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-white/4 text-2xl">
            🛒
          </div>

          <h3 className="text-xl font-semibold text-[#fff8ef]">
            Your grocery list is empty
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-500">
            Add ingredients from your meal plan and they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleCategories.map((category) => {
            const categoryItems = [...groupedItems[category.id]].sort(
              (a, b) => {
                if (a.bought !== b.bought) return a.bought ? 1 : -1;
                return a.name.localeCompare(b.name);
              },
            );

            return (
              <section key={category.id}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-base">
                      {category.icon}
                    </span>

                    <h3 className="text-sm font-semibold uppercase tracking-3 text-stone-300">
                      {category.title}
                    </h3>
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-stone-400">
                    {categoryItems.length} item
                    {categoryItems.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#15110e]/80">
                  {categoryItems.map((item) => (
                    <article
                      key={item.name}
                      className={`group flex items-center gap-3 border-b border-white/6 px-4 py-3 last:border-b-0 transition ${
                        item.bought ? "bg-emerald-300/5" : "hover:bg-white/4"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleBought(item.name)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition ${
                          item.bought
                            ? "border-emerald-300 bg-emerald-300 text-[#17120f]"
                            : "border-stone-600 bg-transparent text-transparent group-hover:border-emerald-200"
                        }`}
                        aria-label={
                          item.bought
                            ? `Mark ${item.name} as not bought`
                            : `Mark ${item.name} as bought`
                        }
                      >
                        ✓
                      </button>

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-lg">
                        {category.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-semibold ${
                            item.bought
                              ? "text-stone-500 line-through"
                              : "text-[#fff8ef]"
                          }`}
                        >
                          {capitalizeWords(item.name)}
                        </p>

                        <p className="mt-0.5 text-xs text-stone-500">
                          {item.bought ? "Purchased" : category.title}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemove(item.name)}
                        className="rounded-xl px-2 py-1 text-sm text-stone-600 opacity-0 transition hover:bg-red-400/10 hover:text-red-100 group-hover:opacity-100"
                        aria-label={`Remove ${item.name}`}
                      >
                        ✕
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
