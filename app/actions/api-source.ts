"use server";

/**
 * API mode (NEXT_PUBLIC_DATA_SOURCE=api): Server Actions that forward each data-source call to the
 * Flask server with the user's session cookie. The browser never talks to Flask directly.
 */
import { api, type ApiResult } from "@/lib/api";
import type { RawPortfolio } from "@/lib/data/portfolio";
import type { Block, LeasePayload, Result, TemplateInfo, User, Values } from "@/lib/data-source/types";

function result<T>(res: ApiResult<T>): Result<T> {
  return res.ok ? { ok: true, data: res.data } : { ok: false, error: res.error, errors: res.errors, status: res.status };
}

export async function apiMe(): Promise<Result<{ user: User }>> {
  return result(await api<{ user: User }>("/auth/me"));
}
export async function apiLoad(): Promise<Result<RawPortfolio>> {
  return result(await api<RawPortfolio>("/portfolio"));
}
export async function apiSaveBuilding(id: string | null, values: Values) {
  return result(await api<{ id: string }>(id ? `/buildings/${id}` : "/buildings", { method: id ? "PATCH" : "POST", json: values }));
}
export async function apiDeleteBuilding(id: string) {
  return result(await api(`/buildings/${id}`, { method: "DELETE" }));
}
export async function apiSaveUnit(id: string | null, values: Values) {
  return result(await api<{ id: string }>(id ? `/units/${id}` : "/units", { method: id ? "PATCH" : "POST", json: values }));
}
export async function apiDeleteUnit(id: string) {
  return result(await api<{ building_id: string }>(`/units/${id}`, { method: "DELETE" }));
}
export async function apiSaveTenant(id: string | null, values: Values) {
  return result(await api<{ id: string; first_name: string; last_name: string; email: string }>(id ? `/tenants/${id}` : "/tenants", { method: id ? "PATCH" : "POST", json: values }));
}
export async function apiDeleteTenant(id: string) {
  return result(await api(`/tenants/${id}`, { method: "DELETE" }));
}
export async function apiTemplateInfo() {
  return result(await api<TemplateInfo>("/leases/template"));
}
export async function apiPreviewLease(payload: LeasePayload, leaseId?: string) {
  return result(await api<{ blocks: Block[] }>(leaseId ? `/leases/${leaseId}/preview` : "/leases/preview", { json: payload }));
}
export async function apiSaveLease(payload: LeasePayload, leaseId?: string) {
  return result(await api<{ id: string; version: number }>(leaseId ? `/leases/${leaseId}` : "/leases", { method: leaseId ? "PATCH" : "POST", json: payload }));
}
