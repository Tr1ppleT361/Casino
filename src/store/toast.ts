"use client";

import { create } from "zustand";
import { uid } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "danger" | "gold" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id" | "variant" | "duration"> & {
    variant?: ToastVariant;
    duration?: number;
  }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const MAX_VISIBLE = 4;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: ({ title, description, variant = "default", duration = 3600 }) => {
    const id = uid("toast");
    set((state) => ({
      toasts: [{ id, title, description, variant, duration }, ...state.toasts].slice(
        0,
        MAX_VISIBLE,
      ),
    }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Fire-and-forget toast, callable from anywhere (including game engines). */
export function toast(
  title: string,
  options: { description?: string; variant?: ToastVariant; duration?: number } = {},
) {
  return useToastStore.getState().push({ title, ...options });
}
