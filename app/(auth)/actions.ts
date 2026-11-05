"use server";

import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth";

/** After Firebase sign-in in the browser, trade the ID token for a server-side session cookie. */
export async function startSession(idToken: string): Promise<{ error?: string }> {
  const res = await api<{ session_cookie: string; expires_in: number }>("/auth/session", { json: { id_token: idToken } });
  if (!res.ok) return { error: res.error };
  await setSessionCookie(res.data.session_cookie, res.data.expires_in);
  return {};
}

export async function logout() {
  await api("/auth/logout", { method: "POST" });
  await clearSessionCookie();
  redirect("/login");
}
