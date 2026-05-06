"use client";

import Link from "next/link";
import { useState } from "react";
import type { AppRecipe, SavedImportedRecipe } from "../../lib/types";

const IMPORTED_RECIPES_KEY = "importedRecipes";

export default function ImportRecipePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");

  const [importedRecipe, setImportedRecipe] = useState<AppRecipe | null>(null);
  const [editableRecipe, setEditableRecipe] = useState<AppRecipe | null>(null);
  const [importSource, setImportSource] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setSaveMessage("");
    setImportedRecipe(null);
    setEditableRecipe(null);
    setImageFailed(false);

    try {
      const response = await fetch("/api/import-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to import recipe.");
        return;
      }

      setImportedRecipe(data.recipe);
      setEditableRecipe(data.recipe);
      setImportSource(data.source ?? "");
    } catch {
      setError("Failed to analyze the recipe URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImportedRecipe = () => {
    if (!editableRecipe) return;

    const storedImportedRecipes = localStorage.getItem(IMPORTED_RECIPES_KEY);

    let parsedRecipes: SavedImportedRecipe[] = [];

    if (storedImportedRecipes) {
      try {
        parsedRecipes = JSON.parse(
          storedImportedRecipes,
        ) as SavedImportedRecipe[];
      } catch {
        localStorage.removeItem(IMPORTED_RECIPES_KEY);
      }
    }

    const alreadyExists = parsedRecipes.some(
      (recipe) => recipe.sourceUrl === editableRecipe.sourceUrl,
    );

    if (alreadyExists) {
      setSaveMessage("This recipe has already been saved.");
      return;
    }

    const cleanedRecipe: AppRecipe = {
      ...editableRecipe,
      title: editableRecipe.title.trim(),
      ingredients: editableRecipe.ingredients
        .map((ingredient) => ingredient.trim())
        .filter(Boolean),
      instructions: (editableRecipe.instructions ?? [])
        .map((step) => step.trim())
        .filter(Boolean),
    };

    const newRecipe: SavedImportedRecipe = {
      title: cleanedRecipe.title,
      image: cleanedRecipe.image,
      cookTime: cleanedRecipe.cookTime,
      servings: cleanedRecipe.servings,
      ingredients: cleanedRecipe.ingredients,
      instructions: cleanedRecipe.instructions ?? [],
      sourceUrl: cleanedRecipe.sourceUrl ?? url,
      sourceName: cleanedRecipe.sourceName,
      nutrition: cleanedRecipe.nutrition,
      id: Date.now(),
    };

    const updatedRecipes = [newRecipe, ...parsedRecipes];

    localStorage.setItem(IMPORTED_RECIPES_KEY, JSON.stringify(updatedRecipes));
    setSaveMessage("Recipe saved successfully.");
  };

  const handleEditField = (
    field: "title" | "cookTime" | "servings" | "image",
    value: string,
  ) => {
    if (!editableRecipe) return;

    setEditableRecipe((prev) => {
      if (!prev) return prev;

      if (field === "title") {
        return {
          ...prev,
          title: value,
        };
      }

      const numericValue = value.trim() === "" ? undefined : Number(value);

      return {
        ...prev,
        [field]: Number.isNaN(numericValue) ? undefined : numericValue,
      };
    });
  };

  const handleIngredientChange = (index: number, value: string) => {
    if (!editableRecipe) return;

    setEditableRecipe((prev) => {
      if (!prev) return prev;

      const updatedIngredients = [...prev.ingredients];
      updatedIngredients[index] = value;

      return {
        ...prev,
        ingredients: updatedIngredients,
      };
    });
  };

  const handleInstructionChange = (index: number, value: string) => {
    if (!editableRecipe) return;

    setEditableRecipe((prev) => {
      if (!prev) return prev;

      const updatedInstructions = [...(prev.instructions ?? [])];
      updatedInstructions[index] = value;

      return {
        ...prev,
        instructions: updatedInstructions,
      };
    });
  };

  const handleRemoveIngredient = (index: number) => {
    if (!editableRecipe) return;

    setEditableRecipe((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index),
      };
    });
  };

  const handleRemoveInstruction = (index: number) => {
    if (!editableRecipe) return;

    setEditableRecipe((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        instructions: (prev.instructions ?? []).filter((_, i) => i !== index),
      };
    });
  };

  const handleAddIngredient = () => {
    if (!editableRecipe) return;

    setEditableRecipe((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ingredients: [...prev.ingredients, ""],
      };
    });
  };

  const handleAddInstruction = () => {
    if (!editableRecipe) return;

    setEditableRecipe((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        instructions: [...(prev.instructions ?? []), ""],
      };
    });
  };

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white xl:px-10">
      <div className="mx-auto w-full max-w-425">
        <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
              Recipe Collector
            </p>

            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Import recipe
            </h1>

            <p className="mt-3 max-w-2xl text-zinc-400">
              Paste a recipe URL and let the app extract the important details
              for you.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/saved"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              View saved
            </Link>
            <Link
              href="/create"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Create recipe
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Back home
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-md md:p-8">
          <label className="mb-3 block text-sm font-medium text-zinc-300">
            Recipe URL
          </label>

          <p className="mb-4 text-sm text-zinc-400">
            We&apos;ll try to extract the title, image, ingredients,
            instructions, cook time, and nutrition data.
          </p>

          <div className="flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/my-recipe"
              className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-zinc-500"
            />

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {editableRecipe && (
          <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-md md:p-8">
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Title
                </label>

                <input
                  type="text"
                  value={editableRecipe.title}
                  onChange={(e) => handleEditField("title", e.target.value)}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Cook time (min)
                </label>

                <input
                  type="number"
                  value={editableRecipe.cookTime ?? ""}
                  onChange={(e) => handleEditField("cookTime", e.target.value)}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Servings
                </label>

                <input
                  type="number"
                  value={editableRecipe.servings ?? ""}
                  onChange={(e) => handleEditField("servings", e.target.value)}
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
                />
              </div>

              <div className="md:col-span-2">
                <div className="mt-2 space-y-2 text-sm">
                  <p className="break-all text-zinc-400">
                    Imported from {editableRecipe.sourceUrl}
                  </p>

                  {importSource && (
                    <p className="text-zinc-500">
                      Import method:{" "}
                      {importSource === "spoonacular"
                        ? "Spoonacular"
                        : "HTML fallback"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {editableRecipe.image && !imageFailed ? (
              <img
                src={editableRecipe.image}
                alt={editableRecipe.title}
                onError={() => setImageFailed(true)}
                className="mb-6 h-72 w-full rounded-3xl object-cover"
              />
            ) : (
              <div className="mb-6 flex h-72 w-full items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
                No image available
              </div>
            )}

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveImportedRecipe}
                className="rounded-2xl bg-white px-5 py-3 font-medium text-black transition hover:opacity-90"
              >
                Save recipe
              </button>

              <Link
                href="/saved"
                className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                View saved
              </Link>

              {saveMessage && (
                <p className="text-sm text-green-400">{saveMessage}</p>
              )}
            </div>

            {editableRecipe.nutrition && (
              <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <h3 className="mb-3 text-lg font-semibold">Nutrition</h3>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {editableRecipe.nutrition.calories !== undefined && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                      Calories: {editableRecipe.nutrition.calories}
                    </div>
                  )}

                  {editableRecipe.nutrition.protein && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                      Protein: {editableRecipe.nutrition.protein}
                    </div>
                  )}

                  {editableRecipe.nutrition.fat && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                      Fat: {editableRecipe.nutrition.fat}
                    </div>
                  )}

                  {editableRecipe.nutrition.carbohydrates && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                      Carbs: {editableRecipe.nutrition.carbohydrates}
                    </div>
                  )}

                  {editableRecipe.nutrition.sugar && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                      Sugar: {editableRecipe.nutrition.sugar}
                    </div>
                  )}

                  {editableRecipe.nutrition.sodium && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                      Sodium: {editableRecipe.nutrition.sodium}
                    </div>
                  )}
                </div>
              </section>
            )}

            <div className="mt-8 grid gap-8 xl:grid-cols-2">
              <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold">Ingredients</h3>

                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                  >
                    Add ingredient
                  </button>
                </div>

                <ul className="space-y-3">
                  {editableRecipe.ingredients.map((ingredient, index) => (
                    <li key={`ingredient-${index}`} className="flex gap-3">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) =>
                          handleIngredientChange(index, e.target.value)
                        }
                        className="flex-1 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-2xl font-semibold">Instructions</h3>

                  <button
                    type="button"
                    onClick={handleAddInstruction}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                  >
                    Add step
                  </button>
                </div>

                <ol className="space-y-4">
                  {(editableRecipe.instructions ?? []).map((step, index) => (
                    <li key={`step-${index}`} className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-black text-sm text-zinc-400">
                        {index + 1}
                      </div>

                      <textarea
                        value={step}
                        onChange={(e) =>
                          handleInstructionChange(index, e.target.value)
                        }
                        rows={4}
                        className="flex-1 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none focus:border-zinc-600"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(index)}
                        className="h-fit rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
