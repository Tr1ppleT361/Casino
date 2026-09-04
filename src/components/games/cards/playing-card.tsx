"use client";

import { motion } from "framer-motion";
import { isRed, type Card } from "@/lib/cards";
import { cn } from "@/lib/utils";

/**
 * A card is drawn entirely with markup and CSS - no imported artwork, so
 * nothing here reproduces a real deck's design.
 */
export function PlayingCard({
  card,
  faceDown = false,
  index = 0,
  className,
  size = "default",
}: {
  card?: Card;
  faceDown?: boolean;
  index?: number;
  className?: string;
  size?: "default" | "sm";
}) {
  const red = card ? isRed(card) : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: -40, rotate: -12, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 22,
        delay: Math.min(index * 0.09, 0.6),
      }}
      className={cn(
        "relative select-none rounded-lg border shadow-lg",
        size === "sm" ? "h-16 w-11 text-xs" : "h-24 w-16 text-sm sm:h-28 sm:w-20",
        faceDown
          ? "border-primary/30 bg-gradient-to-br from-primary/70 via-primary/40 to-accent/50"
          : "border-black/20 bg-gradient-to-br from-white to-slate-100",
        className,
      )}
      aria-label={faceDown ? "Verdeckte Karte" : `${card?.rank} ${card?.suit}`}
    >
      {faceDown ? (
        <div className="absolute inset-1.5 rounded-md border border-white/25 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.16)_0_6px,transparent_6px_12px)]" />
      ) : (
        <>
          <span
            className={cn(
              "absolute left-1.5 top-1 font-black leading-none",
              red ? "text-rose-600" : "text-slate-900",
            )}
          >
            {card?.rank}
          </span>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center font-black",
              size === "sm" ? "text-xl" : "text-3xl",
              red ? "text-rose-600" : "text-slate-900",
            )}
          >
            {card?.suit}
          </span>
          <span
            className={cn(
              "absolute bottom-1 right-1.5 rotate-180 font-black leading-none",
              red ? "text-rose-600" : "text-slate-900",
            )}
          >
            {card?.rank}
          </span>
        </>
      )}
    </motion.div>
  );
}

export function CardHand({
  cards,
  hidden = 0,
  size = "default",
  className,
}: {
  cards: Card[];
  /** How many trailing cards stay face down. */
  hidden?: number;
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {cards.map((card, index) => (
        <PlayingCard
          key={card.id}
          card={card}
          index={index}
          size={size}
          faceDown={index >= cards.length - hidden}
        />
      ))}
    </div>
  );
}
