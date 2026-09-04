"use client";

import { useEffect, useState } from "react";

/**
 * Persisted stores only have real values after the client rehydrates.
 * Components use this to render a stable placeholder on the server pass and
 * avoid hydration mismatches on balances that live in localStorage.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
