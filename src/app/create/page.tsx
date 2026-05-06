"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { SavedUserRecipe } from "../../lib/types";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { generateRecipeMetadata } from "../../lib/recipeMetadata";
import SortableBuilderRow from "../../components/create/SortableBuilderRow";

const USER_RECIPES_KEY = "userRecipes";
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1495521821757-a1efb6729352";

type BuilderIngredient = {
  id: string;
  value: string;
};

type BuilderInstruction = {
  id: string;
  value: string;
};

function createBuilderIngredient(value = ""): BuilderIngredient {
  return {
    id: crypto.randomUUID(),
    value,
  };
}

function createBuilderInstruction(value = ""): BuilderInstruction {
  return {
    id: crypto.randomUUID(),
    value,
  };
}

export default function CreateRecipePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [calories, setCalories] = useState("");
  const [ingredients, setIngredients] = useState<BuilderIngredient[]>([
    createBuilderIngredient(),
  ]);
  const [instructions, setInstructions] = useState<BuilderInstruction[]>([
    createBuilderInstruction(),
  ]);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [activeIngredientId, setActiveIngredientId] = useState<string | null>(
    null,
  );
  const [activeInstructionId, setActiveInstructionId] = useState<string | null>(
    null,
  );
  const [activeIngredientWidth, setActiveIngredientWidth] = useState<
    number | null
  >(null);
  const [activeInstructionWidth, setActiveInstructionWidth] = useState<
    number | null
  >(null);
  const ingredientInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const instructionTextareaRefs = useRef<Array<HTMLTextAreaElement | null>>([]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const cleanedIngredients = useMemo(
    () => ingredients.map((item) => item.value.trim()).filter(Boolean),
    [ingredients],
  );

  const cleanedInstructions = useMemo(
    () => instructions.map((item) => item.value.trim()).filter(Boolean),
    [instructions],
  );

  const previewImage = image || FALLBACK_IMAGE;

  const ingredientItemIds = useMemo(
    () => ingredients.map((item) => item.id),
    [ingredients],
  );

  const instructionItemIds = useMemo(
    () => instructions.map((item) => item.id),
    [instructions],
  );

  const generatedMetadata = useMemo(() => {
    return generateRecipeMetadata({
      title: title.trim(),
      ingredients: cleanedIngredients,
      cookTime: cookTime.trim() ? Number(cookTime) : undefined,
      calories: calories.trim() ? Number(calories) : undefined,
    });
  }, [title, cleanedIngredients, cookTime, calories]);

  const handleIngredientChange = (index: number, value: string) => {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  };

  const handleInstructionChange = (index: number, value: string) => {
    setInstructions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  };

  const handleIngredientKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const trimmedValue = ingredients[index]?.value.trim();

    if (!trimmedValue) return;

    const isLastItem = index === ingredients.length - 1;

    if (isLastItem) {
      setIngredients((prev) => [...prev, createBuilderIngredient()]);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ingredientInputRefs.current[index + 1]?.focus();
        });
      });
    } else {
      ingredientInputRefs.current[index + 1]?.focus();
    }
  };

  const handleInstructionKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) => {
    if (e.key !== "Enter" || e.shiftKey) return;

    e.preventDefault();

    const trimmedValue = instructions[index]?.value.trim();

    if (!trimmedValue) return;

    const isLastItem = index === instructions.length - 1;

    if (isLastItem) {
      setInstructions((prev) => [...prev, createBuilderInstruction()]);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          instructionTextareaRefs.current[index + 1]?.focus();
        });
      });
    } else {
      instructionTextareaRefs.current[index + 1]?.focus();
    }
  };

  const handleAddIngredient = () => {
    setIngredients((prev) => [...prev, createBuilderIngredient()]);
  };

  const handleAddInstruction = () => {
    setInstructions((prev) => [...prev, createBuilderInstruction()]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [createBuilderIngredient()];
    });
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [createBuilderInstruction()];
    });
  };

  const handleIngredientDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveIngredientId(null);
    setActiveIngredientWidth(null);

    if (!over || active.id === over.id) return;

    const oldIndex = ingredientItemIds.indexOf(String(active.id));
    const newIndex = ingredientItemIds.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1) return;

    setIngredients((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const handleInstructionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveInstructionId(null);
    setActiveInstructionWidth(null);

    if (!over || active.id === over.id) return;

    const oldIndex = instructionItemIds.indexOf(String(active.id));
    const newIndex = instructionItemIds.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1) return;

    setInstructions((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const handleIngredientDragStart = (event: DragStartEvent) => {
    setActiveIngredientId(String(event.active.id));
    setActiveIngredientWidth(event.active.rect.current.initial?.width ?? null);
  };

  const handleInstructionDragStart = (event: DragStartEvent) => {
    setActiveInstructionId(String(event.active.id));
    setActiveInstructionWidth(event.active.rect.current.initial?.width ?? null);
  };

  const handleImageUpload = (file: File | null) => {
    setSaveMessage("");
    setError("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    const maxSizeInMb = 2;
    const maxSizeInBytes = maxSizeInMb * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      setError("Image is too large. Please choose one under 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") return;

      const imageDataUrl = reader.result;
      const img = new Image();

      img.onload = () => {
        if (img.width < 600 || img.height < 400) {
          setError(
            "This image is quite small and may look blurry in larger previews.",
          );
        }

        setImage(imageDataUrl);
      };

      img.onerror = () => {
        setError("Failed to process image file.");
      };

      img.src = imageDataUrl;
    };

    reader.onerror = () => {
      setError("Failed to read image file.");
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage("");
  };

  const resetForm = () => {
    setTitle("");
    setImage("");
    setCookTime("");
    setServings("");
    setCalories("");
    setIngredients([createBuilderIngredient()]);
    setInstructions([createBuilderInstruction()]);
  };

  const saveRecipe = () => {
    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      setError("Please add a recipe title.");
      return null;
    }

    if (cleanedIngredients.length === 0) {
      setError("Please add at least one ingredient.");
      return null;
    }

    const storedUserRecipes = localStorage.getItem(USER_RECIPES_KEY);

    let parsedRecipes: SavedUserRecipe[] = [];

    if (storedUserRecipes) {
      try {
        parsedRecipes = JSON.parse(storedUserRecipes) as SavedUserRecipe[];
      } catch {
        localStorage.removeItem(USER_RECIPES_KEY);
      }
    }

    const metadata = generateRecipeMetadata({
      title: cleanedTitle,
      ingredients: cleanedIngredients,
      cookTime: cookTime.trim() ? Number(cookTime) : undefined,
      calories: calories.trim() ? Number(calories) : undefined,
    });

    const newRecipe: SavedUserRecipe = {
      id: Date.now(),
      title: cleanedTitle,
      image: image || FALLBACK_IMAGE,
      cookTime: cookTime.trim() ? Number(cookTime) : undefined,
      servings: servings.trim() ? Number(servings) : undefined,
      calories: calories.trim() ? Number(calories) : undefined,
      ingredients: cleanedIngredients,
      instructions: cleanedInstructions,
      category: metadata.category,
      mealType: metadata.mealType,
      tags: metadata.tags,
    };

    const updatedRecipes = [newRecipe, ...parsedRecipes];
    localStorage.setItem(USER_RECIPES_KEY, JSON.stringify(updatedRecipes));

    return newRecipe;
  };

  const handleSaveRecipe = () => {
    setIsSaving(true);
    setSaveMessage("");
    setError("");

    const savedRecipe = saveRecipe();

    if (!savedRecipe) {
      setIsSaving(false);
      return;
    }

    setSaveMessage("Recipe created successfully.");
    setIsSaving(false);
    resetForm();
  };

  const handleSaveAndOpen = () => {
    setIsSaving(true);
    setSaveMessage("");
    setError("");

    const savedRecipe = saveRecipe();

    if (!savedRecipe) {
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    router.push(`/recipes/${savedRecipe.id}`);
  };

  return (
    <main className="min-h-screen bg-[#0f0d0b] px-6 py-8 text-white xl:px-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[-5%] h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-[-10%] top-[10%] h-96 w-96 rounded-full bg-amber-400/8 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-425">
        <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Recipe Collector
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-stone-50 md:text-5xl">
              Create your own recipe
            </h1>

            <p className="mt-3 max-w-2xl text-stone-400">
              Build a recipe from scratch, upload an image, and save it directly
              into your personal collection.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/saved"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-stone-100 backdrop-blur-sm transition hover:bg-white/10"
            >
              View collection
            </Link>

            <Link
              href="/"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-stone-100 backdrop-blur-sm transition hover:bg-white/10"
            >
              Back home
            </Link>
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.75rem] border border-white/8 bg-stone-900/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm md:p-6">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
                Recipe basics
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-50">
                Start with the essentials
              </h2>
            </div>

            <div className="mb-8 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-stone-300">
                  Recipe title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Creamy Chicken Pasta"
                  className="w-full rounded-xl border border-stone-700 bg-[#151311] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-stone-300">
                  Recipe image
                </label>

                <div className="rounded-3xl border border-white/8 bg-[#151311] p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(e.target.files?.[0] ?? null)
                    }
                    className="w-full rounded-xl border border-stone-700 bg-[#151311] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                  />

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-stone-500">
                      Choose an image from your computer. Keep it under 2 MB for
                      this version.
                    </p>

                    {image && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                      >
                        Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-300">
                  Cook time (min)
                </label>
                <input
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  className="w-full rounded-xl border border-stone-700 bg-[#151311] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-300">
                  Servings
                </label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full rounded-xl border border-stone-700 bg-[#151311] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-stone-300">
                  Calories
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full rounded-xl border border-stone-700 bg-[#151311] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              <section className="rounded-3xl border border-white/8 bg-[#151311] p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-50">
                      Ingredients
                    </h2>
                    <p className="mt-1 text-sm text-stone-400">
                      Add everything needed for the recipe.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-stone-100 transition hover:bg-white/10"
                  >
                    Add ingredient
                  </button>
                </div>

                {hasMounted ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragStart={handleIngredientDragStart}
                    onDragEnd={handleIngredientDragEnd}
                    onDragCancel={() => {
                      setActiveIngredientId(null);
                      setActiveIngredientWidth(null);
                    }}
                  >
                    <SortableContext
                      items={ingredientItemIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <ul className="space-y-3">
                        {ingredients.map((ingredient, index) => (
                          <SortableBuilderRow
                            key={ingredient.id}
                            id={ingredient.id}
                            accent="emerald"
                          >
                            <div className="space-y-2">
                              <div className="flex gap-3">
                                <input
                                  ref={(element) => {
                                    ingredientInputRefs.current[index] =
                                      element;
                                  }}
                                  type="text"
                                  value={ingredient.value}
                                  onChange={(e) =>
                                    handleIngredientChange(
                                      index,
                                      e.target.value,
                                    )
                                  }
                                  onKeyDown={(e) =>
                                    handleIngredientKeyDown(e, index)
                                  }
                                  placeholder={`Ingredient ${index + 1}`}
                                  className="flex-1 rounded-xl border border-stone-700 bg-stone-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredient(index)}
                                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                                >
                                  Remove
                                </button>
                              </div>

                              <p className="text-xs text-stone-500">
                                Press Enter to jump to the next ingredient. Drag
                                to reorder.
                              </p>
                            </div>
                          </SortableBuilderRow>
                        ))}
                      </ul>
                    </SortableContext>
                    {hasMounted
                      ? createPortal(
                          <DragOverlay adjustScale={false} dropAnimation={null}>
                            {activeIngredientId ? (
                              <div
                                style={{
                                  width: activeIngredientWidth ?? undefined,
                                }}
                                className="rounded-2xl border border-emerald-500/20 bg-[#1b1815] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.4)]"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-stone-900/60 text-sm text-stone-400">
                                    ⋮⋮
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex gap-3">
                                      <div className="flex-1 rounded-xl border border-stone-700 bg-stone-900/60 px-3.5 py-2.5 text-sm text-stone-200">
                                        {ingredients[
                                          ingredientItemIds.indexOf(
                                            activeIngredientId,
                                          )
                                        ]?.value || "Ingredient"}
                                      </div>

                                      <div className="rounded-xl border border-red-500/10 bg-red-500/5 px-3.5 py-2 text-sm text-red-300/70">
                                        Remove
                                      </div>
                                    </div>

                                    <p className="text-xs text-stone-500">
                                      Press Enter to jump to the next
                                      ingredient. Drag to reorder.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </DragOverlay>,
                          document.body,
                        )
                      : null}
                  </DndContext>
                ) : (
                  <ul className="space-y-3">
                    {ingredients.map((ingredient, index) => (
                      <li
                        key={`ingredient-${index}`}
                        className="space-y-2 rounded-2xl border border-white/6 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-stone-900/60 text-sm text-stone-400">
                            ⋮⋮
                          </div>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex gap-3">
                              <input
                                ref={(element) => {
                                  ingredientInputRefs.current[index] = element;
                                }}
                                type="text"
                                value={ingredient.value}
                                onChange={(e) =>
                                  handleIngredientChange(index, e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleIngredientKeyDown(e, index)
                                }
                                placeholder={`Ingredient ${index + 1}`}
                                className="flex-1 rounded-xl border border-stone-700 bg-stone-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                              />

                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(index)}
                                className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                              >
                                Remove
                              </button>
                            </div>

                            <p className="text-xs text-stone-500">
                              Press Enter to jump to the next ingredient. Drag
                              to reorder.
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-3xl border border-white/8 bg-[#151311] p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-50">
                      Instructions
                    </h2>
                    <p className="mt-1 text-sm text-stone-400">
                      Add the cooking steps in order.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddInstruction}
                    className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-stone-100 transition hover:bg-white/10"
                  >
                    Add step
                  </button>
                </div>

                {hasMounted ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis]}
                    onDragStart={handleInstructionDragStart}
                    onDragEnd={handleInstructionDragEnd}
                    onDragCancel={() => {
                      setActiveInstructionId(null);
                      setActiveInstructionWidth(null);
                    }}
                  >
                    <SortableContext
                      items={instructionItemIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <ol className="space-y-4">
                        {instructions.map((step, index) => (
                          <SortableBuilderRow
                            key={`instruction-${index}`}
                            id={`instruction-${index}`}
                            accent="amber"
                          >
                            <div className="space-y-2">
                              <div className="flex gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-stone-900/60 text-sm text-stone-300">
                                  {index + 1}
                                </div>

                                <textarea
                                  ref={(element) => {
                                    instructionTextareaRefs.current[index] =
                                      element;
                                  }}
                                  value={step.value}
                                  onChange={(e) =>
                                    handleInstructionChange(
                                      index,
                                      e.target.value,
                                    )
                                  }
                                  onKeyDown={(e) =>
                                    handleInstructionKeyDown(e, index)
                                  }
                                  rows={3}
                                  placeholder={`Step ${index + 1}`}
                                  className="flex-1 rounded-xl border border-stone-700 bg-stone-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleRemoveInstruction(index)}
                                  className="h-fit rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                                >
                                  Remove
                                </button>
                              </div>

                              <p className="text-xs text-stone-500">
                                Press Enter to jump to the next step. Use Shift
                                + Enter for a new line. Drag to reorder.
                              </p>
                            </div>
                          </SortableBuilderRow>
                        ))}
                      </ol>
                    </SortableContext>
                    {hasMounted
                      ? createPortal(
                          <DragOverlay adjustScale={false} dropAnimation={null}>
                            {activeInstructionId ? (
                              <div
                                style={{
                                  width: activeInstructionWidth ?? undefined,
                                }}
                                className="rounded-2xl border border-amber-500/20 bg-[#1b1815] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.4)]"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-stone-900/60 text-sm text-stone-300">
                                    {instructionItemIds.indexOf(
                                      activeInstructionId,
                                    ) + 1}
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex gap-3">
                                      <div className="flex-1 rounded-xl border border-stone-700 bg-stone-900/60 px-3.5 py-2.5 text-sm text-stone-200">
                                        {instructions[
                                          instructionItemIds.indexOf(
                                            activeInstructionId,
                                          )
                                        ].value || "Instruction step"}
                                      </div>

                                      <div className="rounded-xl border border-red-500/10 bg-red-500/5 px-3.5 py-2 text-sm text-red-300/70">
                                        Remove
                                      </div>
                                    </div>

                                    <p className="text-xs text-stone-500">
                                      Press Enter to jump to the next step. Use
                                      Shift + Enter for a new line. Drag to
                                      reorder.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </DragOverlay>,
                          document.body,
                        )
                      : null}
                  </DndContext>
                ) : (
                  <ol className="space-y-4">
                    {instructions.map((step, index) => (
                      <li
                        key={`instruction-${index}`}
                        className="space-y-2 rounded-2xl border border-white/6 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-stone-900/60 text-sm text-stone-400">
                            ⋮⋮
                          </div>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-stone-900/60 text-sm text-stone-300">
                                {index + 1}
                              </div>

                              <textarea
                                ref={(element) => {
                                  instructionTextareaRefs.current[index] =
                                    element;
                                }}
                                value={step.value}
                                onChange={(e) =>
                                  handleInstructionChange(index, e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleInstructionKeyDown(e, index)
                                }
                                rows={3}
                                placeholder={`Step ${index + 1}`}
                                className="flex-1 rounded-xl border border-stone-700 bg-stone-900/60 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                              />

                              <button
                                type="button"
                                onClick={() => handleRemoveInstruction(index)}
                                className="h-fit rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                              >
                                Remove
                              </button>
                            </div>

                            <p className="text-xs text-stone-500">
                              Press Enter to jump to the next step. Use Shift +
                              Enter for a new line. Drag to reorder.
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={isSaving}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-stone-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save recipe
              </button>

              <button
                type="button"
                onClick={handleSaveAndOpen}
                disabled={isSaving}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-stone-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save & open
              </button>

              <Link
                href="/saved"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-stone-100 transition hover:bg-white/10"
              >
                View recipes
              </Link>

              {saveMessage && (
                <p className="text-sm text-emerald-300">{saveMessage}</p>
              )}
              {error && <p className="text-sm text-red-300">{error}</p>}
            </div>
          </section>

          <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
            <section className="overflow-hidden rounded-4xl border border-white/8 bg-stone-900/80 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-sm">
              <div className="relative h-72 w-full overflow-hidden bg-[#151311]">
                <img
                  src={previewImage}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
                />

                <div className="absolute inset-0 bg-linear-to-b from-black/10 via-black/20 to-black/35" />

                <div className="relative flex h-full items-center justify-center p-6">
                  <img
                    src={previewImage}
                    alt={title.trim() || "Recipe preview"}
                    className="max-h-full max-w-full rounded-2xl object-contain shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                  />
                </div>
              </div>

              <div className="p-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Live preview
                  </span>
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-stone-200">
                    Your recipe
                  </span>
                </div>

                <h3 className="text-2xl font-semibold text-stone-50">
                  {title.trim() || "Untitled recipe"}
                </h3>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-stone-400">
                  <span>⏱ {cookTime.trim() ? `${cookTime} min` : "—"}</span>
                  <span>
                    👥 {servings.trim() ? `${servings} servings` : "—"}
                  </span>
                  <span>🔥 {calories.trim() ? `${calories} kcal` : "—"}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-stone-200">
                    {generatedMetadata.category}
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                    {generatedMetadata.mealType}
                  </span>
                  {generatedMetadata.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/8 bg-stone-900/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm md:p-6">
              <p className="text-sm font-medium text-stone-500">
                Recipe status
              </p>
              <h3 className="mt-2 text-xl font-semibold text-stone-50">
                Ready to save?
              </h3>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-[1.25rem] border border-white/6 bg-[#151311] p-4">
                  <p className="text-xs text-stone-400">Ingredients</p>
                  <p className="mt-1 text-xl font-semibold text-stone-50">
                    {cleanedIngredients.length}
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-white/6 bg-[#151311] p-4">
                  <p className="text-xs text-stone-400">Steps</p>
                  <p className="mt-1 text-xl font-semibold text-stone-50">
                    {cleanedInstructions.length}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-white/6 bg-[#151311] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
                  Validation
                </p>

                <ul className="mt-3 space-y-2 text-sm">
                  <li
                    className={
                      title.trim() ? "text-emerald-300" : "text-stone-500"
                    }
                  >
                    {title.trim() ? "✓" : "•"} Recipe title added
                  </li>
                  <li
                    className={
                      cleanedIngredients.length > 0
                        ? "text-emerald-300"
                        : "text-stone-500"
                    }
                  >
                    {cleanedIngredients.length > 0 ? "✓" : "•"} At least one
                    ingredient
                  </li>
                  <li
                    className={
                      cleanedInstructions.length > 0
                        ? "text-emerald-300"
                        : "text-stone-500"
                    }
                  >
                    {cleanedInstructions.length > 0 ? "✓" : "•"} At least one
                    instruction step
                  </li>
                  <li className={image ? "text-emerald-300" : "text-stone-500"}>
                    {image ? "✓" : "•"} Image uploaded
                  </li>
                </ul>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
