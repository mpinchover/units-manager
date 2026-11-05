"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { errorOf, failed } from "@/lib/action-result";
import { formValues, type ActionState } from "@/lib/forms";
import { flash } from "@/lib/flash";

export async function saveBuilding(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const res = await api<{ id: string }>(id ? `/buildings/${id}` : "/buildings", { method: id ? "PATCH" : "POST", json: formValues(fd) });
  if (!res.ok) return failed(res, fd);
  revalidatePath("/", "layout");
  await flash(id ? "Building updated." : "Building added.");
  redirect(`/buildings/${res.data.id}`);
}

export async function deleteBuilding(id: string): Promise<{ error?: string } | void> {
  const err = errorOf(await api(`/buildings/${id}`, { method: "DELETE" }));
  if (err) return err;
  revalidatePath("/", "layout");
  await flash("Building deleted.");
  redirect("/buildings");
}
