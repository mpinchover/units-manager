import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Flash } from "@/components/flash";
import { Icon } from "@/components/icons";
import { getCtx } from "@/lib/context";
import { logout } from "../(auth)/actions";

async function Account() {
  const { user } = await getCtx();
  return (
    <div className="flex items-center gap-2 border-t border-line px-2 pt-4">
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
        {user.name
          .split(/\s+/)
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>
      <form action={logout}>
        <button className="btn-ghost px-2" title="Sign out" aria-label="Sign out">
          <Icon name="logout" />
        </button>
      </form>
    </div>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <Sidebar
          footer={
            <Suspense fallback={<div className="skeleton mx-2 h-10" />}>
              <Account />
            </Suspense>
          }
        />
      </Suspense>
      <main className="lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
      <Suspense fallback={null}>
        <Flash />
      </Suspense>
    </div>
  );
}
