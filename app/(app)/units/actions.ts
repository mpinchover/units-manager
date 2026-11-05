"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { errorOf, failed } from "@/lib/action-result";
import { formValues, type ActionState } from "@/lib/forms";
import { flash } from "@/lib/flash";

export async function saveUnit(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const res = await api<{ id: string }>(id ? `/units/${id}` : "/units", { method: id ? "PATCH" : "POST", json: formValues(fd) });
  if (!res.ok) return failed(res, fd);
  revalidatePath("/", "layout");
  await flash(id ? "Unit updated." : "Unit added.");
  const next = fd.get("next");
  redirect(typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : `/units/${res.data.id}`);
}

export async function deleteUnit(id: string): Promise<{ error?: string } | void> {
  const res = await api<{ building_id: string }>(`/units/${id}`, { method: "DELETE" });
  const err = errorOf(res);
  if (err || !res.ok) return err ?? undefined;
  revalidatePath("/", "layout");
  await flash("Unit deleted.");
  redirect(`/buildings/${res.data.building_id}`);
}
