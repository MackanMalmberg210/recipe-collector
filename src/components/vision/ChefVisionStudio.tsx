"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { saveRecipeToCloudOrLocal } from "../../lib/recipes";
import { addItemsToGroceryList } from "../../lib/home";
import { compressImageForOcr } from "../../lib/imageCompressor";
import { capitalizeFirstLetter } from "../../lib/culinaryTextSanitizer";
import { useToast } from "../ui/ToastProvider";
import ChefProModal from "../subscription/ChefProModal";
import {
  getStoredUserSettings,
  getAiScanUsage,
  recordAiScanUsage,
} from "../../lib/settings";

export type VisionMode = "recipe" | "grocery" | "meal_analyzer";

type ChefVisionStudioProps = {
  initialMode?: VisionMode;
  lockMode?: boolean;
  onRecipeExtracted?: (recipe: AppRecipe) => void;
  onCloseModal?: () => void;
};

type NutritionData = {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};

type GroceryItem = {
  name: string;
  category?: string;
};

export default function ChefVisionStudio({
  initialMode = "recipe",
  lockMode = false,
  onRecipeExtracted,
  onCloseModal: _onCloseModal,
}: ChefVisionStudioProps) {
  void _onCloseModal;
  const { success, error } = useToast();

  const [activeMode, setActiveMode] = useState<VisionMode>(initialMode);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState<string>("");

  // Extracted Results
  const [extractedRecipe, setExtractedRecipe] = useState<AppRecipe | null>(null);
  const [extractedGroceryItems, setExtractedGroceryItems] = useState<GroceryItem[]>([]);
  const [extractedNutrition, setExtractedNutrition] = useState<NutritionData | null>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [dishName, setDishName] = useState<string>("");
  const [dishDescription, setDishDescription] = useState<string>("");
  const [savedRecipeId, setSavedRecipeId] = useState<number | null>(null);
  const [savedGrocerySuccess, setSavedGrocerySuccess] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [userSettings, setUserSettings] = useState(getStoredUserSettings());

  useEffect(() => {
    const handleUpdate = () => setUserSettings(getStoredUserSettings());
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("user_settings_updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("user_settings_updated", handleUpdate);
    };
  }, []);

  const scanUsage = getAiScanUsage(userSettings);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const startWebcam = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Fallback directly to file input capture for very old browsers
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: unknown) {
      const e = err as Error;
      // If environment camera fails, try user/front camera or fallback to input capture
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = fallbackStream;
        setIsCameraActive(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(() => {});
          }
        }, 100);
      } catch {
        cameraInputRef.current?.click();
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setSelectedImage(dataUrl);
    setExtractedRecipe(null);
    setExtractedGroceryItems([]);
    setExtractedNutrition(null);
    setSavedRecipeId(null);
    setSavedGrocerySuccess(false);
    setScanError(null);
    stopCameraStream();
  };

  const handleImageFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      error("Please upload an image file (JPG, PNG, WebP).");
      return;
    }

    try {
      // Auto-compress and orient mobile camera images for fast OCR & low payload
      const compressed = await compressImageForOcr(file, 1600, 1600, 0.85);
      setSelectedImage(compressed);
      // Reset extracted state for new scan
      setExtractedRecipe(null);
      setExtractedGroceryItems([]);
      setExtractedNutrition(null);
      setSavedRecipeId(null);
      setSavedGrocerySuccess(false);
      setScanError(null);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setExtractedRecipe(null);
        setExtractedGroceryItems([]);
        setExtractedNutrition(null);
        setSavedRecipeId(null);
        setSavedGrocerySuccess(false);
        setScanError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const startVisionAnalysis = async () => {
    if (!selectedImage) {
      error("Please take a photo or select an image first.");
      return;
    }

    if (!scanUsage.canScan) {
      setIsProModalOpen(true);
      error("You have reached your monthly free scan limit (3/3). Upgrade to Pro for unlimited scans!");
      return;
    }

    setScanError(null);
    setLoading(true);
    setScanStep("Scanning image with AI Vision...");

    const stepTimer1 = setTimeout(() => {
      setScanStep(
        activeMode === "recipe"
          ? "Recognizing text, amounts & cooking steps..."
          : activeMode === "grocery"
          ? "Extracting handwritten items & categories..."
          : "Identifying ingredients & calculating nutritional macros...",
      );
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setScanStep(
        activeMode === "meal_analyzer"
          ? "Generating reverse home-cook recipe..."
          : "Structuring culinary data...",
      );
    }, 2400);

    try {
      const res = await fetch("/api/vision-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          mode: activeMode,
          userNotes: userNotes.trim() || undefined,
        }),
      });

      const responseText = await res.text();
      let data: {
        error?: string;
        recipe?: AppRecipe;
        items?: GroceryItem[];
        dishName?: string;
        description?: string;
        nutrition?: NutritionData | null;
        detectedIngredients?: string[];
      } | null = null;

      try {
        data = JSON.parse(responseText);
      } catch {
        if (res.status === 413 || responseText.includes("Entity Too Large")) {
          throw new Error("The image file is too large. Please take a closer photo or upload a smaller image.");
        }
        throw new Error(`Server returned error (${res.status}): ${responseText.slice(0, 120)}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to analyze image.");
      }

      if (!data) {
        throw new Error("No data returned from vision scanner.");
      }

      if (activeMode === "recipe" && data.recipe) {
        const recipe: AppRecipe = {
          ...data.recipe,
          id: data.recipe.id || Date.now(),
          title: data.recipe.title || "Scanned Recipe",
          origin: data.recipe.origin || "imported",
          ingredients: data.recipe.ingredients || [],
          instructions: data.recipe.instructions || [],
          image: selectedImage || data.recipe.image || "",
        };
        setExtractedRecipe(recipe);
        if (onRecipeExtracted) {
          onRecipeExtracted(recipe);
        }
        recordAiScanUsage();
        setUserSettings(getStoredUserSettings());
        success("Recipe successfully extracted from image.");
      } else if (activeMode === "grocery") {
        setExtractedGroceryItems(data.items || []);
        recordAiScanUsage();
        setUserSettings(getStoredUserSettings());
        success(`Extracted ${data.items?.length || 0} grocery items.`);
      } else if (activeMode === "meal_analyzer") {
        setDishName(data.dishName || "Analyzed Dish");
        setDishDescription(data.description || "");
        setExtractedNutrition(data.nutrition || null);
        setDetectedIngredients(data.detectedIngredients || []);
        const recipeSource = data.recipe || (data as any).reverseRecipe;
        if (recipeSource) {
          const recipe: AppRecipe = {
            ...recipeSource,
            id: recipeSource.id || Date.now(),
            title: recipeSource.title || data.dishName || "Analyzed Meal",
            origin: recipeSource.origin || "imported",
            ingredients: recipeSource.ingredients || [],
            instructions: recipeSource.instructions || [],
            image: selectedImage || recipeSource.image || "",
          };
          setExtractedRecipe(recipe);
          if (onRecipeExtracted) {
            onRecipeExtracted(recipe);
          }
        }
        recordAiScanUsage();
        setUserSettings(getStoredUserSettings());
        success("Meal analyzed with nutrition and recipe.");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      const errMsg = e.message || "Vision scan failed. Please try again.";
      setScanError(errMsg);
      error(errMsg);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setScanStep("");
    }
  };

  const handleSaveRecipeToCookbook = async () => {
    if (!extractedRecipe) return;

    try {
      const result = await saveRecipeToCloudOrLocal(extractedRecipe);
      if (result.success) {
        setSavedRecipeId(result.recipe?.id ?? extractedRecipe.id);
        success("Recipe saved directly to your cookbook! 📖✨");
      } else {
        error("Failed to save recipe.");
      }
    } catch {
      error("Failed to save recipe.");
    }
  };

  const handleAddScannedItemsToGrocery = () => {
    if (extractedGroceryItems.length === 0) return;

    const names = extractedGroceryItems.map((item) => item.name);
    addItemsToGroceryList(names);
    setSavedGrocerySuccess(true);
    success(`Added ${names.length} items to your grocery list! 🛒`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP MODE SWITCHER (Hidden if single-purpose locked mode) */}
      {!lockMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveMode("recipe");
              setExtractedRecipe(null);
              setExtractedGroceryItems([]);
              setExtractedNutrition(null);
              setScanError(null);
            }}
            className={`flex flex-col items-start rounded-2xl p-4 border text-left transition cursor-pointer ${
              activeMode === "recipe"
                ? "border-amber-500 bg-amber-500/10 text-stone-950 dark:text-[#fff8ef] ring-2 ring-amber-500/25"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/10 dark:bg-[#181310] dark:text-stone-300 dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sm font-extrabold">Cookbook &amp; Card</span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium leading-relaxed">
              Extract title, ingredients &amp; cooking steps from cookbook photos.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("grocery");
              setExtractedRecipe(null);
              setExtractedGroceryItems([]);
              setExtractedNutrition(null);
              setScanError(null);
            }}
            className={`flex flex-col items-start rounded-2xl p-4 border text-left transition cursor-pointer ${
              activeMode === "grocery"
                ? "border-amber-500 bg-amber-500/10 text-stone-950 dark:text-[#fff8ef] ring-2 ring-amber-500/25"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/10 dark:bg-[#181310] dark:text-stone-300 dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="text-sm font-extrabold">Paper Grocery List</span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium leading-relaxed">
              Scan handwritten notes or fridge lists into your cart.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("meal_analyzer");
              setExtractedRecipe(null);
              setExtractedGroceryItems([]);
              setExtractedNutrition(null);
              setScanError(null);
            }}
            className={`flex flex-col items-start rounded-2xl p-4 border text-left transition cursor-pointer ${
              activeMode === "meal_analyzer"
                ? "border-amber-500 bg-amber-500/10 text-stone-950 dark:text-[#fff8ef] ring-2 ring-amber-500/25"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/10 dark:bg-[#181310] dark:text-stone-300 dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
              </svg>
              <span className="text-sm font-extrabold">Snap My Plate</span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium leading-relaxed">
              Estimate calories &amp; generate a reverse recipe from a food photo.
            </span>
          </button>
        </div>
      )}

      {/* 2. PHOTO CAPTURE / UPLOAD ZONE (Flat seamless canvas, NO box inside box) */}
      <div className="space-y-5">
        
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
          }}
        />
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
          }}
        />

        {!selectedImage && !isCameraActive ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-300/80 bg-stone-50/50 p-10 text-center transition hover:border-amber-500 hover:bg-amber-500/5 dark:border-white/15 dark:bg-[#181310]/60 dark:hover:border-amber-400/40"
          >
            <div className="mb-4 text-amber-500 dark:text-amber-400">
              {activeMode === "grocery" ? (
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9 2 2 4-4" />
                </svg>
              ) : activeMode === "meal_analyzer" ? (
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-stone-950 dark:text-[#fff8ef]">
              {activeMode === "recipe"
                ? "Photograph or upload your recipe"
                : activeMode === "grocery"
                ? "Photograph your paper grocery list"
                : "Snap a photo of your plated meal"}
            </h3>

            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-md leading-relaxed">
              Drag and drop an image here, or snap a photo directly using your camera.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={startWebcam}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 px-5 py-3 text-xs shadow-sm transition active:scale-95 cursor-pointer"
              >
                <svg className="h-4 w-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Open Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-2xl border border-stone-300 bg-white hover:bg-stone-100 px-5 py-3 text-xs font-bold text-stone-800 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 transition cursor-pointer shadow-xs active:scale-95"
              >
                <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Upload Image</span>
              </button>
            </div>

            {/* UPFRONT QUOTA BADGE FOR FREE USERS */}
            {!scanUsage.isUnlimited && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-white/80 dark:border-white/10 dark:bg-stone-900/60 px-3 py-1 text-[11px] font-medium text-stone-600 dark:text-stone-400">
                <span className={`h-1.5 w-1.5 rounded-full ${scanUsage.remaining === 0 ? "bg-rose-500" : "bg-amber-500"}`} />
                <span>
                  {scanUsage.remaining} of {scanUsage.max} monthly free scans remaining
                </span>
              </div>
            )}
          </div>
        ) : isCameraActive ? (
          /* LIVE DESKTOP/MOBILE WEBCAM VIEWFINDER */
          <div className="relative overflow-hidden rounded-3xl border border-stone-800 bg-black shadow-2xl space-y-3 p-4">
            <div className="relative aspect-16/9 sm:aspect-21/9 w-full overflow-hidden rounded-2xl bg-stone-950 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-4 border border-white/20 rounded-xl" />
            </div>

            <div className="flex items-center justify-between gap-3 px-1 pt-1">
              <button
                type="button"
                onClick={stopCameraStream}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-stone-200 hover:bg-white/20 transition cursor-pointer"
              >
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black border border-amber-600/60 px-6 py-2.5 text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
              >
                <svg className="h-4 w-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Take Photo</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* IMAGE PREVIEW & ACTIONS */}
            <div className="relative aspect-16/9 sm:aspect-21/9 w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-950 dark:border-white/10">
              <img
                src={selectedImage || ""}
                alt="Selected vision scan"
                className="h-full w-full object-cover"
              />

              {/* SMOOTH NON-FLICKERING SCANNING OVERLAY */}
              {loading && (
                <div className="absolute inset-0 bg-stone-950/75 flex flex-col items-center justify-center p-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-stone-900 border border-amber-500/40 px-5 py-3 shadow-2xl text-white">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                    <span className="text-xs sm:text-sm font-bold text-amber-300">
                      {scanStep}
                    </span>
                  </div>
                </div>
              )}

              {!loading && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="flex items-center gap-2 rounded-xl bg-stone-950/90 hover:bg-stone-900 text-stone-100 border border-white/20 px-3.5 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition active:scale-95 cursor-pointer"
                  >
                    <svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Retake / Change Photo</span>
                  </button>
                </div>
              )}
            </div>
            {/* CUSTOM NOTES / DIETARY INSTRUCTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                  Optional notes / dietary tweaks
                </label>
                <input
                  type="text"
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder={
                    activeMode === "meal_analyzer"
                      ? "e.g. 'I want the recipe for 2 people' or 'make it dairy-free'"
                      : "e.g. 'Double the garlic' or 'family portion'"
                  }
                  className="w-full rounded-xl border border-stone-300 bg-[#faf7f2] px-3.5 py-2.5 text-xs font-semibold text-stone-900 outline-none focus:border-amber-500 dark:border-white/10 dark:bg-[#1d1713] dark:text-stone-100 placeholder-stone-400"
                />
              </div>

              <button
                type="button"
                onClick={startVisionAnalysis}
                disabled={loading || !scanUsage.canScan}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-3 text-xs sm:text-sm font-bold text-stone-950 border border-amber-600/60 shadow-md shadow-amber-400/25 transition cursor-pointer disabled:opacity-50"
              >
                <svg className="h-4 w-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3Z" />
                </svg>
                <span>{loading ? "Analyzing..." : !scanUsage.canScan ? "Upgrade to Pro to Scan" : "Run AI Vision Scan"}</span>
              </button>
            </div>

            {/* QUOTA STATUS & PRO UPGRADE ACCESS */}
            {scanUsage.isUnlimited ? (
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="text-stone-500 dark:text-stone-400 font-medium">Subscription status</span>
                <span className="rounded-md bg-amber-400 text-stone-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  PRO Unlimited
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="text-stone-500 dark:text-stone-400 font-medium">Free plan monthly scans</span>
                <span className={`font-bold ${scanUsage.remaining === 0 ? "text-rose-500" : "text-amber-500"}`}>
                  {scanUsage.remaining} of {scanUsage.max} scans remaining
                </span>
              </div>
            )}

            {/* SOFT PAYWALL WHEN FREE SCANS ARE EXHAUSTED */}
            {!scanUsage.canScan && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-stone-800 dark:text-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    Monthly Free Scan Limit Reached
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Upgrade to Pro for unlimited AI scans, reverse recipes, and nutritional macro tracking.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProModalOpen(true)}
                  className="shrink-0 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-stone-950 shadow-xs hover:from-amber-400 hover:to-amber-500 transition cursor-pointer"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}

            {/* HIGH-CONTRAST SCAN ERROR CARD WITH CRISP SVG (NO EMOJIS, NO MUDDY MAROON) */}
            {scanError && (
              <div className="rounded-2xl border border-rose-400/40 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-950/40 p-4 sm:p-5 text-stone-900 dark:text-rose-100 flex items-start gap-3.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="shrink-0 text-rose-600 dark:text-rose-400 mt-0.5">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-rose-950 dark:text-rose-200">
                      Scan Notice
                    </p>
                    <button
                      type="button"
                      onClick={() => setScanError(null)}
                      className="rounded-lg p-1 text-rose-700 hover:bg-rose-200/60 dark:text-rose-300 dark:hover:bg-rose-800/40 transition cursor-pointer"
                      title="Dismiss alert"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs sm:text-[13px] leading-relaxed text-rose-900 dark:text-rose-200/90 font-medium">
                    {scanError}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1 text-xs text-rose-800/90 dark:text-rose-300 font-medium">
                    <svg className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Tip: Ensure bright lighting, sharp focus, and that the photo clearly shows{" "}
                      {activeMode === "recipe"
                        ? "readable recipe text or cookbook ingredients."
                        : activeMode === "grocery"
                        ? "handwritten items or a shopping list."
                        : "a plated meal or edible food."}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. EXTRACTED RESULTS PRESENTATION */}

      {/* A) EXTRACTED RECIPE (Cookbook or Snap My Plate Reverse Recipe) */}
      {extractedRecipe && (
        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-[#16120f] space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
          
          {/* Snap My Plate Nutrition Card if available */}
          {extractedNutrition && (
            <div className="rounded-2xl border border-stone-200/90 bg-stone-50/70 p-5 space-y-3 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4.5" />
                  </svg>
                  <span>Identified Meal: {dishName}</span>
                </span>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                  Estimated Nutrition
                </span>
              </div>

              {dishDescription && (
                <p className="text-xs font-medium text-stone-700 dark:text-stone-300 leading-relaxed">
                  {dishDescription}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="rounded-xl border border-stone-200 bg-white p-3 text-center dark:border-white/10 dark:bg-[#1c1815]">
                  <span className="block text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    Calories
                  </span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                    {extractedNutrition.calories} kcal
                  </span>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-3 text-center dark:border-white/10 dark:bg-[#1c1815]">
                  <span className="block text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    Protein
                  </span>
                  <span className="text-lg font-black text-stone-900 dark:text-[#fff8ef]">
                    {extractedNutrition.proteinGrams}g
                  </span>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-3 text-center dark:border-white/10 dark:bg-[#1c1815]">
                  <span className="block text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    Carbohydrates
                  </span>
                  <span className="text-lg font-black text-stone-900 dark:text-[#fff8ef]">
                    {extractedNutrition.carbsGrams}g
                  </span>
                </div>

                <div className="rounded-xl border border-stone-200 bg-white p-3 text-center dark:border-white/10 dark:bg-[#1c1815]">
                  <span className="block text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    Healthy Fat
                  </span>
                  <span className="text-lg font-black text-stone-900 dark:text-[#fff8ef]">
                    {extractedNutrition.fatGrams}g
                  </span>
                </div>
              </div>

              {detectedIngredients.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Key Detected Ingredients:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {detectedIngredients.map((item, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-white/80 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-transparent"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recipe Details Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4 dark:border-white/10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <span>✓</span>
                <span>
                  {activeMode === "meal_analyzer"
                    ? "Reverse Home-Cook Recipe Ready"
                    : "Scanned Recipe Extracted"}
                </span>
              </span>
              <h2 className="text-2xl font-black text-stone-950 dark:text-[#fff8ef] mt-1">
                {extractedRecipe.title}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {extractedRecipe.cookTime} min • {extractedRecipe.servings} servings • {extractedRecipe.category}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedRecipeId ? (
                <Link
                  href={`/recipes/${savedRecipeId}`}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-black shadow-md transition cursor-pointer"
                >
                  View in Cookbook →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveRecipeToCookbook}
                  className="rounded-2xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-black text-stone-950 shadow-md shadow-amber-400/20 transition cursor-pointer"
                >
                  Save to Cookbook
                </button>
              )}
            </div>
          </div>

          {/* Ingredients & Instructions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ingredients */}
            <div className="rounded-2xl border border-stone-200 bg-[#faf7f2] p-4 dark:border-white/8 dark:bg-[#1d1713] space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9 2 2 4-4" />
                </svg>
                <span>Ingredients ({extractedRecipe.ingredients.length})</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-800 dark:text-stone-200">
                {extractedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{capitalizeFirstLetter(ing)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="rounded-2xl border border-stone-200 bg-[#faf7f2] p-4 dark:border-white/8 dark:bg-[#1d1713] space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Cooking Instructions ({(extractedRecipe.instructions || []).length} steps)</span>
              </h4>
              <ol className="space-y-2 text-xs text-stone-800 dark:text-stone-200">
                {(extractedRecipe.instructions || []).map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-black text-amber-600 shrink-0">{i + 1}.</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* B) EXTRACTED GROCERY ITEMS */}
      {extractedGroceryItems.length > 0 && (
        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-[#16120f] space-y-5 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4 dark:border-white/10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <span>✓</span>
                <span>Scanned {extractedGroceryItems.length} Grocery Items</span>
              </span>
              <h3 className="text-xl font-black text-stone-950 dark:text-[#fff8ef] mt-1">
                Paper List OCR Result
              </h3>
            </div>

            {savedGrocerySuccess ? (
              <Link
                href="/groceries"
                className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold shadow-md transition"
              >
                <span>Open Grocery List</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAddScannedItemsToGrocery}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-5 py-2.5 text-xs font-bold text-stone-950 border border-amber-600/60 shadow-md shadow-amber-400/20 transition cursor-pointer"
              >
                <svg className="h-4 w-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Add All to Grocery List</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {extractedGroceryItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#faf7f2] p-3 text-xs dark:border-white/8 dark:bg-[#1d1713]"
              >
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {item.name}
                </span>
                {item.category && (
                  <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-stone-600 border border-stone-200 dark:bg-white/10 dark:text-stone-300 dark:border-transparent">
                    {item.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PRO UPGRADE MODAL */}
      <ChefProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />
    </div>
  );
}
