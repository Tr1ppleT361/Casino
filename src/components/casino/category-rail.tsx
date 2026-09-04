"use client";

import Link from "next/link";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/games";
import { cn } from "@/lib/utils";
import type { GameCategory } from "@/types";

export function CategoryRail({ active }: { active?: GameCategory }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {CATEGORY_ORDER.map((category) => (
        <Link
          key={category}
          href={`/category/${category}`}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
            active === category
              ? "border-primary/50 bg-primary/20 text-foreground shadow-glow"
              : "border-white/[0.07] bg-surface-sunken text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {CATEGORY_LABELS[category]}
        </Link>
      ))}
    </div>
  );
}
