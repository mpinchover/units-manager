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
