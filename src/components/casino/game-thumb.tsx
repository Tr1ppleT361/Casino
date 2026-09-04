import type { GameDefinition } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Card artwork is generated from the registry entry - gradient, pattern and a
 * glyph. No external images and no third-party branding anywhere.
 */
export function GameThumb({
  game,
  className,
  showGlyph = true,
}: {
  game: GameDefinition;
  className?: string;
  showGlyph?: boolean;
}) {
  const { from, to, glyph, pattern } = game.art;
  const id = `pattern-${game.slug}`;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `linear-gradient(135deg, hsl(${from}) 0%, hsl(${to}) 100%)`,
      }}
      aria-hidden
    >
      <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          {pattern === "grid" && (
            <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M10 0H0V10" fill="none" stroke="#fff" strokeWidth="0.6" />
            </pattern>
          )}
          {pattern === "diamonds" && (
            <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
              <path d="M7 1 13 7 7 13 1 7Z" fill="none" stroke="#fff" strokeWidth="0.7" />
            </pattern>
          )}
          {pattern === "bubbles" && (
            <pattern id={id} width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="3.4" fill="none" stroke="#fff" strokeWidth="0.7" />
            </pattern>
          )}
          {pattern === "waves" && (
            <pattern id={id} width="24" height="12" patternUnits="userSpaceOnUse">
              <path d="M0 6 Q6 0 12 6 T24 6" fill="none" stroke="#fff" strokeWidth="0.8" />
            </pattern>
          )}
          {pattern === "rays" && (
            <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M0 12 L12 0" stroke="#fff" strokeWidth="0.8" />
            </pattern>
          )}
          {pattern === "cards" && (
            <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
              <rect x="4" y="3" width="9" height="12" rx="1.6" fill="none" stroke="#fff" strokeWidth="0.7" />
            </pattern>
          )}
        </defs>
        <rect width="100" height="100" fill={`url(#${id})`} />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-white/10" />

      {showGlyph && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="select-none text-[2.2em] drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {glyph}
          </span>
        </div>
      )}
    </div>
  );
}
