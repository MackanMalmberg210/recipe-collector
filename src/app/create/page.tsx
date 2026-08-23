"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generateRecipeMetadata } from "../../lib/recipeMetadata";
import { saveRecipeToCloudOrLocal } from "../../lib/recipes";
import { parseIngredientString } from "../../lib/ingredientParser";
import { useToast } from "../../components/ui/ToastProvider";
import type { MealType, RecipeCategory } from "../../lib/types";

const SUGGESTED_TAGS = [
  "quick",
  "high-protein",
  "vegetarian",
  "family",
  "budget",
  "comfort-food",
  "low-carb",
  "spicy",
  "gluten-free",
  "meal-prep",
];

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const CATEGORIES: { label: string; value: RecipeCategory }[] = [
  { label: "Main Course", value: "main-course" },
  { label: "Pasta", value: "pasta" },
  { label: "Rice & Grains", value: "rice" },
  { label: "Salad", value: "salad" },
  { label: "Soup", value: "soup" },
  { label: "Sandwich & Wraps", value: "sandwich" },
  { label: "Bowl", value: "bowl" },
  { label: "Stir-fry", value: "stir-fry" },
  { label: "Breakfast", value: "breakfast" },
  { label: "Dessert", value: "dessert" },
];

export default function CreateRecipePage() {
  const router = useRouter();
  const { success } = useToast();

  // Basic info
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageUploadMode, setImageUploadMode] = useState<"file" | "url">("file");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [calories, setCalories] = useState("");

  // Optional Categories & Tags (None selected by default, auto-detection handles it)
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [category, setCategory] = useState<RecipeCategory | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  // Smart Unified Editors for Ingredients & Instructions
  const [ingredientText, setIngredientText] = useState("");
  const [instructionText, setInstructionText] = useState("");

  // State & validation
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  // Raw full ingredient strings (preserved with amounts and units)
  const rawIngredients = useMemo(() => {
    return ingredientText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }, [ingredientText]);

  // Structured parsed ingredients for accurate clean names in preview
  const parsedIngredients = useMemo(() => {
    return rawIngredients.map(parseIngredientString);
  }, [rawIngredients]);

  // Automatically parse instructions (one per line)
  const cleanedInstructions = useMemo(() => {
    return instructionText
      .split("\n")
      .map((line) => line.replace(/^[-*•\d.]+\s*/, "").trim())
      .filter(Boolean);
  }, [instructionText]);

  // Auto-generate tags/category suggestions based on actual user input
  const autoMetadata = useMemo(() => {
    return generateRecipeMetadata({
      title: title.trim(),
      ingredients: rawIngredients,
      cookTime: cookTime.trim() ? Number(cookTime) : undefined,
      calories: calories.trim() ? Number(calories) : undefined,
    });
  }, [title, rawIngredients, cookTime, calories]);

  // Tag Management
  const handleAddTag = (tagToAdd: string) => {
    const normalized = tagToAdd.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!normalized || tags.includes(normalized)) return;
    setTags((prev) => [...prev, normalized]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleImageFile = (file: File | null) => {
    setSaveMessage("");
    setError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file (PNG, JPG, WebP).");
      return;
    }

    const maxSizeInBytes = 3 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setError("Image is too large. Please select an image under 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImage(imageUrlInput.trim());
    setImageUrlInput("");
  };

  const resetForm = () => {
    setTitle("");
    setImage("");
    setImageUrlInput("");
    setCookTime("");
    setServings("");
    setCalories("");
    setMealType(null);
    setCategory(null);
    setTags([]);
    setIngredientText("");
    setInstructionText("");
    setHasAttemptedSave(false);
    setError("");
  };

  const validateAndBuildPayload = () => {
    setHasAttemptedSave(true);
    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      setError("Please add a recipe title.");
      return null;
    }

    if (rawIngredients.length === 0) {
      setError("Please add at least one ingredient.");
      return null;
    }

    if (cleanedInstructions.length === 0) {
      setError("Please add at least one cooking instruction step.");
      return null;
    }

    const finalTags = tags.length > 0 ? tags : autoMetadata.tags;
    const finalCategory: RecipeCategory = category ?? autoMetadata.category;
    const finalMealType: MealType = mealType ?? autoMetadata.mealType;

    return {
      title: cleanedTitle,
      image: image || "",
      cookTime: cookTime.trim() ? Number(cookTime) : undefined,
      servings: servings.trim() ? Number(servings) : undefined,
      calories: calories.trim() ? Number(calories) : undefined,
      ingredients: rawIngredients,
      instructions: cleanedInstructions,
      category: finalCategory,
      mealType: finalMealType,
      tags: finalTags,
      origin: "user" as const,
    };
  };

  const handleSaveRecipe = async () => {
    setIsSaving(true);
    setSaveMessage("");
    setError("");

    const payload = validateAndBuildPayload();
    if (!payload) {
      setIsSaving(false);
      return;
    }

    const result = await saveRecipeToCloudOrLocal(payload);

    if (!result.success || !result.recipe) {
      setError(result.error || "Failed to save recipe.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    success(`"${result.recipe.title}" created successfully.`);
    router.push("/saved");
  };

  const handleSaveAndOpen = async () => {
    setIsSaving(true);
    setSaveMessage("");
    setError("");

    const payload = validateAndBuildPayload();
    if (!payload) {
      setIsSaving(false);
      return;
    }

    const result = await saveRecipeToCloudOrLocal(payload);

    if (!result.success || !result.recipe) {
      setError(result.error || "Failed to save recipe.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    success(`"${result.recipe.title}" saved.`);
    router.push(`/recipes/${result.recipe.id}?cook=true`);
  };

  // Preview properties (use explicit user overrides or fallback to auto suggestions)
  const hasContent = Boolean(title.trim() || rawIngredients.length > 0);
  const previewCategory = category ?? (hasContent ? autoMetadata.category : undefined);
  const previewMealType = mealType ?? (hasContent ? autoMetadata.mealType : undefined);
  const previewTags = tags.length > 0 ? tags : (hasContent ? autoMetadata.tags : []);

  return (
    <main className="min-h-screen bg-[#f8f6f2] text-stone-900 transition-colors duration-300 dark:bg-[#110d0b] dark:text-stone-100 px-4 py-8 sm:px-6 xl:px-10">
      
      {/* AMBIENT BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-120 w-200 -translate-x-1/2 rounded-full bg-amber-500/5 blur-[140px] dark:bg-amber-400/5" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl 2xl:max-w-[1820px]">
        
        {/* HEADER & CLEAN NAVIGATION */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2.5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>Recipe Studio</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 sm:text-4xl md:text-5xl">
              Create new recipe
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Build a recipe with ingredients, step-by-step instructions, and photos.
            </p>
          </div>

          {/* CLEAN ICON NAVIGATION (Back & Home only) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              title="Go Back"
              aria-label="Go Back"
              className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-stone-300/80 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-950 dark:border-white/10 dark:bg-[#181412] dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white transition cursor-pointer shadow-xs"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <Link
              href="/"
              title="Home"
              aria-label="Home"
              className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-stone-300/80 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-950 dark:border-white/10 dark:bg-[#181412] dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-white transition cursor-pointer shadow-xs"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
          </div>
        </header>

        {/* MAIN 2-COLUMN LAYOUT */}
        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          
          {/* LEFT COLUMN: MAIN BUILDER FORM */}
          <div className="space-y-7">
            
            {/* STEP 1: ESSENTIALS & PHOTO */}
            <section className="relative overflow-hidden rounded-4xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:p-8">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent dark:via-amber-400/20" />

              <div className="mb-6 flex items-center gap-3">
                <span className="text-sm font-black tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                  01.
                </span>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                    Recipe Essentials & Photo
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Name your dish, add a photo, and set prep details.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                    Recipe title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter recipe title..."
                    className={`w-full rounded-2xl border px-4 py-3.5 text-base font-bold text-stone-950 placeholder:font-normal placeholder:text-stone-400/60 outline-none transition duration-150 focus:bg-white focus:ring-2 dark:bg-[#1c1815] dark:text-stone-50 dark:placeholder:text-stone-600 ${
                      hasAttemptedSave && !title.trim()
                        ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20"
                        : "border-stone-300 bg-stone-50/80 focus:border-amber-500 focus:ring-amber-500/20 dark:border-white/12 dark:focus:border-amber-400 dark:focus:bg-[#221e1a] dark:focus:ring-amber-400/20"
                    }`}
                  />
                </div>

                {/* Image Upload Dropzone & URL Tab */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                      Recipe photo
                    </label>

                    <div className="flex items-center gap-1 rounded-xl border border-stone-300/80 bg-stone-100 p-1 text-xs dark:border-white/10 dark:bg-[#201b18]">
                      <button
                        type="button"
                        onClick={() => setImageUploadMode("file")}
                        className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                          imageUploadMode === "file"
                            ? "bg-white text-stone-950 shadow-xs dark:bg-amber-500 dark:text-stone-950"
                            : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                        }`}
                      >
                        Upload file
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode("url")}
                        className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                          imageUploadMode === "url"
                            ? "bg-white text-stone-950 shadow-xs dark:bg-amber-500 dark:text-stone-950"
                            : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                        }`}
                      >
                        Web image URL
                      </button>
                    </div>
                  </div>

                  {imageUploadMode === "file" ? (
                    <label
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                        const file = e.dataTransfer.files?.[0] || null;
                        handleImageFile(file);
                      }}
                      className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                        isDraggingOver
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-stone-300 bg-stone-50/50 hover:bg-stone-100/70 dark:border-white/15 dark:bg-[#1c1815]/60 dark:hover:bg-[#221e1a]"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => handleImageFile(e.target.files?.[0] || null)}
                      />

                      {image ? (
                        <div className="flex flex-col items-center gap-3">
                          <img
                            src={image}
                            alt="Preview"
                            className="h-28 w-44 rounded-2xl object-cover shadow-sm ring-1 ring-black/10 dark:ring-white/10"
                          />
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            Click or drag to replace image
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-3xl">📷</span>
                          <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500">
                            Supports PNG, JPG, or WebP up to 3MB
                          </p>
                        </div>
                      )}
                    </label>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="Paste image link here..."
                          className="flex-1 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400/60 outline-none transition focus:border-amber-500 focus:bg-white dark:border-white/12 dark:bg-[#1c1815] dark:text-stone-50 dark:placeholder:text-stone-600 dark:focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={handleApplyImageUrl}
                          className="rounded-2xl bg-stone-900 px-5 py-3 text-xs font-bold text-stone-50 shadow-sm transition hover:bg-stone-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400 cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>

                      {image && (
                        <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-white/10 dark:bg-[#1c1815]">
                          <p className="truncate text-xs font-medium text-stone-600 dark:text-stone-300">
                            Active: {image}
                          </p>
                          <button
                            type="button"
                            onClick={() => setImage("")}
                            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3-Column Stats Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                      ⏱ Cook time (min)
                    </label>
                    <input
                      type="number"
                      value={cookTime}
                      onChange={(e) => setCookTime(e.target.value)}
                      placeholder="—"
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400/50 outline-none transition focus:border-amber-500 focus:bg-white dark:border-white/12 dark:bg-[#1c1815] dark:text-stone-50 dark:placeholder:text-stone-600 dark:focus:border-amber-400 dark:focus:bg-[#221e1a]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                      👥 Servings
                    </label>
                    <input
                      type="number"
                      value={servings}
                      onChange={(e) => setServings(e.target.value)}
                      placeholder="—"
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400/50 outline-none transition focus:border-amber-500 focus:bg-white dark:border-white/12 dark:bg-[#1c1815] dark:text-stone-50 dark:placeholder:text-stone-600 dark:focus:border-amber-400 dark:focus:bg-[#221e1a]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                      🔥 Calories (kcal)
                    </label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="—"
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-900 placeholder:font-normal placeholder:text-stone-400/50 outline-none transition focus:border-amber-500 focus:bg-white dark:border-white/12 dark:bg-[#1c1815] dark:text-stone-50 dark:placeholder:text-stone-600 dark:focus:border-amber-400 dark:focus:bg-[#221e1a]"
                    />
                  </div>
                </div>

              </div>
            </section>

            {/* STEP 2: SMART UNIFIED INGREDIENTS EDITOR */}
            <section className="relative overflow-hidden rounded-4xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:p-8">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent dark:via-emerald-400/20" />

              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                    02.
                  </span>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                      Ingredients
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Write or paste your ingredients — one item per line.
                    </p>
                  </div>
                </div>

                {parsedIngredients.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {parsedIngredients.length} ingredient{parsedIngredients.length === 1 ? "" : "s"} formatted
                  </span>
                )}
              </div>

              {/* Main Unified Writing Canvas for Ingredients */}
              <div className={`relative rounded-3xl border p-4 transition-all duration-200 ${
                hasAttemptedSave && rawIngredients.length === 0
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/15 dark:bg-rose-950/15"
                  : "border-stone-300 bg-stone-50/50 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 dark:border-white/12 dark:bg-[#181412] dark:focus-within:border-emerald-400 dark:focus-within:bg-[#1d1815] dark:focus-within:ring-emerald-400/20"
              }`}>
                <textarea
                  value={ingredientText}
                  onChange={(e) => {
                    setIngredientText(e.target.value);
                    if (error) setError("");
                  }}
                  rows={5}
                  placeholder={`500g chicken breast, cubed\n2 cloves garlic, minced\n1 tbsp olive oil\n200ml heavy cream\n100g parmesan cheese, grated`}
                  className="w-full resize-y bg-transparent text-sm font-medium leading-relaxed text-stone-950 placeholder:font-normal placeholder:text-stone-400/60 outline-none dark:text-stone-50 dark:placeholder:text-stone-600 custom-scrollbar"
                />

                <div className="mt-3 flex items-center justify-between border-t border-stone-200/60 pt-2.5 text-[11px] text-stone-400 dark:border-white/6 dark:text-stone-500">
                  <span>💡 Tip: Write each ingredient on a new line. Quantities and units are parsed automatically.</span>
                  {ingredientText && (
                    <button
                      type="button"
                      onClick={() => setIngredientText("")}
                      className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold cursor-pointer"
                    >
                      Clear list
                    </button>
                  )}
                </div>
              </div>

              {/* Live Formatted Ingredients Preview */}
              {parsedIngredients.length > 0 && (
                <div className="mt-4 space-y-2 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-white/8 dark:bg-[#181412]/60">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Preview of your ingredients ({parsedIngredients.length}):
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {parsedIngredients.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-200 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* STEP 3: SMART UNIFIED INSTRUCTIONS EDITOR */}
            <section className="relative overflow-hidden rounded-4xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:p-8">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent dark:via-amber-400/20" />

              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                    03.
                  </span>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                      Cooking Instructions
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Write or paste your steps naturally — each new line becomes an active step.
                    </p>
                  </div>
                </div>

                {cleanedInstructions.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {cleanedInstructions.length} step{cleanedInstructions.length === 1 ? "" : "s"} formatted
                  </span>
                )}
              </div>

              {/* Main Unified Writing Canvas for Instructions */}
              <div className={`relative rounded-3xl border p-4 transition-all duration-200 ${
                hasAttemptedSave && cleanedInstructions.length === 0
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/15 dark:bg-rose-950/15"
                  : "border-stone-300 bg-stone-50/50 focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-white/12 dark:bg-[#181412] dark:focus-within:border-amber-400 dark:focus-within:bg-[#1d1815] dark:focus-within:ring-amber-400/20"
              }`}>
                <textarea
                  value={instructionText}
                  onChange={(e) => {
                    setInstructionText(e.target.value);
                    if (error) setError("");
                  }}
                  rows={6}
                  placeholder={`1. Boil salted water and cook pasta until al dente.\n2. In a skillet, sear seasoned salmon fillets in olive oil until golden.\n3. Add garlic, cream, and spinach, then simmer until thickened and toss with pasta.`}
                  className="w-full resize-y bg-transparent text-sm font-medium leading-relaxed text-stone-950 placeholder:font-normal placeholder:text-stone-400/60 outline-none dark:text-stone-50 dark:placeholder:text-stone-600"
                />

                <div className="mt-3 flex items-center justify-between border-t border-stone-200/60 pt-2.5 text-[11px] text-stone-400 dark:border-white/6 dark:text-stone-500">
                  <span>💡 Tip: Press Enter to create a new step. Numbers/bullets are formatted automatically.</span>
                  {instructionText && (
                    <button
                      type="button"
                      onClick={() => setInstructionText("")}
                      className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold cursor-pointer"
                    >
                      Clear text
                    </button>
                  )}
                </div>
              </div>

              {/* Live Formatted Steps Preview */}
              {cleanedInstructions.length > 0 && (
                <div className="mt-4 space-y-2 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-white/8 dark:bg-[#181412]/60">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Preview of your steps ({cleanedInstructions.length}):
                  </p>
                  <ol className="space-y-2">
                    {cleanedInstructions.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-200 font-medium">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-[10px] font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                          {idx + 1}
                        </span>
                        <span className="flex-1 leading-snug">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>

            {/* STEP 4: OPTIONAL CATEGORY & CUSTOM TAGS */}
            <section className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-2xs transition dark:border-white/[0.08] dark:bg-[#151210] md:p-6">
              <button
                type="button"
                onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                className="flex w-full items-center justify-between text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">
                    🏷️
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      04. Category &amp; Custom Tags <span className="text-xs font-normal text-stone-400 dark:text-stone-500">(Optional)</span>
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      System automatically tags your recipe, but you can customize them if you want.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(mealType || category || tags.length > 0) && (
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      Customized
                    </span>
                  )}
                  <svg
                    className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${
                      showOptionalDetails ? "rotate-180 text-stone-700 dark:text-stone-200" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {showOptionalDetails && (
                <div className="mt-6 space-y-6 pt-5 border-t border-stone-200/80 dark:border-white/8 animate-in fade-in duration-200">
                  
                  {/* Meal Type Pills */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                        Meal type
                      </label>
                      {mealType && (
                        <button
                          type="button"
                          onClick={() => setMealType(null)}
                          className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          Reset to auto
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {MEAL_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setMealType(mealType === type ? null : type)}
                          className={`rounded-2xl px-4 py-2 text-xs font-bold capitalize transition cursor-pointer ${
                            mealType === type
                              ? "bg-amber-500 text-stone-950 shadow-sm ring-2 ring-amber-500"
                              : "border border-stone-300/90 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-300 dark:hover:bg-white/5"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                        Category
                      </label>
                      {category && (
                        <button
                          type="button"
                          onClick={() => setCategory(null)}
                          className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          Reset to auto
                        </button>
                      )}
                    </div>

                    <select
                      value={category ?? ""}
                      onChange={(e) => setCategory(e.target.value ? (e.target.value as RecipeCategory) : null)}
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm font-semibold capitalize text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white dark:border-white/12 dark:bg-[#1c1815] dark:text-stone-50 dark:focus:border-amber-400 cursor-pointer"
                    >
                      <option value="" className="dark:bg-stone-900">
                        Auto-detect from recipe ({hasContent ? autoMetadata.category.replace(/-/g, " ") : "Main Course"})
                      </option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value} className="capitalize dark:bg-stone-900">
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Tags & Suggestions */}
                  <div>
                    <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                      Recipe tags
                    </label>

                    {/* Active tags */}
                    {tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] hover:bg-amber-500/40 cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add custom tag */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag(tagInput);
                          }
                        }}
                        placeholder="Add custom tag (e.g. dinner, spicy)..."
                        className="flex-1 rounded-2xl border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400/60 outline-none transition focus:border-amber-500 focus:bg-white dark:border-white/12 dark:bg-[#1c1815] dark:text-stone-50 dark:placeholder:text-stone-600 dark:focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(tagInput)}
                        disabled={!tagInput.trim()}
                        className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-800 transition hover:bg-stone-200 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 cursor-pointer"
                      >
                        + Add tag
                      </button>
                    </div>

                    {/* Suggestions */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-stone-400 mr-1">
                        Suggestions:
                      </span>
                      {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((suggested) => (
                        <button
                          key={suggested}
                          type="button"
                          onClick={() => handleAddTag(suggested)}
                          className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 transition hover:border-amber-500 hover:text-stone-950 dark:border-white/8 dark:bg-white/5 dark:text-stone-400 dark:hover:text-white cursor-pointer"
                        >
                          +{suggested}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN: STICKY LIVE PREVIEW & INSTANT SAVE ACTIONS */}
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            
            {/* LIVE RECIPE CARD PREVIEW */}
            <section className="overflow-hidden rounded-4xl border border-stone-200/90 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <div className="relative h-60 w-full overflow-hidden bg-stone-100 dark:bg-[#1c1815]">
                {image ? (
                  <>
                    <img
                      src={image}
                      alt={title || "Recipe preview"}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center text-stone-400 dark:text-stone-500">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-200/70 text-2xl dark:bg-white/5">
                      🍲
                    </div>
                    <p className="mt-3 text-xs font-bold text-stone-600 dark:text-stone-300">
                      Photo preview
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Upload a photo above to see it live here.
                    </p>
                  </div>
                )}

                <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-stone-950 shadow-md">
                    Live preview
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="line-clamp-2 text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                    {title.trim() || "Untitled recipe"}
                  </h3>

                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-bold text-stone-600 dark:text-stone-300">
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 dark:border-white/8 dark:bg-white/4">
                      ⏱ {cookTime.trim() ? `${cookTime} min` : "— min"}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 dark:border-white/8 dark:bg-white/4">
                      👥 {servings.trim() ? `${servings} serv` : "— serv"}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 dark:border-white/8 dark:bg-white/4">
                      🔥 {calories.trim() ? `${calories} kcal` : "— kcal"}
                    </span>
                  </div>
                </div>

                {/* Only render tags/category badges if content exists or user chose them */}
                {(previewCategory || previewMealType || previewTags.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-100 dark:border-white/6">
                    {previewCategory && (
                      <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-stone-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
                        {previewCategory.replace(/-/g, " ")}
                      </span>
                    )}
                    {previewMealType && (
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold capitalize text-amber-800 dark:text-amber-300">
                        {previewMealType}
                      </span>
                    )}
                    {previewTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* VALIDATION CHECKLIST & PRIMARY ACTIONS */}
            <section className="relative overflow-hidden rounded-4xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent dark:via-amber-400/20" />

              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                  Ready to save?
                </p>

                <span className="text-xs font-bold text-stone-400">
                  {rawIngredients.length} ingredients • {cleanedInstructions.length} steps
                </span>
              </div>

              {/* Checklist */}
              <ul className="mb-5 space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs font-semibold dark:border-white/6 dark:bg-[#1c1815]">
                <li
                  className={`flex items-center gap-2 ${
                    title.trim()
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-stone-400 dark:text-stone-500"
                  }`}
                >
                  <span className="font-bold">{title.trim() ? "✓" : "○"}</span>
                  <span>Recipe title added</span>
                </li>

                <li
                  className={`flex items-center gap-2 ${
                    rawIngredients.length > 0
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-stone-400 dark:text-stone-500"
                  }`}
                >
                  <span className="font-bold">
                    {rawIngredients.length > 0 ? "✓" : "○"}
                  </span>
                  <span>At least 1 ingredient</span>
                </li>

                <li
                  className={`flex items-center gap-2 ${
                    cleanedInstructions.length > 0
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-stone-400 dark:text-stone-500"
                  }`}
                >
                  <span className="font-bold">
                    {cleanedInstructions.length > 0 ? "✓" : "○"}
                  </span>
                  <span>At least 1 instruction step</span>
                </li>
              </ul>

              {/* Error or Success message */}
              {error && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  ⚠️ {error}
                </div>
              )}

              {saveMessage && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {saveMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-stone-800 disabled:opacity-60 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Saving recipe...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Recipe
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndOpen}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-stone-100 py-3 text-xs sm:text-sm font-bold text-stone-800 transition hover:bg-stone-200 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  Save & Open in Cook Mode →
                </button>
              </div>
            </section>

          </aside>

        </div>

      </div>
    </main>
  );
}