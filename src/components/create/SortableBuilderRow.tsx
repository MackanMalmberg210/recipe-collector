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
      ? "data-[dragging=true]:border-amber-500/30 data-[dragging=true]:bg-amber-500/5"
      : "data-[dragging=true]:border-emerald-500/30 data-[dragging=true]:bg-emerald-500/5";

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging ? "true" : "false"}
      className={`space-y-2 rounded-2xl border border-white/6 p-3 transition ${accentClasses} ${
        isDragging
          ? "z-20 opacity-35 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
          : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-xl border border-white/8 bg-stone-900/60 text-sm text-stone-400 transition hover:bg-white/5 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          ⋮⋮
        </button>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </li>
  );
}
