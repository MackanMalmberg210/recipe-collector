"use client";

const navItems = [
  { label: "Planner", targetId: "planner-preview" },
  { label: "Kitchen Hub", targetId: "kitchen-hub" },
  { label: "Pantry", targetId: "pantry-section" },
  { label: "Matches", targetId: "recipe-matches" },
];

export default function HomeSectionNav() {
  const handleScroll = (targetId: string) => {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="sticky top-4 z-30 mb-8">
      <div className="mx-auto w-full max-w-fit rounded-full border border-white/10 bg-[#171411]/80 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.targetId}
              type="button"
              onClick={() => handleScroll(item.targetId)}
              className="rounded-full px-4 py-2 text-sm font-medium text-stone-300 transition hover:bg-white/8 hover:text-stone-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
