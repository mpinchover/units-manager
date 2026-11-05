import type { RawPortfolio } from "../data/portfolio";

/**
 * The contract between the UI and wherever the data lives.
 *   - "demo": an in-memory store in the browser (lib/demo), reset on page reload.
 *   - "api":  the Flask server, reached through Next.js Server Actions (app/actions/api.ts).
 * Pick one with NEXT_PUBLIC_DATA_SOURCE (see README).
 */
export type DataSourceMode = "demo" | "api";

export const DATA_SOURCE: DataSourceMode = process.env.NEXT_PUBLIC_DATA_SOURCE === "api" ? "api" : "demo";

export type User = { uid: string; name: string; email: string };

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; errors?: Record<string, string>; status?: number };

export type Values = Record<string, string>;

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
export type TemplateInfo = { fields: { key: string; label: string; required: boolean }[]; extra: string[] };

export interface DataSource {
  /** Everything the signed-in user owns. */
  load(): Promise<Result<RawPortfolio>>;
  saveBuilding(id: string | null, values: Values): Promise<Result<{ id: string }>>;
  deleteBuilding(id: string): Promise<Result<unknown>>;
  saveUnit(id: string | null, values: Values): Promise<Result<{ id: string }>>;
  deleteUnit(id: string): Promise<Result<{ building_id: string }>>;
  saveTenant(id: string | null, values: Values): Promise<Result<{ id: string; first_name: string; last_name: string; email: string }>>;
  deleteTenant(id: string): Promise<Result<unknown>>;
  templateInfo(): Promise<Result<TemplateInfo>>;
  previewLease(payload: LeasePayload, leaseId?: string): Promise<Result<{ blocks: Block[] }>>;
  saveLease(payload: LeasePayload, leaseId?: string): Promise<Result<{ id: string; version: number }>>;
  /** Download a lease PDF (latest version when `version` is omitted). */
  downloadPdf(leaseId: string, version?: number): Promise<Result<unknown>>;
}
