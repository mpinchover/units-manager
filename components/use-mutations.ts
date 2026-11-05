"use client";

import { useRouter } from "next/navigation";
import { useApp } from "./app-provider";
import { toast } from "./flash";
import { formValues, type ActionState } from "@/lib/forms";
import type { Result, Values } from "@/lib/data-source";

type FormAction = (state: ActionState, fd: FormData) => Promise<ActionState>;
type ConfirmAction = () => Promise<{ error?: string } | void>;

/** Form and delete handlers for buildings, units and tenants, backed by the active data source. */
export function useMutations() {
  const { ds, refresh, check } = useApp();
  const router = useRouter();

  function form<T>(save: (v: Values) => Promise<Result<T>>, done: (data: T, v: Values) => void): FormAction {
    return async (_state, fd) => {
      const values = formValues(fd);
      const res = check(await save(values));
      if (!res.ok) return { ok: false, message: res.errors ? "Please fix the highlighted fields." : res.error, errors: res.errors, values };
      await refresh();
      done(res.data, values);
      return { ok: true };
    };
  }

  function remove<T>(del: () => Promise<Result<T>>, done: (data: T) => void): ConfirmAction {
    return async () => {
      const res = check(await del());
      if (!res.ok) return { error: res.error };
      done(res.data); // navigate away first, so the deleted record's page never renders without it
      await refresh();
    };
  }

  return {
    saveBuilding: (id: string | null) =>
      form((v) => ds.saveBuilding(id, v), (d) => {
        toast(id ? "Building updated." : "Building added.");
        router.push(`/buildings/${d.id}`);
      }),
    deleteBuilding: (id: string) =>
      remove(() => ds.deleteBuilding(id), () => {
        toast("Building deleted.");
        router.push("/buildings");
      }),
    saveUnit: (id: string | null) =>
      form((v) => ds.saveUnit(id, v), (d, v) => {
        toast(id ? "Unit updated." : "Unit added.");
        const next = v.next;
        router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : `/units/${d.id}`);
      }),
    deleteUnit: (id: string) =>
      remove(() => ds.deleteUnit(id), (d) => {
        toast("Unit deleted.");
        router.push(`/buildings/${d.building_id}`);
      }),
    saveTenant: (id: string | null) =>
      form((v) => ds.saveTenant(id, v), (d) => {
        toast(id ? "Tenant updated." : "Tenant added.");
        router.push(`/tenants/${d.id}`);
      }),
    deleteTenant: (id: string) =>
      remove(() => ds.deleteTenant(id), () => {
        toast("Tenant deleted.");
        router.push("/tenants");
      }),
    /** Used inside the Generate Lease workflow: adds a tenant without leaving the page. */
    createTenantInline: (async (_state, fd) => {
      const values = { ...formValues(fd), unit_id: "" };
      const res = check(await ds.saveTenant(null, values));
      if (!res.ok) return { ok: false, message: res.errors ? "Please fix the highlighted fields." : res.error, errors: res.errors, values };
      await refresh();
      const label = `${res.data.first_name} ${res.data.last_name}`;
      return { ok: true, message: `${label} added and selected.`, data: { id: res.data.id, label, detail: res.data.email } };
    }) as FormAction,
  };
}
