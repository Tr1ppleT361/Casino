import { createJSONStorage, type PersistStorage } from "zustand/middleware";

/**
 * Single seam between the app and its storage backend.
 *
 * Everything the casino persists (wallet, settings, history, stats) goes
 * through here. Today that is `localStorage`; swapping in a remote backend
 * (PostgreSQL/Supabase via an API route) means replacing this one adapter with
 * an async implementation - the stores themselves stay untouched.
 */

const memory = new Map<string, string>();

const memoryBackend: Storage = {
  get length() {
    return memory.size;
  },
  clear: () => memory.clear(),
  getItem: (key) => memory.get(key) ?? null,
  key: (index) => Array.from(memory.keys())[index] ?? null,
  removeItem: (key) => void memory.delete(key),
  setItem: (key, value) => void memory.set(key, value),
};

function backend(): Storage {
  if (typeof window === "undefined") return memoryBackend;
  try {
    const probe = "__casino_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    // Private mode / storage blocked - stay in memory for this session.
    return memoryBackend;
  }
}

export const STORAGE_PREFIX = "casino.demo";

export function casinoStorage<T>(): PersistStorage<T> | undefined {
  return createJSONStorage<T>(backend) as PersistStorage<T>;
}
