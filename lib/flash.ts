import "server-only";
import { cookies } from "next/headers";

/** Queue a confirmation toast for the next page the user sees (only call from Server Actions). */
export async function flash(message: string) {
  // Next.js URL-encodes cookie values itself; the toast decodes once.
  (await cookies()).set("pp_flash", message, { path: "/", maxAge: 60, sameSite: "lax" });
}
