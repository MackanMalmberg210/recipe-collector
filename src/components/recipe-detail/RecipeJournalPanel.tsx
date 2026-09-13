"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getRecipeRating, saveRecipeRating, type RecipeRating } from "../../lib/ratings";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchCookPhotos,
  uploadCookPhoto,
  deleteCookPhoto,
  updateCookPhotoCaption,
  type CookPhoto,
} from "../../lib/cookPhotos";
import ReportModal from "../common/ReportModal";

export type RecipeNoteItem = {
  id: string;
  text: string;
  date: string;
  timestamp: number;
  imageUrl?: string;
  storagePath?: string;
  rating?: number;
  authorName?: string;
};

type RecipeJournalPanelProps = {
  recipeId: number;
  recipeTitle?: string;
  isPublic?: boolean;
  initialRating?: number;
  initialNote?: string;
  notesList?: RecipeNoteItem[];
  onRatingChange?: (rating: number) => void;
  onSaveNotesList?: (notes: RecipeNoteItem[]) => void;
};

const EMPTY_NOTES_LIST: RecipeNoteItem[] = [];

export default function RecipeJournalPanel({
  recipeId,
  recipeTitle = "this recipe",
  isPublic = false,
  initialRating = 0,
  initialNote = "",
  notesList = EMPTY_NOTES_LIST,
  onRatingChange,
  onSaveNotesList,
}: RecipeJournalPanelProps) {
  const { user, displayName } = useAuth();
  const currentUserName =
    displayName ||
    (user as any)?.user_metadata?.display_name ||
    (user as any)?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "You";

  const [rating, setRating] = useState<number>(initialRating);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [notes, setNotes] = useState<RecipeNoteItem[]>(notesList);

  // Active view tab: "notes" or "photos"
  const [activeTab, setActiveTab] = useState<"notes" | "photos">("notes");

  // Cook Photos & Community creations
  const [cookPhotos, setCookPhotos] = useState<CookPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState<boolean>(true);

  // Note creation state
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [newNoteText, setNewNoteText] = useState<string>("");
  const [noteRating, setNoteRating] = useState<number>(0);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Note editing state (supports text, photo change/removal, and rating)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [editingRating, setEditingRating] = useState<number>(0);
  const [editingExistingImageUrl, setEditingExistingImageUrl] = useState<string | undefined>(undefined);
  const [editingExistingStoragePath, setEditingExistingStoragePath] = useState<string | undefined>(undefined);
  const [editingNewFile, setEditingNewFile] = useState<File | null>(null);
  const [editingNewPreview, setEditingNewPreview] = useState<string | null>(null);
  const [isUpdatingNote, setIsUpdatingNote] = useState<boolean>(false);
  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);

  // Lightbox modal state for viewing full photos
  const [activePhoto, setActivePhoto] = useState<CookPhoto | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState<boolean>(false);
  const [isReportingPhoto, setIsReportingPhoto] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Load rating, notes from storage
  useEffect(() => {
    try {
      const centralRating = getRecipeRating(recipeId);
      if (centralRating !== null) {
        setRating((prev) => (prev !== centralRating ? centralRating : prev));
      } else {
        const storedRating = localStorage.getItem(`recipe_rating_${recipeId}`);
        if (storedRating !== null) {
          const parsed = Number(storedRating);
          setRating((prev) => (prev !== parsed ? parsed : prev));
        } else if (initialRating) {
          setRating((prev) => (prev !== initialRating ? initialRating : prev));
        }
      }

      const storedNotes = localStorage.getItem(`recipe_notes_${recipeId}`);
      if (storedNotes) {
        try {
          const parsedNotes = JSON.parse(storedNotes);
          setNotes(parsedNotes);
        } catch {
          // ignore corrupted json
        }
      } else if (notesList && notesList.length > 0) {
        setNotes(notesList);
      } else if (initialNote) {
        setNotes([
          {
            id: "initial-note",
            text: initialNote,
            date: "Previous note",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch {
      // Ignore storage errors
    }
  }, [recipeId]);

  // Load cook photos (both personal and community if public)
  const loadPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const data = await fetchCookPhotos(recipeId);
      setCookPhotos(data);
    } catch (err) {
      console.warn("Failed to load cook photos:", err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    loadPhotos();

    const handlePhotoUpdate = (e: CustomEvent<{ recipeId: number }>) => {
      if (e.detail.recipeId === recipeId) {
        loadPhotos();
      }
    };

    window.addEventListener("cook_photos_updated", handlePhotoUpdate as EventListener);
    return () => {
      window.removeEventListener("cook_photos_updated", handlePhotoUpdate as EventListener);
    };
  }, [recipeId]);

  // Real-time synchronization event listeners from Cook Mode & other components
  useEffect(() => {
    const handleRatingSync = (e: CustomEvent<{ recipeId: number; rating: number }>) => {
      if (e.detail.recipeId === recipeId) {
        setRating(e.detail.rating);
      }
    };

    const handleNoteSync = (e: CustomEvent<{ recipeId: number; note?: RecipeNoteItem }>) => {
      if (e.detail.recipeId === recipeId && e.detail.note) {
        setNotes((prev) => [e.detail.note!, ...prev]);
      }
    };

    window.addEventListener("recipe_rating_updated", handleRatingSync as EventListener);
    window.addEventListener("recipe_note_updated", handleNoteSync as EventListener);

    return () => {
      window.removeEventListener("recipe_rating_updated", handleRatingSync as EventListener);
      window.removeEventListener("recipe_note_updated", handleNoteSync as EventListener);
    };
  }, [recipeId]);

  const handleSaveRating = (newRating: number) => {
    const finalRating = rating === newRating ? 0 : newRating;
    setRating(finalRating);
    try {
      saveRecipeRating(recipeId, finalRating > 0 ? (finalRating as RecipeRating) : null);
      localStorage.setItem(`recipe_rating_${recipeId}`, String(finalRating));
    } catch {
      // Ignore
    }
    onRatingChange?.(finalRating);
  };

  const saveNotesToStorage = (updatedNotes: RecipeNoteItem[]) => {
    setNotes(updatedNotes);
    try {
      localStorage.setItem(`recipe_notes_${recipeId}`, JSON.stringify(updatedNotes));
      if (updatedNotes.length > 0) {
        localStorage.setItem(`recipe_note_${recipeId}`, updatedNotes[0].text);
      } else {
        localStorage.removeItem(`recipe_note_${recipeId}`);
      }
    } catch {
      // Ignore
    }
    onSaveNotesList?.(updatedNotes);
  };

  // Handle file selection for attaching to note
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file (JPEG, PNG, or WebP).");
      return;
    }

    setAttachedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAttachedPreview(objectUrl);
    setIsAddingNote(true);
  };

  const clearAttachedPhoto = () => {
    setAttachedFile(null);
    if (attachedPreview && attachedPreview.startsWith("blob:")) {
      URL.revokeObjectURL(attachedPreview);
    }
    setAttachedPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteText.trim() && !attachedFile) {
      setErrorMsg("Please write a note or attach a photo.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);

      let uploadedImageUrl: string | undefined;
      let uploadedStoragePath: string | undefined;

      // If a photo was attached, upload it to Supabase Storage or localStorage
      if (attachedFile) {
        const photoResult = await uploadCookPhoto(
          recipeId,
          attachedFile,
          newNoteText.trim(),
          noteRating || undefined
        );
        uploadedImageUrl = photoResult.imageUrl;
        uploadedStoragePath = photoResult.storagePath;
      }

      const now = new Date();
      const formattedDate = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const newEntry: RecipeNoteItem = {
        id: `note-${Date.now()}`,
        text: newNoteText.trim(),
        date: formattedDate,
        timestamp: Date.now(),
        imageUrl: uploadedImageUrl,
        storagePath: uploadedStoragePath,
        rating: noteRating > 0 ? noteRating : undefined,
        authorName: currentUserName,
      };

      const updated = [newEntry, ...notes];
      saveNotesToStorage(updated);

      // Clean up form
      setNewNoteText("");
      setNoteRating(0);
      clearAttachedPhoto();
      setIsAddingNote(false);
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 2500);

      window.dispatchEvent(
        new CustomEvent("recipe_note_updated", {
          detail: { recipeId, note: newEntry },
        })
      );
    } catch (err: unknown) {
      console.error("Error creating note/photo:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Could not save your note and photo. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingNote = (item: RecipeNoteItem) => {
    setEditingNoteId(item.id);
    setEditingText(item.text);
    setEditingRating(item.rating || 0);
    setEditingExistingImageUrl(item.imageUrl);
    setEditingExistingStoragePath(item.storagePath);
    setEditingNewFile(null);
    setEditingNewPreview(null);
    setIsAddingNote(false);
  };

  const cancelEditingNote = () => {
    if (editingNewPreview && editingNewPreview.startsWith("blob:")) {
      URL.revokeObjectURL(editingNewPreview);
    }
    setEditingNoteId(null);
    setEditingText("");
    setEditingRating(0);
    setEditingExistingImageUrl(undefined);
    setEditingExistingStoragePath(undefined);
    setEditingNewFile(null);
    setEditingNewPreview(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setEditingNewFile(file);
    const objectUrl = URL.createObjectURL(file);
    setEditingNewPreview(objectUrl);
  };

  const removePhotoFromEditing = () => {
    setEditingNewFile(null);
    if (editingNewPreview && editingNewPreview.startsWith("blob:")) {
      URL.revokeObjectURL(editingNewPreview);
    }
    setEditingNewPreview(null);
    setEditingExistingImageUrl(undefined);
    setEditingExistingStoragePath(undefined);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const handleSaveUpdatedNote = async (id: string) => {
    if (!editingText.trim() && !editingNewFile && !editingExistingImageUrl) return;

    try {
      setIsUpdatingNote(true);
      const oldNote = notes.find((n) => n.id === id);
      let finalImageUrl = editingExistingImageUrl;
      let finalStoragePath = editingExistingStoragePath;

      // 1. If user attached a new photo
      if (editingNewFile) {
        // Delete previous photo if it existed
        if (oldNote?.imageUrl) {
          const oldPhoto = cookPhotos.find((p) => p.imageUrl === oldNote.imageUrl);
          if (oldPhoto) {
            await deleteCookPhoto(oldPhoto.id, recipeId, oldPhoto.storagePath);
          }
        }
        // Upload new photo
        const uploaded = await uploadCookPhoto(
          recipeId,
          editingNewFile,
          editingText.trim(),
          editingRating || undefined
        );
        finalImageUrl = uploaded.imageUrl;
        finalStoragePath = uploaded.storagePath;
      }
      // 2. If photo was removed completely
      else if (!editingExistingImageUrl && oldNote?.imageUrl) {
        const oldPhoto = cookPhotos.find((p) => p.imageUrl === oldNote.imageUrl);
        if (oldPhoto) {
          await deleteCookPhoto(oldPhoto.id, recipeId, oldPhoto.storagePath);
        }
        finalImageUrl = undefined;
        finalStoragePath = undefined;
      }
      // 3. If photo was preserved, update caption & rating in database
      else if (editingExistingImageUrl && oldNote?.imageUrl) {
        const existingPhoto = cookPhotos.find((p) => p.imageUrl === oldNote.imageUrl);
        if (existingPhoto) {
          await updateCookPhotoCaption(
            existingPhoto.id,
            recipeId,
            editingText.trim(),
            editingRating || undefined
          );
        }
      }

      const updatedNotes = notes.map((n) =>
        n.id === id
          ? {
              ...n,
              text: editingText.trim(),
              rating: editingRating > 0 ? editingRating : undefined,
              imageUrl: finalImageUrl,
              storagePath: finalStoragePath,
              authorName: n.authorName || currentUserName,
            }
          : n
      );

      saveNotesToStorage(updatedNotes);
      cancelEditingNote();
      await loadPhotos();
    } catch (err) {
      console.error("Failed to update note:", err);
    } finally {
      setIsUpdatingNote(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (target?.imageUrl) {
      // Find corresponding photo and remove
      const matchingPhoto = cookPhotos.find((p) => p.imageUrl === target.imageUrl);
      if (matchingPhoto) {
        await deleteCookPhoto(matchingPhoto.id, recipeId, matchingPhoto.storagePath);
      }
    }
    const updated = notes.filter((n) => n.id !== id);
    saveNotesToStorage(updated);
  };

  const handleDeleteActivePhoto = async () => {
    if (!activePhoto) return;
    try {
      setIsDeletingPhoto(true);
      await deleteCookPhoto(activePhoto.id, recipeId, activePhoto.storagePath);
      // Also update any note referencing this image
      const updatedNotes = notes.map((n) =>
        n.imageUrl === activePhoto.imageUrl ? { ...n, imageUrl: undefined } : n
      );
      saveNotesToStorage(updatedNotes);
      setActivePhoto(null);
    } catch (err) {
      console.error("Failed to delete photo:", err);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  // Group photos by user vs community
  const myPhotos = cookPhotos.filter((p) => p.isOwner);
  const communityPhotos = cookPhotos.filter((p) => !p.isOwner);

  return (
    <section className="rounded-4xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xl dark:border-[#2e2722] dark:border-t-amber-500/20 dark:bg-[#1a1715] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors">
      {/* 1. HEADER & OVERALL RATING */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-[#2e2722] pb-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <span>Cooking Journal &amp; Photos</span>
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-950 dark:text-[#fafaf9]">
            Your Rating, Notes &amp; Creations
          </h2>
        </div>

        {/* STAR RATING INTERACTIVE */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-stone-500 dark:text-[#a8a29e]">
            {rating > 0 ? `${rating} of 5 stars` : "Rate this dish:"}
          </span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleSaveRating(star)}
                className="text-2xl transition hover:scale-125 active:scale-95 cursor-pointer"
                title={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                <span
                  className={
                    star <= (hoverRating || rating)
                      ? "text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                      : "text-stone-300 dark:text-[#3a322c]"
                  }
                >
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. TAB CONTROLS & ADD BUTTONS */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {/* SUB-TABS: Notes vs How Did It Turn Out */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-stone-100 p-1 dark:bg-[#141210] border border-stone-200/80 dark:border-white/8">
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "notes"
                ? "bg-white text-stone-900 shadow-xs dark:bg-[#24201c] dark:text-white"
                : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
            }`}
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            <span>Notes &amp; Tweaks</span>
            <span className="rounded-full bg-stone-200 px-1.5 py-0.2 text-[10px] font-black dark:bg-white/10">
              {notes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "photos"
                ? "bg-white text-stone-900 shadow-xs dark:bg-[#24201c] dark:text-white"
                : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
            }`}
          >
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <span>How It Turned Out</span>
            <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 text-[10px] font-black">
              {cookPhotos.length}
            </span>
          </button>
        </div>

        {/* HIDDEN FILE INPUT */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          {!isAddingNote && (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNote(true);
                  setEditingNoteId(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 dark:border-[#2e2722] dark:bg-[#24201c] dark:text-[#d6d3d1] dark:hover:bg-[#2d2823] transition cursor-pointer shadow-2xs active:scale-95"
              >
                <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Add Note</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border dark:border-amber-600/50 px-4 py-2 text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                <span>Snap Photo</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. INTEGRATED ADD NOTE & PHOTO FORM */}
      {isAddingNote && (
        <div className="mt-5 space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 dark:border-amber-400/25 dark:bg-[#1f1b18] animate-in fade-in zoom-in-98 duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {attachedPreview ? (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                )}
              </svg>
              <span>{attachedPreview ? "Log Cooking Note & Photo" : "Add Cooking Note"}</span>
            </h3>
          </div>

          <textarea
            rows={3}
            autoFocus
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="How did your recipe turn out? e.g. 'Added extra garlic, baked 2 mins less. Super crispy!'"
            className="w-full rounded-xl bg-white p-3 text-xs sm:text-sm text-stone-900 border border-stone-200 placeholder-stone-400 focus:border-amber-500 focus:outline-none transition resize-none dark:bg-[#141210] dark:border-[#2e2722] dark:text-[#fafaf9] dark:placeholder-[#78716c]"
          />

          {/* ATTACHED PHOTO THUMBNAIL & CONTROLS */}
          {attachedPreview ? (
            <div className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-2.5 dark:border-white/10 dark:bg-[#161311]">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-stone-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachedPreview}
                  alt="Cook snapshot preview"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                  {attachedFile?.name || "Photo attached"}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Will be uploaded and optimized automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={clearAttachedPhoto}
                className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                ✕ Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-stone-300 dark:border-white/15 bg-white/50 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 transition cursor-pointer"
              >
                <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <span>Attach Cook Photo</span>
              </button>
              <span className="text-[11px] text-stone-400 dark:text-stone-500">
                (Optional picture of your result)
              </span>
            </div>
          )}

          {/* BATCH RATING */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-stone-200/60 dark:border-[#2e2722]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-600 dark:text-stone-400">
                Batch Rating:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNoteRating(star === noteRating ? 0 : star)}
                    className="text-lg transition hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <span
                      className={
                        star <= noteRating
                          ? "text-amber-500"
                          : "text-stone-300 dark:text-stone-700"
                      }
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 w-full sm:w-auto">
                ⚠️ {errorMsg}
              </p>
            )}

            <div className="ml-auto flex gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNoteText("");
                  clearAttachedPhoto();
                }}
                className="rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 dark:border-[#2e2722] dark:text-[#a8a29e] dark:hover:text-[#fafaf9] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleCreateNote}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-xs px-4.5 py-1.5 text-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Note</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: NOTES LIST */}
      {activeTab === "notes" && (
        <div className="mt-5 space-y-3">
          {notes.length === 0 && !isAddingNote ? (
            <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-400 dark:border-[#2e2722] dark:text-[#78716c]">
              No notes logged yet. Click &quot;Add Note&quot; or &quot;Snap Photo&quot; to save your personal tweaks, timings, and results!
            </div>
          ) : (
            notes.map((item) => {
              const isEditing = editingNoteId === item.id;
              return (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-stone-200/90 bg-stone-50/60 p-4 transition hover:border-amber-500/30 dark:border-[#2e2722] dark:bg-[#24201c] dark:hover:bg-[#2d2823] shadow-2xs"
                >
                  {isEditing ? (
                    <div className="space-y-3.5 rounded-xl border border-amber-500/30 bg-white/70 p-4 dark:bg-[#181512] dark:border-amber-500/30 shadow-inner">
                      {/* Hidden file input for updating/attaching photo */}
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleEditFileChange}
                      />

                      {/* Header in edit mode */}
                      <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 pb-1 border-b border-stone-200/60 dark:border-[#2e2722]">
                        <span className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                          <span>Edit Cooking Note &amp; Photo</span>
                        </span>
                        <span className="text-[11px] text-stone-400 font-medium">
                          {item.date} • {item.authorName || currentUserName}
                        </span>
                      </div>

                      {/* Note text input */}
                      <textarea
                        rows={3}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        placeholder="Update your notes or cooking adjustments..."
                        className="w-full rounded-xl bg-white p-3 text-sm text-stone-900 border border-stone-200 focus:border-amber-500 focus:outline-none dark:bg-[#141210] dark:border-[#2e2722] dark:text-[#fafaf9] placeholder:text-stone-400 dark:placeholder:text-stone-600"
                      />

                      {/* Attached Photo Controls */}
                      <div className="space-y-2">
                        {editingNewPreview || editingExistingImageUrl ? (
                          <div className="relative inline-flex items-center gap-3 p-2 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-100/70 dark:bg-stone-900/60">
                            <div className="relative h-20 w-24 overflow-hidden rounded-lg border border-stone-300 dark:border-stone-800 bg-stone-950">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={editingNewPreview || editingExistingImageUrl!}
                                alt="Note preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                                {editingNewPreview ? "New photo selected" : "Attached cook photo"}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => editFileInputRef.current?.click()}
                                  className="inline-flex items-center gap-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition cursor-pointer"
                                >
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                  </svg>
                                  <span>Change</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={removePhotoFromEditing}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer"
                                >
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                  </svg>
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 px-3 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:border-amber-500 hover:text-amber-600 dark:hover:border-amber-500 dark:hover:text-amber-400 transition cursor-pointer"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                            </svg>
                            <span>Attach photo to this note</span>
                          </button>
                        )}
                      </div>

                      {/* Rating & Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-stone-200/80 dark:border-stone-800">
                        {/* Rating picker */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditingRating(editingRating === star ? 0 : star)}
                                className="text-base transition hover:scale-110 cursor-pointer"
                                title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                              >
                                <span className={star <= editingRating ? "text-amber-500" : "text-stone-300 dark:text-stone-700"}>
                                  ★
                                </span>
                              </button>
                            ))}
                            {editingRating > 0 && (
                              <button
                                type="button"
                                onClick={() => setEditingRating(0)}
                                className="ml-1 text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 underline cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Save & Cancel buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={cancelEditingNote}
                            disabled={isUpdatingNote}
                            className="rounded-xl border border-stone-200 dark:border-[#2e2722] px-3.5 py-1.5 text-xs font-semibold text-stone-600 dark:text-[#a8a29e] hover:bg-stone-100 dark:hover:bg-[#25211d] transition cursor-pointer disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveUpdatedNote(item.id)}
                            disabled={isUpdatingNote || (!editingText.trim() && !editingNewFile && !editingExistingImageUrl)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-1.5 text-xs transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-xs"
                          >
                            {isUpdatingNote ? (
                              <>
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <span>Save Changes</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-[#2e2722] mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            {item.date} • {item.authorName || currentUserName}
                          </span>
                          {item.rating && (
                            <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 px-2 py-0.2 text-[10px] font-black">
                              ★ {item.rating} / 5
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => startEditingNote(item)}
                            className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-[#2e2722] text-stone-400 hover:text-stone-700 dark:text-[#a8a29e] dark:hover:text-[#fafaf9] transition cursor-pointer"
                            title="Edit note"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(item.id)}
                            className="p-1 rounded-lg hover:bg-rose-500/10 text-rose-500 transition cursor-pointer"
                            title="Delete note"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2.25 2.25 0 0 1 16.138 21H7.862a2.25 2.25 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* INLINE ATTACHED PHOTO PREVIEW */}
                      {item.imageUrl && (
                        <div
                          onClick={() => {
                            const found = cookPhotos.find((p) => p.imageUrl === item.imageUrl);
                            if (found) {
                              setActivePhoto(found);
                            } else {
                              setActivePhoto({
                                id: item.id,
                                recipeId,
                                imageUrl: item.imageUrl!,
                                caption: item.text,
                                rating: item.rating,
                                createdAt: item.date,
                                isOwner: true,
                              });
                            }
                          }}
                          className="relative mb-3 h-36 w-48 overflow-hidden rounded-xl border border-stone-200/90 dark:border-white/10 bg-stone-100 dark:bg-stone-900 cursor-pointer group/img shadow-2xs"
                        >
                          <Image
                            src={item.imageUrl}
                            alt={item.text || "Cook photo"}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-300 group-hover/img:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                            </svg>
                            <span>View Photo</span>
                          </div>
                        </div>
                      )}

                      <p className="text-xs sm:text-sm text-stone-800 dark:text-[#e7e5e4] leading-relaxed whitespace-pre-wrap">
                        {item.text}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. TAB CONTENT: "HOW IT TURNED OUT" GALLERY */}
      {activeTab === "photos" && (
        <div className="mt-5 space-y-6">
          {loadingPhotos ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-stone-400">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <p className="text-xs">Loading creations...</p>
            </div>
          ) : cookPhotos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 p-8 text-center space-y-3 dark:border-[#2e2722] bg-stone-50/50 dark:bg-white/2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                No creations shared yet
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                Be the first to snap a photo and show how {recipeTitle} turned out!
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="rounded-full bg-slate-900 text-white dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 font-bold px-4 py-2 text-xs transition cursor-pointer"
                >
                  Snap First Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* YOUR CREATIONS */}
              {myPhotos.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-2">
                    <span>Your Creations ({myPhotos.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {myPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => setActivePhoto(photo)}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 dark:border-white/8 bg-stone-50 dark:bg-[#161311] shadow-2xs hover:shadow-md transition cursor-pointer"
                      >
                        <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-200 dark:bg-stone-900">
                          <Image
                            src={photo.imageUrl}
                            alt={photo.caption || "Cook snapshot"}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {photo.rating && (
                            <div className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-black text-amber-400 shadow-xs">
                              ★ {photo.rating}
                            </div>
                          )}
                          <div className="absolute top-2 right-2 rounded-full bg-amber-500 text-stone-950 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-xs">
                            You
                          </div>
                        </div>

                        <div className="p-2.5 flex flex-col justify-between flex-1">
                          <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 line-clamp-2 leading-snug">
                            {photo.caption || "Cooked dish"}
                          </p>
                          <p className="mt-1 text-[10px] font-bold text-stone-400 dark:text-stone-500">
                            {new Date(photo.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                            {" • "}
                            {photo.authorName && photo.authorName !== "You" ? photo.authorName : currentUserName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COMMUNITY CREATIONS (FROM OTHER USERS IF PUBLIC) */}
              {communityPhotos.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                    <span>Community Cooks &amp; Results ({communityPhotos.length})</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {communityPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => setActivePhoto(photo)}
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-amber-500/20 dark:border-white/8 bg-stone-50 dark:bg-[#161311] shadow-2xs hover:shadow-md transition cursor-pointer"
                      >
                        <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-200 dark:bg-stone-900">
                          <Image
                            src={photo.imageUrl}
                            alt={photo.caption || "Community creation"}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {photo.rating && (
                            <div className="absolute top-2 left-2 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-black text-amber-400 shadow-xs">
                              ★ {photo.rating}
                            </div>
                          )}
                          <div className="absolute top-2 right-2 rounded-full bg-black/60 backdrop-blur-md text-white/90 px-2 py-0.5 text-[9px] font-bold truncate max-w-[100px]">
                            {photo.authorName || "Cook"}
                          </div>
                        </div>

                        <div className="p-2.5 flex flex-col justify-between flex-1">
                          <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 line-clamp-2 leading-snug">
                            {photo.caption || "Community result"}
                          </p>
                          <p className="mt-1 text-[10px] font-bold text-stone-400 dark:text-stone-500">
                            {new Date(photo.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                            {" • "}
                            {photo.authorName || "Community Cook"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. FULL RESOLUTION LIGHTBOX MODAL */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-3xl bg-stone-900 border border-white/10 shadow-2xl overflow-hidden p-4 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-400">
                  {new Date(activePhoto.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" • "}
                  {activePhoto.isOwner
                    ? (activePhoto.authorName && activePhoto.authorName !== "You"
                        ? activePhoto.authorName
                        : currentUserName)
                    : (activePhoto.authorName || "Community Cook")}
                </span>
                {activePhoto.rating && (
                  <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-xs font-bold">
                    ★ {activePhoto.rating} / 5
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* High-res Image Display */}
            <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto.imageUrl}
                alt={activePhoto.caption || "Cook photo"}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Caption & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <p className="text-sm font-medium text-stone-200">
                {activePhoto.caption ? `"${activePhoto.caption}"` : "Cooked with passion."}
              </p>

              {activePhoto.isOwner ? (
                <button
                  type="button"
                  disabled={isDeletingPhoto}
                  onClick={handleDeleteActivePhoto}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition cursor-pointer active:scale-95 disabled:opacity-40 self-end sm:self-auto"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  <span>{isDeletingPhoto ? "Deleting..." : "Delete photo"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsReportingPhoto(true)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-stone-400 hover:text-amber-400 hover:bg-white/10 border border-white/10 transition cursor-pointer active:scale-95 self-end sm:self-auto"
                  title="Report photo"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a1.5 1.5 0 0 0 1.142-1.455V4.75a1.5 1.5 0 0 0-1.854-1.455l-2.402.565a9 9 0 0 1-6.086-.71l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                  </svg>
                  <span>Report photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPORT COOK PHOTO MODAL */}
      {activePhoto && (
        <ReportModal
          isOpen={isReportingPhoto}
          onClose={() => setIsReportingPhoto(false)}
          targetType="cook_photo"
          targetId={activePhoto.id}
          targetTitle={activePhoto.caption || `Cook Photo #${activePhoto.id.substring(0, 8)}`}
        />
      )}
    </section>
  );
}
