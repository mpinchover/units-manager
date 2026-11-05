"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "./icons";

const COOKIE = "pp_flash";
const VISIBLE_MS = 4500;

// The current toast lives outside React so it survives the toast component being re-created
// during a navigation (e.g. a Server Action that redirects right after setting the message).
let current: { message: string; until: number } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function show(message: string) {
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

/** Move a message set by a Server Action (short-lived cookie) into the toast. */
function readCookie() {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
  if (!match) return;
  document.cookie = `${COOKIE}=; Max-Age=0; path=/`;
  let message = match.slice(COOKIE.length + 1);
  try {
    message = decodeURIComponent(message);
  } catch {}
  if (message) show(message);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Shows one-off confirmation messages set by Server Actions. */
export function Flash() {
  const pathname = usePathname();
  const toast = useSyncExternalStore(subscribe, () => current, () => null);

  // Check after every navigation (redirecting actions) and on demand (actions that stay on the page).
  useEffect(() => {
    const t = setTimeout(readCookie, 0);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("pp:flash", readCookie);
    return () => window.removeEventListener("pp:flash", readCookie);
  }, []);

  if (!toast) return null;
  return (
    <div role="status" className="fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-2 rounded-lg border border-brand-200 bg-white px-4 py-3 text-sm shadow-lg">
      <Icon name="check" className="mt-0.5 size-4 shrink-0 text-brand-600" />
      <span>{toast.message}</span>
      <button className="ml-2 text-muted hover:text-ink" onClick={dismiss} aria-label="Dismiss">
        <Icon name="x" className="size-4" />
      </button>
    </div>
  );
}
