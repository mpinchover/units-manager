import "server-only";
import { cache } from "react";
import { requireSession, type ServerSettings, type User } from "./auth";
import { apiOrThrow } from "./api";
import { todayInTimeZone, formatDate as fmtDate, formatMoney as fmtMoney } from "./domain";
import { loadPortfolio, type Portfolio, type RawPortfolio } from "./data/portfolio";

export type Ctx = {
  user: User;
  settings: ServerSettings;
  today: string;
  formatDate: (d: string | null | undefined) => string;
  formatMoney: (cents: number | null | undefined) => string;
};

/** Per-request context: the authenticated user and app settings. Redirects to /login when signed out. */
export const getCtx = cache(async (): Promise<Ctx> => {
  const { user, settings } = await requireSession();
  return {
    user,
    settings,
    today: todayInTimeZone(settings.time_zone),
    formatDate: (d) => fmtDate(d),
    formatMoney: (c) => fmtMoney(c),
  };
});

/** Per-request snapshot of everything the landlord owns, from the API. */
export const getPortfolio = cache(async (): Promise<Portfolio> => {
  await getCtx();
  const raw = await apiOrThrow<RawPortfolio>("/portfolio");
  return loadPortfolio(raw);
});
