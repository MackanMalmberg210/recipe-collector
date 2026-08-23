"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SortableBuilderRowProps = {
  id: string;
  children: ReactNode;
  accent?: "emerald" | "amber";
};

export default function SortableBuilderRow({
  id,
  children,
  accent = "emerald",
}: SortableBuilderRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    transition: {
      duration: 90,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const accentClasses =
    accent === "amber"
      ? "data-[dragging=true]:border-amber-500/50 data-[dragging=true]:bg-amber-500/10"
      : "data-[dragging=true]:border-emerald-500/50 data-[dragging=true]:bg-emerald-500/10";

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging ? "true" : "false"}
      className={`group/row space-y-2 rounded-2xl border border-stone-200/90 bg-stone-50/50 p-2.5 shadow-2xs transition-all duration-200 hover:border-stone-300 dark:border-white/[0.08] dark:bg-[#191512] dark:hover:border-white/16 ${accentClasses} ${
        isDragging
          ? "z-20 opacity-40 shadow-2xl scale-[1.01]"
          : ""
      }`}
    >
      <div className="flex items-center gap-2.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          className="flex h-9 w-8 shrink-0 cursor-grab items-center justify-center rounded-xl border border-stone-200/80 bg-white text-stone-400 shadow-2xs transition-all duration-200 hover:border-amber-500/40 hover:bg-amber-50/30 hover:text-amber-700 active:cursor-grabbing dark:border-white/10 dark:bg-[#201b18] dark:text-stone-400 dark:hover:border-amber-400/40 dark:hover:bg-amber-400/10 dark:hover:text-amber-300"
          aria-label="Drag to reorder"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.3" />
            <circle cx="15" cy="6" r="1.3" />
            <circle cx="9" cy="12" r="1.3" />
            <circle cx="15" cy="12" r="1.3" />
            <circle cx="9" cy="18" r="1.3" />
            <circle cx="15" cy="18" r="1.3" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </li>
  );
}
