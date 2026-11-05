import "server-only";
import { apiOrThrow } from "./api";

type TemplateInfo = { fields: { key: string; label: string; required: boolean }[]; extra: string[] };

/** The lease template's variables, from the API: labels for the preview and any extra free-text fields. */
export async function leaseTemplateInfo() {
  const info = await apiOrThrow<TemplateInfo>("/leases/template");
  const labels = Object.fromEntries(info.fields.map((f) => [f.key, f.label]));
  return { labels, extraFields: info.extra.map((key) => ({ key, label: labels[key] ?? key })) };
}
