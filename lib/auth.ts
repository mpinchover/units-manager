import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./api";

// API mode: the httpOnly cookie holding the Firebase session cookie issued by the Flask server.

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
