import "server-only";
import { redirect } from "next/navigation";
import type { ApiResult } from "./api";
import { formValues, type ActionState } from "./forms";

/** Turn a failed API call into form state (field errors + the values the user typed). */
export function failed(res: Extract<ApiResult<unknown>, { ok: false }>, fd: FormData | null): ActionState {
  if (res.status === 401) redirect("/login");
  return { ok: false, message: res.errors ? "Please fix the highlighted fields." : res.error, errors: res.errors, values: fd ? formValues(fd) : undefined };
}

/** For confirm-button actions: `{ error }` on failure. */
export function errorOf(res: ApiResult<unknown>): { error: string } | null {
  if (res.ok) return null;
  if (res.status === 401) redirect("/login");
  return { error: res.error };
}
