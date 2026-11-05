"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./icons";

const VISIBLE_MS = 4500;

// The current toast lives outside React so it survives navigations (e.g. save, then redirect).
let current: { message: string; until: number } | null = null;
const currentToast = () => current;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Show a confirmation toast (e.g. "Building added."). */
export function toast(message: string) {
  current = { message, until: Date.now() + VISIBLE_MS };
  emit();
  setTimeout(() => {
    if (current && current.until <= Date.now()) {
      current = null;
      emit();
    }
  }, VISIBLE_MS);
}

function dismiss() {
  current = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Shows confirmation toasts. */
export function Flash() {
  const shown = useSyncExternalStore(subscribe, currentToast, () => null);
  if (!shown) return null;
  return (
    <div role="status" className="fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-2 rounded-lg border border-brand-200 bg-white px-4 py-3 text-sm shadow-lg">
      <Icon name="check" className="mt-0.5 size-4 shrink-0 text-brand-600" />
      <span>{shown.message}</span>
      <button className="ml-2 text-muted hover:text-ink" onClick={dismiss} aria-label="Dismiss">
        <Icon name="x" className="size-4" />
      </button>
    </div>
  );
}
