import { useState } from "react";

type IngredientInputProps = {
  ingredients: string[];
  onAdd: (ingredient: string) => void;
  onRemove: (ingredient: string) => void;
};

export default function IngredientInput({
  ingredients,
  onAdd,
  onRemove,
}: IngredientInputProps) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div className="mb-8 w-full max-w-2xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Add ingredients like chicken, rice, tomato..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3.5 text-white placeholder:text-zinc-400 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700/40"
        />

        <button
          type="button"
          onClick={handleAdd}
          className="rounded-2xl bg-white px-5 py-3.5 font-medium text-black transition hover:opacity-90 active:scale-[0.98]"
        >
          Add
        </button>
      </div>

      {ingredients.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {ingredients.map((ingredient) => (
            <button
              key={ingredient}
              type="button"
              onClick={() => onRemove(ingredient)}
              className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white transition hover:bg-zinc-800"
            >
              {ingredient} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
