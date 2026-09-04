"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from "lucide-react";
import { useToastStore, type ToastItem } from "@/store/toast";
import { cn } from "@/lib/utils";

const ICONS = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  danger: AlertTriangle,
  gold: Sparkles,
} as const;

const TONE = {
  default: "border-white/10 bg-surface-raised",
  info: "border-accent/30 bg-accent/10",
  success: "border-success/30 bg-success/10",
  danger: "border-destructive/30 bg-destructive/10",
  gold: "border-gold/30 bg-gold/10",
} as const;

const ICON_TONE = {
  default: "text-muted-foreground",
  info: "text-accent",
  success: "text-success",
  danger: "text-destructive",
  gold: "text-gold",
} as const;

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const Icon = ICONS[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-3.5 backdrop-blur-xl shadow-[0_20px_50px_-20px_hsl(240_60%_2%/0.9)]",
        TONE[toast.variant],
      )}
      role="status"
    >
      <Icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", ICON_TONE[toast.variant])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
        aria-label="Benachrichtigung schließen"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end sm:px-0">
      <div className="flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <ToastCard key={item.id} toast={item} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
