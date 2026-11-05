import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Base URL of the Flask API server. Only the Next.js server talks to it; browsers never do. */
export const API_URL = (process.env.API_URL ?? "http://127.0.0.1:5001").replace(/\/$/, "");
export const SESSION_COOKIE = "pp_session";

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; errors?: Record<string, string> };

async function authHeader(): Promise<Record<string, string>> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  return session ? { Authorization: `Session ${session}` } : {};
}

/** Call the API as the signed-in user. Returns a result instead of throwing on 4xx so callers can show field errors. */
export async function api<T = unknown>(
  path: string,
  init: { method?: string; json?: unknown; form?: FormData } = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = await authHeader();
  let body: BodyInit | undefined;
  if (init.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  } else if (init.form) {
    body = init.form;
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: init.method ?? (body ? "POST" : "GET"), headers, body, cache: "no-store" });
  } catch {
    return { ok: false, status: 503, error: "The UnitManager server isn't reachable. Please try again." };
  }
  const data = res.headers.get("content-type")?.includes("application/json") ? await res.json().catch(() => ({})) : {};
  if (res.ok) return { ok: true, status: res.status, data: data as T };
  return { ok: false, status: res.status, error: data.error ?? `Request failed (${res.status}).`, errors: data.errors };
}

/** For page rendering: unwrap a result, sending signed-out users to /login. */
export async function apiOrThrow<T>(path: string): Promise<T> {
  const res = await api<T>(path);
  if (res.ok) return res.data;
  if (res.status === 401) redirect("/login");
  throw new Error(res.error);
}

/** Stream a binary response (PDFs, photos) from the API to the browser, keeping the user's session server-side. */
export async function proxyFile(path: string, search = ""): Promise<Response> {
  const res = await fetch(`${API_URL}${path}${search}`, { headers: await authHeader(), cache: "no-store" }).catch(() => null);
  if (!res) return new Response("Server unavailable", { status: 503 });
  const headers = new Headers();
  for (const h of ["content-type", "content-disposition", "cache-control", "x-content-type-options"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(res.body, { status: res.status, headers });
}
