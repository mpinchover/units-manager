"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { errorOf, failed } from "@/lib/action-result";
import { formValues, type ActionState } from "@/lib/forms";
import { flash } from "@/lib/flash";

type Created = { id: string; first_name: string; last_name: string; email: string };

export async function saveTenant(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const res = await api<Created>(id ? `/tenants/${id}` : "/tenants", { method: id ? "PATCH" : "POST", json: formValues(fd) });
  if (!res.ok) return failed(res, fd);
  revalidatePath("/", "layout");
  await flash(id ? "Tenant updated." : "Tenant added.");
  redirect(`/tenants/${res.data.id}`);
}

/** Used by the Generate Lease workflow to add a tenant without leaving the page. */
export async function createTenantInline(_: ActionState, fd: FormData): Promise<ActionState> {
  const res = await api<Created>("/tenants", { json: { ...formValues(fd), unit_id: "" } });
  if (!res.ok) return failed(res, fd);
  revalidatePath("/", "layout");
  const label = `${res.data.first_name} ${res.data.last_name}`;
  return { ok: true, message: `${label} added and selected.`, data: { id: res.data.id, label, detail: res.data.email } };
}


export async function deleteTenant(id: string): Promise<{ error?: string } | void> {
  const err = errorOf(await api(`/tenants/${id}`, { method: "DELETE" }));
  if (err) return err;
  revalidatePath("/", "layout");
  await flash("Tenant deleted.");
  redirect("/tenants");
}
