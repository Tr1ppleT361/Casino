import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5 focus-visible:outline-none", className)}
      aria-label="Zur Casino-Lobby"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-accent shadow-glow transition-transform group-hover:scale-105">
        <span className="text-lg font-black text-white">♠</span>
        <span className="absolute -inset-0.5 -z-10 rounded-xl bg-primary/40 blur-lg" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-black tracking-tight text-foreground">
            LUMEN<span className="text-gradient">PLAY</span>
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-gold">
            Demo Casino
          </span>
        </span>
      )}
    </Link>
  );
}
