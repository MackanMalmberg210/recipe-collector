"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SortableInstructionStepProps = {
  id: string;
  index: number;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onRemove: () => void;
  textareaRef?: (element: HTMLTextAreaElement | null) => void;
};

export default function SortableInstructionStep({
  id,
  index,
  value,
  onChange,
  onKeyDown,
  onRemove,
  textareaRef,
}: SortableInstructionStepProps) {
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

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-dragging={isDragging ? "true" : "false"}
      className={`group relative flex items-stretch gap-3.5 transition-all duration-150 ${
        isDragging ? "z-30 opacity-40 scale-[1.01]" : ""
      }`}
    >
      {/* Left Timeline Indicator: Number Badge + Vertical Flow Line */}
      <div className="flex flex-col items-center pt-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-black text-amber-800 dark:bg-amber-400/15 dark:border-amber-400/25 dark:text-amber-300 shadow-2xs">
          {index + 1}
        </div>
        {/* Subtle connecting line beneath the number */}
        <div className="w-0.5 flex-1 bg-stone-200 dark:bg-white/10 my-1 group-last:hidden" />
      </div>

      {/* Main Crisp Step Container */}
      <div className="flex-1 mb-3 rounded-2xl border border-stone-300 bg-white p-3 shadow-2xs transition-all duration-200 hover:border-stone-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-white/12 dark:bg-[#1a1614] dark:hover:border-white/20 dark:focus-within:border-amber-400 dark:focus-within:bg-[#201b18] dark:focus-within:ring-amber-400/20">
        <div className="flex items-start gap-2.5">
          {/* Drag Handle */}
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            className="mt-1 flex h-7 w-6 shrink-0 cursor-grab items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:cursor-grabbing dark:text-stone-500 dark:hover:bg-white/5 dark:hover:text-stone-200"
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.4" />
              <circle cx="15" cy="6" r="1.4" />
              <circle cx="9" cy="12" r="1.4" />
              <circle cx="15" cy="12" r="1.4" />
              <circle cx="9" cy="18" r="1.4" />
              <circle cx="15" cy="18" r="1.4" />
            </svg>
          </button>

          {/* Clean Integrated Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="Describe what to do in this step..."
            className="w-full resize-y bg-transparent text-xs sm:text-sm font-medium leading-relaxed text-stone-950 placeholder:text-stone-400 outline-none dark:text-stone-50 dark:placeholder:text-stone-500"
          />

          {/* Delete Button */}
          <button
            type="button"
            onClick={onRemove}
            className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-rose-200/80 bg-rose-50 text-xs font-bold text-rose-700 transition hover:bg-rose-100 hover:text-rose-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20 cursor-pointer"
            title="Remove step"
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  );
}
