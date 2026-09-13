"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { generateRecipeMetadata } from "../../lib/recipeMetadata";
import { saveRecipeToCloudOrLocal, updateRecipeInCloudOrLocal, getAllRecipes } from "../../lib/recipes";
import { parseIngredientString } from "../../lib/ingredientParser";
import { sanitizeCulinaryText, capitalizeFirstLetter } from "../../lib/culinaryTextSanitizer";
import { useToast } from "../../components/ui/ToastProvider";
import { useAuth } from "../../contexts/AuthContext";
import { compressImage } from "../../lib/imageCompressor";
import { detectRecipeLanguage } from "../../lib/languageDetector";
import type { AppRecipe, MealType, RecipeCategory } from "../../lib/types";

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

function CreateRecipeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { success } = useToast();
  const { user, isGuest, displayName } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [originalRecipe, setOriginalRecipe] = useState<AppRecipe | null>(null);

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

  // Visibility & Community Sharing
  const [isPublic, setIsPublic] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Smart Unified Editors for Ingredients & Instructions
  const [ingredientText, setIngredientText] = useState("");
  const [instructionText, setInstructionText] = useState("");

  // Hydrate recipe to edit if editId exists
  useEffect(() => {
    if (!editId) return;
    const idNum = Number(editId);
    if (isNaN(idNum)) return;

    const all = getAllRecipes();
    const found = all.find((r) => r.id === idNum);
    if (found) {
      setIsEditing(true);
      setOriginalRecipe(found);
      setTitle(found.title || "");
      setImage(found.image || "");
      setCookTime(found.cookTime ? String(found.cookTime) : "");
      setServings(found.servings ? String(found.servings) : "");
      setCalories(found.calories ? String(found.calories) : "");
      setMealType(found.mealType || null);
      setCategory(found.category || null);
      setTags(found.tags || []);
      setIngredientText((found.ingredients || []).join("\n"));
      setInstructionText((found.instructions || []).join("\n"));
      setIsPublic(Boolean(found.isPublic));
      if (found.category || found.mealType || (found.tags && found.tags.length > 0)) {
        setShowOptionalDetails(true);
      }
    }
  }, [editId]);

  // State & validation
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  // Raw full ingredient strings (preserved with amounts and units, always capitalized)
  const rawIngredients = useMemo(() => {
    return ingredientText
      .split("\n")
      .map((line) => capitalizeFirstLetter(sanitizeCulinaryText(line.trim())))
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

  const handleImageFile = async (file: File | null) => {
    setSaveMessage("");
    setError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file (PNG, JPG, WebP).");
      return;
    }

    try {
      // Auto-compress mobile photos to lightweight, crisp image
      const compressed = await compressImage(file, 1600, 1600, 0.85);
      setImage(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImage(imageUrlInput.trim());
    setImageUrlInput("");
  };

  // Language Check for Community Recipes
  const languageCheck = useMemo(() => {
    return detectRecipeLanguage(title, rawIngredients, cleanedInstructions);
  }, [title, rawIngredients, cleanedInstructions]);

  // Real-time Community Quality Standards Verification (Required for publishing to Explore)
  const communityQuality = useMemo(() => {
    const hasTitle = title.trim().length >= 5;
    const hasPhoto = Boolean(image.trim());
    const hasMinIngredients = rawIngredients.length >= 3;
    const hasMinInstructions = cleanedInstructions.length >= 2;
    const hasCookTime = Boolean(cookTime.trim() && Number(cookTime) > 0);
    const hasServings = Boolean(servings.trim() && Number(servings) > 0);
    const hasCategory = Boolean(category || autoMetadata.category);
    const isEnglishLanguage = languageCheck.isEnglish;

    const checks = [
      {
        id: "title",
        label: "Descriptive title (min 5 characters)",
        passed: hasTitle,
        hint: title.trim().length < 5 ? "Give your dish a descriptive name" : "Title meets length standard",
      },
      {
        id: "photo",
        label: "Mouthwatering cover photo",
        passed: hasPhoto,
        hint: !hasPhoto ? "Upload a photo or paste a food image URL" : "Cover photo ready",
      },
      {
        id: "ingredients",
        label: "At least 3 ingredients with amounts",
        passed: hasMinIngredients,
        hint: rawIngredients.length < 3 ? `Add ${3 - rawIngredients.length} more ingredient${3 - rawIngredients.length === 1 ? "" : "s"}` : "Ingredients complete",
      },
      {
        id: "instructions",
        label: "At least 2 clear cooking steps",
        passed: hasMinInstructions,
        hint: cleanedInstructions.length < 2 ? `Add ${2 - cleanedInstructions.length} more step${2 - cleanedInstructions.length === 1 ? "" : "s"}` : "Cooking instructions complete",
      },
      {
        id: "cookTime",
        label: "Cooking duration specified",
        passed: hasCookTime,
        hint: !hasCookTime ? "Estimate cooking duration in minutes" : "Cook time specified",
      },
      {
        id: "servings",
        label: "Servings / portions specified",
        passed: hasServings,
        hint: !hasServings ? "Specify how many portions this recipe makes" : "Servings specified",
      },
      {
        id: "category",
        label: "Meal category assigned",
        passed: hasCategory,
        hint: !hasCategory ? "Select or let auto-tag classify your dish" : "Category assigned",
      },
      {
        id: "language",
        label: "English language (Required for Explore)",
        passed: isEnglishLanguage,
        hint: isEnglishLanguage ? "Recipe is in English" : languageCheck.detectedHint || "Please translate to English for community feed",
      },
    ];

    const allPassed = checks.every((c) => c.passed);
    const passedCount = checks.filter((c) => c.passed).length;

    return {
      checks,
      allPassed,
      passedCount,
      totalCount: checks.length,
      isEnglishLanguage,
    };
  }, [title, image, rawIngredients, cleanedInstructions, cookTime, servings, category, autoMetadata.category, languageCheck]);

  const handleTranslateToEnglish = async () => {
    if (!title && rawIngredients.length === 0) {
      setError("Please enter a recipe title or ingredients before translating.");
      return;
    }

    setIsTranslating(true);
    setError("");

    try {
      const res = await fetch("/api/translate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          ingredients: rawIngredients,
          instructions: cleanedInstructions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.translated) {
        throw new Error(data.error || "Failed to translate recipe.");
      }

      const { translated } = data;
      if (translated.title) setTitle(translated.title);
      if (Array.isArray(translated.ingredients) && translated.ingredients.length > 0) {
        setIngredientText(translated.ingredients.join("\n"));
      }
      if (Array.isArray(translated.instructions) && translated.instructions.length > 0) {
        setInstructionText(translated.instructions.join("\n"));
      }

      success("Recipe translated to English with AI!");
    } catch (err: any) {
      console.error("AI translation error:", err);
      setError(err?.message || "Failed to translate recipe. Please try again.");
    } finally {
      setIsTranslating(false);
    }
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
    setIsPublic(false);
    setShowAuthPrompt(false);
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

    if (isPublic) {
      if (isGuest) {
        setError("Please sign in or create a free account to publish recipes to the Community Explore feed. You can save privately to your local cookbook anytime!");
        setShowAuthPrompt(true);
        return null;
      }
      if (!communityQuality.allPassed) {
        setError("Please meet all Community Quality Standards before publishing to Explore.");
        return null;
      }
    }

    const finalTags = tags.length > 0 ? tags : autoMetadata.tags;
    const finalCategory: RecipeCategory = category ?? autoMetadata.category;
    const finalMealType: MealType = mealType ?? autoMetadata.mealType;

    const finalAuthorName = isPublic
      ? user?.user_metadata?.display_name || user?.user_metadata?.full_name || displayName || "Community Chef"
      : undefined;

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
      isPublic: isPublic,
      authorName: finalAuthorName,
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

    if (isEditing && originalRecipe) {
      const updatedRecipe: AppRecipe = {
        ...originalRecipe,
        ...payload,
        id: originalRecipe.id,
      };

      const result = await updateRecipeInCloudOrLocal(updatedRecipe);
      if (!result.success || !result.recipe) {
        setError(result.error || "Failed to update recipe.");
        setIsSaving(false);
        return;
      }

      setIsSaving(false);
      success(`"${result.recipe.title}" updated successfully! ✨`);
      router.push(`/recipes/${result.recipe.id}`);
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

    if (isEditing && originalRecipe) {
      const updatedRecipe: AppRecipe = {
        ...originalRecipe,
        ...payload,
        id: originalRecipe.id,
      };

      const result = await updateRecipeInCloudOrLocal(updatedRecipe);
      if (!result.success || !result.recipe) {
        setError(result.error || "Failed to update recipe.");
        setIsSaving(false);
        return;
      }

      setIsSaving(false);
      success(`"${result.recipe.title}" updated.`);
      router.push(`/recipes/${result.recipe.id}?cook=true`);
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
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1917] transition-colors duration-300 dark:bg-[#12100e] dark:text-[#fafaf9] px-4 py-8 sm:px-6 xl:px-10">
      
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
              {isEditing ? "Edit recipe" : "Create new recipe"}
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              {isEditing
                ? `Refine ingredients, steps, and metrics for "${originalRecipe?.title || title}".`
                : "Build a recipe with ingredients, step-by-step instructions, and photos."}
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

                    <div className="flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1 text-xs dark:border-[#2e2722] dark:bg-[#141210]">
                      <button
                        type="button"
                        onClick={() => setImageUploadMode("file")}
                        className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                          imageUploadMode === "file"
                            ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 shadow-xs"
                            : "text-stone-600 hover:text-stone-900 dark:text-[#a8a29e] dark:hover:text-[#fafaf9]"
                        }`}
                      >
                        Upload file
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode("url")}
                        className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                          imageUploadMode === "url"
                            ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 shadow-xs"
                            : "text-stone-600 hover:text-stone-900 dark:text-[#a8a29e] dark:hover:text-[#fafaf9]"
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
                          : "border-stone-200 bg-stone-50/50 hover:bg-stone-100/70 dark:border-[#2e2722] dark:bg-[#1a1715] dark:hover:bg-[#24201c]"
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
                          <svg className="h-8 w-8 text-stone-400 dark:text-stone-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
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
                          className="flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400/60 outline-none transition focus:border-amber-500 focus:bg-white dark:border-[#2e2722] dark:bg-[#1a1715] dark:text-[#fafaf9] dark:placeholder:text-stone-600 dark:focus:border-amber-400 dark:focus:bg-[#221e1a]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyImageUrl}
                          className="rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-5 py-3 text-xs transition active:scale-95 cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>

                      {image && (
                        <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 p-3 dark:border-[#2e2722] dark:bg-[#1a1715]">
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
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                      <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Cook time (min)</span>
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
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                      <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Servings</span>
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
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                      <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                      </svg>
                      <span>Calories (kcal)</span>
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
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Write each ingredient on a new line. Quantities and units are parsed automatically.</span>
                  </span>
                  {ingredientText && (
                    <button
                      type="button"
                      onClick={() => setIngredientText("")}
                      className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold cursor-pointer shrink-0 ml-2"
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
                  <span className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Press Enter to create a new step. Numbers/bullets are formatted automatically.</span>
                  </span>
                  {instructionText && (
                    <button
                      type="button"
                      onClick={() => setInstructionText("")}
                      className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold cursor-pointer shrink-0 ml-2"
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
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
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
                          className={`rounded-2xl px-4 py-2 text-xs font-bold capitalize transition cursor-pointer active:scale-95 ${
                            mealType === type
                              ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 shadow-xs ring-1 ring-amber-400/40"
                              : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-[#2e2722] dark:bg-[#1f1b18] dark:text-[#d6d3d1] dark:hover:bg-[#28231f] dark:hover:text-[#fafaf9]"
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
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold capitalize text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white dark:border-[#2e2722] dark:bg-[#1f1b18] dark:text-[#fafaf9] dark:focus:border-amber-400 dark:focus:bg-[#1f1b18] cursor-pointer"
                    >
                      <option value="" className="dark:bg-[#1f1b18]">
                        Auto-detect from recipe ({hasContent ? autoMetadata.category.replace(/-/g, " ") : "Main Course"})
                      </option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value} className="capitalize dark:bg-[#1f1b18]">
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
                        className="flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400/60 outline-none transition focus:border-amber-500 focus:bg-white dark:border-[#2e2722] dark:bg-[#1f1b18] dark:text-[#fafaf9] dark:placeholder:text-stone-600 dark:focus:border-amber-400 dark:focus:bg-[#1f1b18]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(tagInput)}
                        disabled={!tagInput.trim()}
                        className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition cursor-pointer active:scale-95 ${
                          tagInput.trim()
                            ? "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-xs"
                            : "border border-stone-200 bg-stone-100 text-stone-400 dark:border-[#2e2722] dark:bg-[#141210] dark:text-[#78716c] opacity-50 cursor-not-allowed"
                        }`}
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

            {/* STEP 5: VISIBILITY & COMMUNITY SHARING */}
            <section className="relative overflow-hidden rounded-4xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:p-8">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent dark:via-amber-400/20" />

              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                    05.
                  </span>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                      Visibility &amp; Community Sharing
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Decide if this recipe stays strictly private in your cookbook or publishes to Explore.
                    </p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-bold ${
                  isPublic
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-stone-100 border border-stone-200 text-stone-600 dark:bg-white/5 dark:border-white/10 dark:text-stone-300"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isPublic ? "bg-emerald-500 animate-pulse" : "bg-stone-400"}`} />
                  <span>{isPublic ? "Explore & Community" : "Private in Cookbook"}</span>
                </span>
              </div>

              {/* 2-Option Card Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Option 1: Private */}
                <button
                  type="button"
                  onClick={() => {
                    setIsPublic(false);
                    setShowAuthPrompt(false);
                    if (error) setError("");
                  }}
                  className={`group relative flex flex-col justify-between rounded-3xl border p-5 text-left transition-all cursor-pointer ${
                    !isPublic
                      ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20 shadow-sm dark:border-amber-400 dark:bg-amber-400/5"
                      : "border-stone-200 bg-stone-50/60 hover:bg-stone-100/70 dark:border-white/10 dark:bg-[#181412] dark:hover:bg-[#1f1a16]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <svg className="h-5 w-5 text-stone-700 dark:text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="rounded-full bg-stone-200/70 dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-stone-700 dark:text-stone-300">
                        Default
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-bold text-stone-900 dark:text-stone-100">
                      Private (My Cookbook only)
                    </h3>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      Saved exclusively in your personal cookbook. Never visible or searchable to other users.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <span>{!isPublic ? "● Active choice" : "Select private"}</span>
                  </div>
                </button>

                {/* Option 2: Public */}
                <button
                  type="button"
                  onClick={() => {
                    if (isGuest) {
                      setShowAuthPrompt(true);
                      setIsPublic(true);
                    } else {
                      setIsPublic(true);
                      setShowAuthPrompt(false);
                    }
                    if (error) setError("");
                  }}
                  className={`group relative flex flex-col justify-between rounded-3xl border p-5 text-left transition-all cursor-pointer ${
                    isPublic
                      ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20 shadow-sm dark:border-emerald-400 dark:bg-emerald-400/5"
                      : "border-stone-200 bg-stone-50/60 hover:bg-stone-100/70 dark:border-white/10 dark:bg-[#181412] dark:hover:bg-[#1f1a16]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
                      </svg>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        Explore Feed
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-bold text-stone-900 dark:text-stone-100">
                      Public (Explore &amp; Community)
                    </h3>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      Publish to the Explore feed with your chef attribution. Inspires home cooks everywhere!
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <span>{isPublic ? "● Active choice" : "Select public sharing"}</span>
                  </div>
                </button>

              </div>

              {/* GUEST ACCOUNT NOTICE (If guest clicks Public) */}
              {isPublic && isGuest && (
                <div className="mt-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 dark:border-amber-400/20 dark:bg-amber-400/5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                        <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Free Chef Account Required</span>
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300">
                        To protect recipe quality and give you author credit on Explore, community publishing requires an account. You can save privately right now or sign in to share with the community!
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href="/login?mode=signup"
                        className="rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-stone-950 shadow-xs hover:from-amber-400 hover:to-amber-500 transition"
                      >
                        Sign Up Free
                      </Link>
                      <button
                        type="button"
                        onClick={() => setIsPublic(false)}
                        className="rounded-2xl border border-stone-300 bg-white/80 px-3 py-2 text-xs font-semibold text-stone-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 cursor-pointer"
                      >
                        Keep Private
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* COMMUNITY QUALITY GUARDRAILS CHECKLIST (Active when Public) */}
              {isPublic && !isGuest && (
                <div className="mt-6 space-y-4 rounded-3xl border border-stone-200 bg-stone-50/80 p-5 dark:border-white/8 dark:bg-[#181412] animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3 dark:border-white/8">
                    <div>
                      <h4 className="text-sm font-bold text-stone-950 dark:text-stone-100 flex items-center gap-2">
                        <span>🛡️ Community Quality Standards</span>
                        {communityQuality.allPassed ? (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            Ready to Publish! ✨
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                            {communityQuality.passedCount} of {communityQuality.totalCount} standards met
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Guarantees every recipe appearing in Explore has clear instructions, accurate amounts, and appetizing photos.
                      </p>
                    </div>

                    <div className="w-full sm:w-36">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
                        <div
                          className={`h-full transition-all duration-300 ${
                            communityQuality.allPassed ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{
                            width: `${(communityQuality.passedCount / communityQuality.totalCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 7-Point Quality List */}
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {communityQuality.checks.map((c) => (
                      <li
                        key={c.id}
                        className={`flex items-start gap-2.5 rounded-2xl border p-2.5 text-xs transition ${
                          c.passed
                            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200"
                            : "border-stone-200 bg-white text-stone-600 dark:border-white/5 dark:bg-[#14110f] dark:text-stone-400"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            c.passed
                              ? "bg-emerald-500 text-stone-950"
                              : "border border-stone-300 text-transparent dark:border-white/20"
                          }`}
                        >
                          {c.passed ? "✓" : ""}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${c.passed ? "text-emerald-800 dark:text-emerald-300" : "text-stone-800 dark:text-stone-200"}`}>
                            {c.label}
                          </p>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">
                            {c.hint}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* AI Translation Banner (shown when recipe contains non-English text) */}
                  {!communityQuality.isEnglishLanguage && (
                    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-[#14110f] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100">
                            <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896 3.025 2.196 5.874 3.82 8.446" />
                            </svg>
                            <span>Translate to English for Explore</span>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            Community recipes in Explore are published in English. Use 1-click AI translation to convert your title, ingredients, and steps while keeping all your amounts intact.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleTranslateToEnglish}
                          disabled={isTranslating}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-4 py-2 text-xs transition active:scale-95 disabled:opacity-60 cursor-pointer shrink-0"
                        >
                          {isTranslating ? (
                            <>
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              <span>Translating...</span>
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                              </svg>
                              <span>Translate to English with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Notice depending on status */}
                  {communityQuality.allPassed ? (
                    <div className="rounded-2xl border border-stone-200 bg-stone-100 dark:border-white/10 dark:bg-[#1c1815] p-3 text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span>Your recipe fulfills all community requirements! When you save, it will be published to Explore with your author credit: <strong>Chef {displayName || user?.user_metadata?.display_name || "Community Chef"}</strong>.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-100 dark:border-white/10 dark:bg-[#1c1815] p-3 text-xs text-stone-700 dark:text-stone-300">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                        <span>Complete the remaining {communityQuality.totalCount - communityQuality.passedCount} items to publish to Explore, or switch to Private to save right away!</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPublic(false)}
                        className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-50 dark:border-white/10 dark:bg-[#25211d] dark:text-stone-200 cursor-pointer shrink-0"
                      >
                        Switch to Private Save
                      </button>
                    </div>
                  )}
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
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
                  {isPublic && (
                    <span className="rounded-full bg-emerald-950/80 border border-emerald-400/40 px-2.5 py-1 text-xs font-bold text-emerald-300 shadow-md flex items-center gap-1">
                      <span>🌍</span>
                      <span>Explore Feed</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="line-clamp-2 text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                    {title.trim() || "Untitled recipe"}
                  </h3>

                  {isPublic && (
                    <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                      By Chef {displayName || user?.user_metadata?.display_name || "Community Chef"}
                    </p>
                  )}

                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-bold text-stone-600 dark:text-stone-300">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 dark:border-white/8 dark:bg-white/4">
                      <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{cookTime.trim() ? `${cookTime} min` : "— min"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 dark:border-white/8 dark:bg-white/4">
                      <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{servings.trim() ? `${servings} serv` : "— serv"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 dark:border-white/8 dark:bg-white/4">
                      <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                      </svg>
                      <span>{calories.trim() ? `${calories} kcal` : "— kcal"}</span>
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
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                    Ready to save?
                  </p>
                  <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                    {isPublic ? "Destination: Explore Feed" : "Destination: My Cookbook"}
                  </p>
                </div>

                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  isPublic
                    ? communityQuality.allPassed
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                    : "bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300"
                }`}>
                  {isPublic
                    ? communityQuality.allPassed
                      ? "Ready for Public ✨"
                      : `${communityQuality.passedCount}/${communityQuality.totalCount} Standards`
                    : "Private"}
                </span>
              </div>

              {/* Checklist */}
              <ul className="mb-5 space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs font-semibold dark:border-white/6 dark:bg-[#1c1815]">
                <li
                  className={`flex items-center gap-2 ${
                    title.trim().length >= (isPublic ? 5 : 1)
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-stone-400 dark:text-stone-500"
                  }`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] shrink-0 font-bold ${
                    title.trim().length >= (isPublic ? 5 : 1) ? "bg-emerald-500 text-stone-950" : "border border-stone-400 text-transparent"
                  }`}>
                    {title.trim().length >= (isPublic ? 5 : 1) ? "✓" : ""}
                  </span>
                  <span>{isPublic ? "Descriptive title (min 5 chars)" : "Recipe title added"}</span>
                </li>

                <li
                  className={`flex items-center gap-2 ${
                    rawIngredients.length >= (isPublic ? 3 : 1)
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-stone-400 dark:text-stone-500"
                  }`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] shrink-0 font-bold ${
                    rawIngredients.length >= (isPublic ? 3 : 1) ? "bg-emerald-500 text-stone-950" : "border border-stone-400 text-transparent"
                  }`}>
                    {rawIngredients.length >= (isPublic ? 3 : 1) ? "✓" : ""}
                  </span>
                  <span>{isPublic ? `At least 3 ingredients (${rawIngredients.length}/3)` : "At least 1 ingredient"}</span>
                </li>

                <li
                  className={`flex items-center gap-2 ${
                    cleanedInstructions.length >= (isPublic ? 2 : 1)
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-stone-400 dark:text-stone-500"
                  }`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] shrink-0 font-bold ${
                    cleanedInstructions.length >= (isPublic ? 2 : 1) ? "bg-emerald-500 text-stone-950" : "border border-stone-400 text-transparent"
                  }`}>
                    {cleanedInstructions.length >= (isPublic ? 2 : 1) ? "✓" : ""}
                  </span>
                  <span>{isPublic ? `At least 2 instruction steps (${cleanedInstructions.length}/2)` : "At least 1 instruction step"}</span>
                </li>

                {isPublic && (
                  <>
                    <li
                      className={`flex items-center gap-2 ${
                        image.trim()
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] shrink-0 font-bold ${
                        image.trim() ? "bg-emerald-500 text-stone-950" : "border border-amber-500 text-transparent"
                      }`}>
                        {image.trim() ? "✓" : ""}
                      </span>
                      <span>Food cover photo {image.trim() ? "included" : "(Required for Explore)"}</span>
                    </li>

                    <li
                      className={`flex items-center gap-2 ${
                        cookTime.trim() && Number(cookTime) > 0 && servings.trim() && Number(servings) > 0
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] shrink-0 font-bold ${
                        cookTime.trim() && Number(cookTime) > 0 && servings.trim() && Number(servings) > 0
                          ? "bg-emerald-500 text-stone-950"
                          : "border border-amber-500 text-transparent"
                      }`}>
                        {cookTime.trim() && Number(cookTime) > 0 && servings.trim() && Number(servings) > 0 ? "✓" : ""}
                      </span>
                      <span>Cook time &amp; servings specified</span>
                    </li>

                    <li
                      className={`flex items-center gap-2 ${
                        communityQuality.isEnglishLanguage
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] shrink-0 font-bold ${
                        communityQuality.isEnglishLanguage
                          ? "bg-emerald-500 text-stone-950"
                          : "border border-amber-500 text-transparent"
                      }`}>
                        {communityQuality.isEnglishLanguage ? "✓" : ""}
                      </span>
                      <span>English language (Explore requirement)</span>
                    </li>
                  </>
                )}
              </ul>

              {/* Error or Success message */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  <svg className="h-4 w-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
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
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs sm:text-sm font-bold border transition disabled:opacity-60 cursor-pointer active:scale-98 ${
                    isPublic && communityQuality.allPassed
                      ? "bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 border-emerald-600/60 shadow-md shadow-emerald-500/20"
                      : "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border-amber-600/60 shadow-md shadow-amber-500/20"
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      {isEditing ? "Saving changes..." : "Saving recipe..."}
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {isPublic
                        ? isEditing
                          ? "Update & Publish to Explore 🌍"
                          : "Publish to Explore & Community 🌍"
                        : isEditing
                          ? "Save Changes (Private)"
                          : "Save Recipe (Private)"}
                    </>
                  )}
                </button>

                {isPublic && !communityQuality.allPassed && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublic(false);
                      setError("");
                    }}
                    className="w-full text-center text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400 py-1 transition cursor-pointer"
                  >
                    Switch to Private Save (bypass community standards)
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveAndOpen}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-stone-100 py-3 text-xs sm:text-sm font-bold text-stone-800 transition hover:bg-stone-200 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:hover:bg-white/10 cursor-pointer active:scale-98"
                >
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{isEditing ? "Save & View Recipe →" : "Save & Open in Cook Mode →"}</span>
                </button>
              </div>
            </section>

          </aside>

        </div>

      </div>
    </div>
  );
}

export default function CreateRecipePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] dark:bg-[#12100e] flex items-center justify-center text-stone-400">
          Loading recipe studio...
        </div>
      }
    >
      <CreateRecipeForm />
    </Suspense>
  );
}