import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { api, SESSION_COOKIE } from "./api";

export type User = { uid: string; name: string; email: string };
export type ServerSettings = { time_zone: string };

/** The signed-in user (verified by the API on every call), or null. */
export const getSession = cache(async (): Promise<{ user: User; settings: ServerSettings } | null> => {
  await connection();
  if (!(await cookies()).has(SESSION_COOKIE)) return null;
  const res = await api<{ user: User; settings: ServerSettings }>("/auth/me");
  return res.ok ? res.data : null;
});

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function setSessionCookie(value: string, maxAgeSeconds: number) {
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
