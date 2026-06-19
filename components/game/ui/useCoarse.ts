'use client';

import { useEffect, useState } from 'react';

/**
 * True on touch / coarse-pointer devices (phones, tablets). Drives the
 * runtime split between the dedicated mobile HUD and the desktop HUD — we
 * build a separate touch tree rather than CSS-shrinking the desktop one.
 *
 * SSR-safe: defaults to `false` and only flips after mount, so the server
 * markup matches the first client render (no hydration mismatch / desktop
 * flash). Re-evaluates if the pointer type changes (e.g. tablet + keyboard).
 */
export function useCoarse(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setCoarse(mq.matches || 'ontouchstart' in window);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return coarse;
}
