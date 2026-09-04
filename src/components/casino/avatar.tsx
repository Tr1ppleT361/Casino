"use client";

import { cn } from "@/lib/utils";
import type { AvatarId } from "@/store/settings";

/**
 * Avatars are generated inline as SVG - no external images, no third-party
 * artwork, and they scale crisply on every device.
 */
const AVATAR_ART: Record<AvatarId, { from: string; to: string; glyph: string; label: string }> = {
  "royal-flush": { from: "#a855f7", to: "#6366f1", glyph: "♠", label: "Royal Flush" },
  "neon-dice": { from: "#22d3ee", to: "#a855f7", glyph: "🎲", label: "Neon Dice" },
  "gold-chip": { from: "#facc15", to: "#f59e0b", glyph: "◉", label: "Gold Chip" },
  "lucky-seven": { from: "#f43f5e", to: "#facc15", glyph: "7", label: "Lucky Seven" },
  "diamond-hand": { from: "#38bdf8", to: "#818cf8", glyph: "◆", label: "Diamond Hand" },
  rocket: { from: "#8b5cf6", to: "#ec4899", glyph: "🚀", label: "Rocket" },
  crown: { from: "#fbbf24", to: "#f97316", glyph: "♛", label: "Crown" },
  joker: { from: "#34d399", to: "#0ea5e9", glyph: "★", label: "Joker" },
};

export const AVATAR_LABELS = Object.fromEntries(
  Object.entries(AVATAR_ART).map(([id, art]) => [id, art.label]),
) as Record<AvatarId, string>;

export function Avatar({
  avatar,
  className,
  size = 40,
}: {
  avatar: AvatarId;
  className?: string;
  size?: number;
}) {
  const art = AVATAR_ART[avatar] ?? AVATAR_ART["neon-dice"];
  const gradientId = `avatar-${avatar}`;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/10",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={art.label}
      role="img"
    >
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={art.from} />
            <stop offset="100%" stopColor={art.to} />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill={`url(#${gradientId})`} />
        <circle cx="30" cy="10" r="14" fill="#fff" opacity="0.14" />
      </svg>
      <span
        className="relative font-black text-white drop-shadow"
        style={{ fontSize: size * 0.42, lineHeight: 1 }}
      >
        {art.glyph}
      </span>
    </span>
  );
}
