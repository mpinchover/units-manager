"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { dataSource, DATA_SOURCE, type DataSource, type Result, type User } from "@/lib/data-source";
import { apiMe } from "@/app/actions/api-source";
import { logout as apiLogout } from "@/app/(auth)/actions";
import { formatDate, formatMoney } from "@/lib/domain";
import { loadPortfolio, type Portfolio, type RawPortfolio } from "@/lib/data/portfolio";
import { SkeletonPage } from "./ui";

export type Ctx = {
  user: User;
  today: string;
  formatDate: (d: string | null | undefined) => string;
  formatMoney: (cents: number | null | undefined) => string;
};

type App = {
  ctx: Ctx;
  p: Portfolio;
  ds: DataSource;
  /** Reload data after a change. */
  refresh: () => Promise<void>;
  /** Unwrap a data-source result; signed-out (401) results send the user to /login. */
  check: <T>(res: Result<T>) => Result<T>;
  logout: () => Promise<void>;
};

const AppContext = createContext<{ app: App | null; error: string | null }>({ app: null, error: null });

export function useApp(): App {
  const { app } = use(AppContext);
  if (!app) throw new Error("useApp must be used inside <AppProvider> once data has loaded");
  return app;
}

/** Signed-in user: Firebase in the browser (demo mode) or the server session (API mode). */
function useUser(): User | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    if (DATA_SOURCE === "api") {
      let alive = true;
      apiMe().then((res) => {
        if (!alive) return;
        if (res.ok) setUser(res.data.user);
        else router.replace("/login");
      });
      return () => {
        alive = false;
      };
    }
    return onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      const email = u.email ?? "";
      setUser({ uid: u.uid, email, name: u.displayName || email.split("@")[0] || "Landlord" });
    });
  }, [router]);
  return user;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useUser();
  const [raw, setRaw] = useState<RawPortfolio | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(
    <T,>(res: Result<T>): Result<T> => {
      if (!res.ok && res.status === 401) router.replace("/login");
      return res;
    },
    [router],
  );

  const refresh = useCallback(async () => {
    const res = check(await dataSource.load());
    if (res.ok) {
      setRaw(res.data);
      setError(null);
    } else if (res.status !== 401) setError(res.error);
  }, [check]);

  // Initial load once we know who's signed in.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    dataSource.load().then((res) => {
      if (!alive) return;
      check(res);
      if (res.ok) setRaw(res.data);
      else if (res.status !== 401) setError(res.error);
    });
    return () => {
      alive = false;
    };
  }, [user, check]);

  const logout = useCallback(async () => {
    await signOut(auth).catch(() => {});
    if (DATA_SOURCE === "api") await apiLogout();
    router.replace("/login");
  }, [router]);

  const app = useMemo<App | null>(() => {
    if (!user || !raw) return null;
    return {
      ctx: { user, today: raw.today, formatDate: (d) => formatDate(d), formatMoney: (c) => formatMoney(c) },
      p: loadPortfolio(raw),
      ds: dataSource,
      refresh,
      check,
      logout,
    };
  }, [user, raw, refresh, check, logout]);

  return <AppContext value={{ app, error }}>{children}</AppContext>;
}

/** Renders page content once the user and data are loaded. */
export function Ready({ children }: { children: ReactNode }) {
  const { app, error } = use(AppContext);
  if (error && !app) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Couldn&apos;t load your data: {error}
      </div>
    );
  }
  if (!app) return <SkeletonPage />;
  return <>{children}</>;
}

/** The app once loaded, else null (for chrome like the sidebar's account footer). */
export function useMaybeApp() {
  return use(AppContext).app;
}
