import { createClient } from "./supabase/client";
import { compressImageToBlob, compressImage } from "./imageCompressor";

export type CookPhoto = {
  id: string;
  recipeId: number;
  userId?: string;
  authorName?: string;
  imageUrl: string;
  storagePath?: string;
  caption?: string;
  rating?: number;
  createdAt: string;
  isOwner?: boolean;
};

const BUCKET_NAME = "recipe-media";

/**
 * Helper to get localStorage key for offline / guest cook photos.
 */
function getLocalKey(recipeId: number): string {
  return `recipe_cook_photos_${recipeId}`;
}

/**
 * Fetch all cook photos for a specific recipe.
 * Seamlessly handles both authenticated Supabase sync, public community photos,
 * and guest localStorage entries.
 */
export async function fetchCookPhotos(recipeId: number): Promise<CookPhoto[]> {
  const supabase = createClient();
  let dbPhotos: CookPhoto[] = [];

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Query database (Supabase RLS allows reading own photos OR public recipe photos)
    const { data, error } = await supabase
      .from("recipe_cook_photos")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      dbPhotos = data.map((row) => ({
        id: row.id,
        recipeId: Number(row.recipe_id),
        userId: row.user_id,
        authorName: row.author_name || (user && row.user_id === user.id ? "You" : "Community Cook"),
        imageUrl: row.image_url,
        storagePath: row.storage_path || undefined,
        caption: row.caption || "",
        rating: row.rating ? Number(row.rating) : undefined,
        createdAt: row.created_at,
        isOwner: Boolean(user && row.user_id === user.id),
      }));
    }
  } catch (err) {
    console.warn("Could not query Supabase for cook photos:", err);
  }

  // Check localStorage for any guest photos
  let localPhotos: CookPhoto[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(getLocalKey(recipeId));
      if (raw) {
        localPhotos = JSON.parse(raw);
      }
    } catch {
      localPhotos = [];
    }
  }

  // Deduplicate and combine (db photos take precedence)
  const existingIds = new Set(dbPhotos.map((p) => p.id));
  const combined = [...dbPhotos];

  for (const lp of localPhotos) {
    if (!existingIds.has(lp.id)) {
      combined.push(lp);
    }
  }

  // Sort by date newest first
  return combined.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Upload a cook photo with client-side WebP compression.
 * If user is authenticated, uploads directly to Supabase Storage and records in DB.
 * If guest, saves as lightweight dataURL in localStorage.
 */
export async function uploadCookPhoto(
  recipeId: number,
  file: File | Blob,
  caption = "",
  rating?: number
): Promise<CookPhoto> {
  const supabase = createClient();

  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (user) {
    // 1. Compress image to WebP blob
    const { blob, mimeType } = await compressImageToBlob(
      file instanceof File ? file : (file as Blob),
      1600,
      1600,
      0.85,
      "image/webp"
    );

    // 2. Upload to Supabase Storage
    const fileExt = mimeType === "image/webp" ? "webp" : "jpg";
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storagePath = `${user.id}/${recipeId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, blob, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 3. Get Public CDN URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const imageUrl = urlData.publicUrl;

    // 4. Determine author name
    const authorName =
      (user as any).user_metadata?.full_name ||
      (user as any).user_metadata?.name ||
      (user as any).email?.split("@")[0] ||
      "Home Cook";

    // 5. Insert into database
    const { data: inserted, error: dbError } = await supabase
      .from("recipe_cook_photos")
      .insert({
        recipe_id: recipeId,
        user_id: user.id,
        author_name: authorName,
        image_url: imageUrl,
        storage_path: storagePath,
        caption: caption.trim(),
        rating: rating || null,
      })
      .select()
      .single();

    if (dbError || !inserted) {
      throw new Error(`Database insert failed: ${dbError?.message || "Unknown error"}`);
    }

    const newPhoto: CookPhoto = {
      id: inserted.id,
      recipeId,
      userId: user.id,
      authorName,
      imageUrl,
      storagePath,
      caption: inserted.caption || "",
      rating: inserted.rating || undefined,
      createdAt: inserted.created_at,
      isOwner: true,
    };

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cook_photos_updated", { detail: { recipeId } })
      );
    }

    return newPhoto;
  } else {
    // Guest fallback: compress to lightweight dataURL and store in localStorage
    const dataUrl = await compressImage(file, 1200, 1200, 0.8);
    const guestPhoto: CookPhoto = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipeId,
      authorName: "You",
      imageUrl: dataUrl,
      caption: caption.trim(),
      rating: rating || undefined,
      createdAt: new Date().toISOString(),
      isOwner: true,
    };

    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(
          localStorage.getItem(getLocalKey(recipeId)) || "[]"
        ) as CookPhoto[];
        const updated = [guestPhoto, ...existing];
        localStorage.setItem(getLocalKey(recipeId), JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent("cook_photos_updated", { detail: { recipeId } })
        );
      } catch (err) {
        console.warn("Could not save guest cook photo to localStorage:", err);
      }
    }

    return guestPhoto;
  }
}

/**
 * Delete a cook photo from Supabase and/or localStorage.
 */
export async function deleteCookPhoto(
  photoId: string,
  recipeId: number,
  storagePath?: string
): Promise<boolean> {
  const supabase = createClient();

  // If photo has a storagePath or UUID, attempt DB/Storage deletion
  if (!photoId.startsWith("guest_")) {
    try {
      if (storagePath) {
        await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      }
      await supabase.from("recipe_cook_photos").delete().eq("id", photoId);
    } catch (err) {
      console.warn("Error deleting photo from Supabase:", err);
    }
  }

  // Also purge from localStorage if present
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(getLocalKey(recipeId));
      if (raw) {
        const existing = JSON.parse(raw) as CookPhoto[];
        const filtered = existing.filter((p) => p.id !== photoId);
        localStorage.setItem(getLocalKey(recipeId), JSON.stringify(filtered));
      }
      window.dispatchEvent(
        new CustomEvent("cook_photos_updated", { detail: { recipeId } })
      );
    } catch (err) {
      console.warn("Error updating localStorage after photo deletion:", err);
    }
  }

  return true;
}

/**
 * Update caption and rating of an existing cook photo.
 */
export async function updateCookPhotoCaption(
  photoId: string,
  recipeId: number,
  caption: string,
  rating?: number
): Promise<boolean> {
  const supabase = createClient();

  if (!photoId.startsWith("guest_")) {
    try {
      await supabase
        .from("recipe_cook_photos")
        .update({
          caption: caption.trim(),
          rating: rating || null,
        })
        .eq("id", photoId);
    } catch (err) {
      console.warn("Error updating cook photo caption in Supabase:", err);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(getLocalKey(recipeId));
      if (raw) {
        const existing = JSON.parse(raw) as CookPhoto[];
        const updated = existing.map((p) =>
          p.id === photoId
            ? { ...p, caption: caption.trim(), rating: rating || undefined }
            : p
        );
        localStorage.setItem(getLocalKey(recipeId), JSON.stringify(updated));
      }
      window.dispatchEvent(
        new CustomEvent("cook_photos_updated", { detail: { recipeId } })
      );
    } catch (err) {
      console.warn("Error updating cook photo in localStorage:", err);
    }
  }

  return true;
}

