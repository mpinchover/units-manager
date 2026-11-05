import type { ZodError } from "zod";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
  data?: Record<string, unknown>;
};

export const initialState: ActionState = {};

export function formValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION") && !/password|confirm/i.test(k)) out[k] = out[k] ? `${out[k]},${v}` : v;
  }
  return out;
}

export function zodErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function failure(fd: FormData | null, errors: Record<string, string>, message = "Please fix the highlighted fields."): ActionState {
  return { ok: false, message, errors, values: fd ? formValues(fd) : undefined };
}
