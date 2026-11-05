"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

export type Vehicle = { make: string; model: string; plate: string };
export type LeasePayload = {
  unit_id: string;
  tenant_ids: string[];
  property_type: string;
  max_occupants: string;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  annual_rent: string;
  first_payment_due: string;
  security_deposit: string;
  security_deposit_due: string;
  other_conditions: string;
  vehicles: Vehicle[];
  extra_fields: Record<string, string>;
};
export type Run = { text: string; field?: string; empty?: boolean };
export type Block = { kind: "title" | "paragraph"; lines: Run[][] };
type Failure = { ok: false; message: string; errors?: Record<string, string> };

function failure(res: { status: number; error: string; errors?: Record<string, string> }): Failure {
  if (res.status === 401) redirect("/login");
  return { ok: false, message: res.errors && res.status === 400 ? "Please fix the highlighted fields." : res.error, errors: res.errors };
}

/** Fill the lease template with the entered values (nothing is saved). */
export async function previewLease(p: LeasePayload, leaseId?: string): Promise<{ ok: true; blocks: Block[] } | Failure> {
  const res = await api<{ blocks: Block[] }>(leaseId ? `/leases/${leaseId}/preview` : "/leases/preview", { json: p });
  return res.ok ? { ok: true, blocks: res.data.blocks } : failure(res);
}

/** Save the lease (a new lease, or a new version of an existing one) and return the PDF's download URL. */
export async function generateLease(p: LeasePayload, leaseId?: string): Promise<{ ok: true; leaseId: string; version: number; downloadUrl: string } | Failure> {
  const res = await api<{ id: string; version: number }>(leaseId ? `/leases/${leaseId}` : "/leases", {
    method: leaseId ? "PATCH" : "POST",
    json: p,
  });
  if (!res.ok) return failure(res);
  revalidatePath("/", "layout");
  return { ok: true, leaseId: res.data.id, version: res.data.version, downloadUrl: `/api/leases/${res.data.id}/documents/${res.data.version}` };
}



