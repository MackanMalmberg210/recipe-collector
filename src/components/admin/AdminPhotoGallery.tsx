"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AdminCookPhoto } from "../../lib/admin";

interface AdminPhotoGalleryProps {
  photos: AdminCookPhoto[];
  onDeletePhoto: (photoId: string, storagePath?: string) => Promise<void>;
  isActionLoading: boolean;
}

export default function AdminPhotoGallery({
  photos,
  onDeletePhoto,
  isActionLoading,
}: AdminPhotoGalleryProps) {
  const [photoToDelete, setPhotoToDelete] = useState<AdminCookPhoto | null>(null);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<AdminCookPhoto | null>(null);

  const confirmDelete = async () => {
    if (!photoToDelete) return;
    await onDeletePhoto(photoToDelete.id, photoToDelete.storage_path || undefined);
    setPhotoToDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            Community Cook Photos ({photos.length})
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Review and moderate user-submitted cooking creations and results.
          </p>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-200 p-12 text-center text-stone-400 dark:border-[#2e2722] bg-white dark:bg-[#1a1715]">
          <svg className="mx-auto h-8 w-8 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
          <h4 className="mt-3 text-sm font-bold text-stone-800 dark:text-stone-200">
            No cook photos found
          </h4>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            When users log cooking notes with photos, they will appear here for moderation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xs hover:shadow-md transition dark:border-[#2e2722] dark:bg-[#1a1715]"
            >
              {/* Photo Image container */}
              <div
                onClick={() => setActiveLightboxPhoto(photo)}
                className="relative aspect-4/3 w-full overflow-hidden bg-stone-100 dark:bg-stone-900 cursor-pointer"
              >
                <Image
                  src={photo.image_url}
                  alt={photo.caption || "User cook photo"}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {photo.rating && (
                  <div className="absolute top-2 left-2 rounded-full bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-black text-amber-400">
                    ★ {photo.rating}
                  </div>
                )}

                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
                  </svg>
                  <span>Zoom</span>
                </div>
              </div>

              {/* Card Meta & Details */}
              <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
                <div>
                  <Link
                    href={`/recipes/${photo.recipe_id}`}
                    target="_blank"
                    className="text-xs font-bold text-stone-900 hover:text-amber-600 dark:text-[#fafaf9] dark:hover:text-amber-400 line-clamp-1 transition"
                  >
                    {photo.recipe_title}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 italic">
                    {photo.caption ? `"${photo.caption}"` : "No caption"}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-[#26211d] flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                      {photo.author_name}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-500">
                      {new Date(photo.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPhotoToDelete(photo)}
                    disabled={isActionLoading}
                    className="rounded-lg p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:text-stone-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    title="Delete inappropriate photo"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setActiveLightboxPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-3xl bg-stone-900 border border-white/10 shadow-2xl overflow-hidden p-4 sm:p-6 space-y-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">
                  {activeLightboxPhoto.recipe_title}
                </h4>
                <p className="text-xs text-stone-400">
                  By {activeLightboxPhoto.author_name} • {new Date(activeLightboxPhoto.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveLightboxPhoto(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeLightboxPhoto.image_url}
                alt="Cook photo"
                className="h-full w-full object-contain"
              />
            </div>

            {activeLightboxPhoto.caption && (
              <p className="text-xs text-stone-300 italic">
                &quot;{activeLightboxPhoto.caption}&quot;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 dark:border-[#2e2722] dark:bg-[#1a1715] space-y-4">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Delete Cook Photo?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Will remove the file from storage and the database.
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              Are you sure you want to remove this photo for <strong className="font-bold text-stone-900 dark:text-white">&quot;{photoToDelete.recipe_title}&quot;</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPhotoToDelete(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:border-[#2e2722] dark:text-[#a8a29e] dark:hover:bg-[#25211d] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 text-xs transition cursor-pointer shadow-xs active:scale-95"
              >
                Yes, Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
