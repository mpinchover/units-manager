"use client";

import { Icon } from "./icons";
import { useMaybeApp } from "./app-provider";

/** Signed-in user and sign-out button for the sidebar. */
export function Account() {
  const app = useMaybeApp();
  if (!app) return <div className="skeleton mx-2 h-10" />;
  const { user } = app.ctx;
  return (
    <div className="flex items-center gap-2 border-t border-line px-2 pt-4">
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
        {user.name
          .split(/\s+/)
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>
      <button className="btn-ghost px-2" title="Sign out" aria-label="Sign out" onClick={() => app.logout()}>
        <Icon name="logout" />
      </button>
    </div>
  );
}
