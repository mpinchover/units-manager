"use client";

import { useEffect, useState, useTransition } from "react";

/**
 * Two-step destructive/important action button (no browser confirm dialogs).
 * `action` is a Server Action bound to its arguments; it may return { error } to display.
 */
export function ConfirmButton({
  action,
  children,
  confirmText = "Click again to confirm",
  className = "btn-danger",
}: {
  action: () => Promise<{ error?: string } | void>;
  children: React.ReactNode;
  confirmText?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            setError(null);
            return;
          }
          setArmed(false);
          start(async () => {
            const res = await action();
            if (res && res.error) setError(res.error);
          });
        }}
      >
        {pending ? "Working…" : armed ? confirmText : children}
      </button>
      {error && <span className="max-w-xs text-right text-xs text-red-700">{error}</span>}
    </span>
  );
}
