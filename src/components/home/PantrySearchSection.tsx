import IngredientInput from "../IngredientInput";
import SearchBar from "../SearchBar";

type PantrySearchSectionProps = {
  selectedIngredients: string[];
  onAddIngredient: (ingredient: string) => void;
  onRemoveIngredient: (ingredient: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  suggestions: string[];
  matchedRecipesCount: number;
};

export default function PantrySearchSection({
  selectedIngredients,
  onAddIngredient,
  onRemoveIngredient,
  searchTerm,
  onSearchChange,
  suggestions,
  matchedRecipesCount,
}: PantrySearchSectionProps) {
  return (
    <section id="pantry-section" className="mb-12 scroll-mt-28">
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
          Pantry & search
        </p>
        <h2 className="text-3xl font-semibold text-stone-50">
          Build better recommendations from what you already have
        </h2>
        <p className="mt-3 max-w-3xl text-stone-400">
          Add ingredients from your kitchen, search across your recipe library,
          and instantly see how many meals you can already make.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-4xl border border-white/8 bg-stone-900/80 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500">Smart pantry</p>
              <h3 className="mt-2 text-2xl font-semibold text-stone-50">
                What do you have at home?
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
                Add pantry ingredients once and let the app surface the best
                recipes you can cook right now.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:w-65">
              <div className="rounded-[1.25rem] border border-white/6 bg-[#151311] p-4">
                <p className="text-xs text-stone-400">Pantry items</p>
                <p className="mt-1 text-xl font-semibold text-stone-50">
                  {selectedIngredients.length}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-white/6 bg-[#151311] p-4">
                <p className="text-xs text-stone-400">Matches</p>
                <p className="mt-1 text-xl font-semibold text-stone-50">
                  {matchedRecipesCount}
                </p>
              </div>
            </div>
          </div>

          <IngredientInput
            ingredients={selectedIngredients}
            onAdd={onAddIngredient}
            onRemove={onRemoveIngredient}
          />
        </section>

        <div className="grid gap-6">
          <section className="rounded-4xl border border-white/8 bg-stone-900/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
            <div className="mb-4">
              <p className="text-sm font-medium text-stone-500">
                Recipe search
              </p>
              <h3 className="mt-2 text-xl font-semibold text-stone-50">
                Search recipes instantly
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Search by title or ingredient and combine it with your pantry
                for smarter discovery.
              </p>
            </div>

            <SearchBar
              value={searchTerm}
              onChange={onSearchChange}
              suggestions={suggestions}
            />
          </section>

          <section className="rounded-4xl border border-white/8 bg-stone-900/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
            <div className="mb-4">
              <p className="text-sm font-medium text-stone-500">
                Recommendation strength
              </p>
              <h3 className="mt-2 text-xl font-semibold text-stone-50">
                Your pantry is shaping your results
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <div className="rounded-[1.25rem] border border-white/6 bg-[#151311] p-4">
                <p className="text-xs text-stone-400">Ingredients added</p>
                <p className="mt-1 text-xl font-semibold text-stone-50">
                  {selectedIngredients.length}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-white/6 bg-[#151311] p-4">
                <p className="text-xs text-stone-400">Recipe matches</p>
                <p className="mt-1 text-xl font-semibold text-stone-50">
                  {matchedRecipesCount}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-white/6 bg-[#151311] p-4">
                <p className="text-xs text-stone-400">Pantry power</p>
                <p className="mt-1 text-xl font-semibold text-stone-50">
                  {selectedIngredients.length === 0
                    ? "Low"
                    : selectedIngredients.length < 4
                      ? "Growing"
                      : selectedIngredients.length < 8
                        ? "Strong"
                        : "Excellent"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
