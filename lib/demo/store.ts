/**
 * Demo data source: everything lives in this browser tab's memory and resets on reload.
 * Implements the same DataSource contract and rules as the Flask API.
 */
import { DEFAULT_TIME_ZONE } from "../constants";
import { rangesOverlap, todayInTimeZone } from "../domain";
import type { Building, Lease, RawPortfolio, Tenant, Unit } from "../data/portfolio";
import type { Block, DataSource, LeasePayload, Result, Values } from "../data-source/types";
import { buildBlocks, formatAmount, formatLongDate, templateInfo } from "./lease-doc";
import { seedData } from "./seed";
import { validateBuilding, validateLease, validateTenant, validateUnit, type LeaseInput } from "./validate";

type Version = { version: number; created_at: string; input: LeaseInput; signed_on: string };
type State = { buildings: Building[]; units: Unit[]; tenants: Tenant[]; leases: Lease[]; versions: Map<string, Version[]> };

const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
const invalid = (errors: Record<string, string>): Result<never> => ({ ok: false, error: "Please fix the highlighted fields.", errors, status: 400 });
const fail = (error: string, status = 409, field?: string): Result<never> => ({ ok: false, error, status, errors: field ? { [field]: error } : undefined });
const notFound = (what: string) => fail(`${what} not found.`, 404);
const now = () => new Date().toISOString();
const today = () => todayInTimeZone(DEFAULT_TIME_ZONE);
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(15)), (b) => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[b % 62]).join("").slice(0, 20);
const newReference = () => "PP-" + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
const byName = (a: Tenant, b: Tenant) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name);

let state: State | null = null;

function fieldsOf(input: LeaseInput, building_id: string) {
  return {
    unit_id: input.unit_id, building_id, tenant_ids: input.tenant_ids, property_type: input.property_type,
    max_occupants: input.max_occupants, start_date: input.start_date, end_date: input.end_date,
    monthly_rent_cents: input.monthly_rent_cents, annual_rent_cents: input.annual_rent_cents,
    first_payment_due: input.first_payment_due, deposit_cents: input.deposit_cents,
    security_deposit_due: input.security_deposit_due, other_conditions: input.other_conditions,
    vehicles: input.vehicles, extra_fields: input.extra_fields,
  };
}

function db(): State {
  if (state) return state;
  const seed = seedData(today());
  state = { buildings: seed.buildings, units: seed.units, tenants: seed.tenants, leases: [], versions: new Map() };
  for (const l of seed.leases) {
    const unit = state.units.find((u) => u.id === l.input.unit_id)!;
    const id = newId();
    state.leases.push({ id, reference: l.reference, ...fieldsOf(l.input, unit.building_id), documents: [{ version: 1, created_at: seed.created_at }], created_at: seed.created_at });
    state.versions.set(id, [{ version: 1, created_at: seed.created_at, input: l.input, signed_on: seed.created_at.slice(0, 10) }]);
  }
  return state;
}

/** Map lease data to the template variables (same as server/app/leases.py template_values). */
function values(input: LeaseInput, signedOn: string): Record<string, string> | Result<never> {
  const s = db();
  const unit = s.units.find((u) => u.id === input.unit_id);
  const building = unit && s.buildings.find((b) => b.id === unit.building_id);
  if (!unit || !building) return fail("Select a unit.", 400, "unit_id");
  const tenants = input.tenant_ids.map((id) => s.tenants.find((t) => t.id === id));
  if (tenants.some((t) => !t)) return fail("One of the selected tenants no longer exists.", 400, "tenant_ids");
  const v: Record<string, string> = {
    PROPERTY_TYPE: input.property_type,
    PROPERTY_ADDRESS: `${building.address}, ${building.city}, ${building.state} ${building.zip}`,
    UNIT: `Unit ${unit.unit_number}`,
    TENANTS: (tenants as Tenant[]).sort(byName).map((t) => `${t.first_name} ${t.last_name}`).join(", "),
    LEASE_START: formatLongDate(input.start_date),
    LEASE_END: formatLongDate(input.end_date),
    ANNUAL_RENT: formatAmount(input.annual_rent_cents),
    MONTHLY_RENT: formatAmount(input.monthly_rent_cents),
    FIRST_PAYMENT_DUE: formatLongDate(input.first_payment_due),
    MAX_OCCUPANTS: String(input.max_occupants),
    SECURITY_DEPOSIT: formatAmount(input.deposit_cents),
    SECURITY_DEPOSIT_DUE: formatLongDate(input.security_deposit_due),
    OTHER_CONDITIONS: input.other_conditions || "None.",
    LANDLORD_SIGNATURE_DATE: formatLongDate(signedOn),
  };
  for (let i = 0; i < 3; i++) {
    const car = input.vehicles[i] ?? { make: "", model: "", plate: "" };
    v[`CAR_${i + 1}_MAKE`] = car.make;
    v[`CAR_${i + 1}_MODEL`] = car.model;
    v[`CAR_${i + 1}_PLATE`] = car.plate;
  }
  for (const [k, val] of Object.entries(input.extra_fields)) v[k] ??= val;
  return v;
}

function checkLease(payload: LeasePayload, leaseId?: string): Result<LeaseInput> {
  const s = db();
  const { data, errors } = validateLease(payload);
  if (Object.keys(errors).length) return invalid(errors);
  if (!s.units.some((u) => u.id === data.unit_id)) return invalid({ unit_id: "Select a unit." });
  if (data.tenant_ids.some((id) => !s.tenants.some((t) => t.id === id))) return invalid({ tenant_ids: "One of the selected tenants no longer exists." });
  if (leaseId) {
    const existing = s.leases.find((l) => l.id === leaseId);
    if (!existing) return notFound("Lease");
    if (existing.unit_id !== data.unit_id) return fail("A lease's unit can't be changed. Create a new lease instead.", 409, "unit_id");
  }
  const clash = s.leases.find((o) => o.id !== leaseId && o.unit_id === data.unit_id && rangesOverlap(data.start_date, data.end_date, o.start_date, o.end_date));
  if (clash) return fail(`These dates overlap lease ${clash.reference} (${clash.start_date} to ${clash.end_date}) on this unit.`, 409, "start_date");
  return ok(data);
}

export const demoSource: DataSource = {
  async load() {
    const s = db();
    const raw: RawPortfolio = { today: today(), buildings: s.buildings, units: s.units, tenants: s.tenants, leases: s.leases };
    return ok(structuredClone(raw));
  },

  async saveBuilding(id, input: Values) {
    const s = db();
    const { data, errors } = validateBuilding(input);
    if (Object.keys(errors).length) return invalid(errors);
    if (id) {
      const b = s.buildings.find((x) => x.id === id);
      if (!b) return notFound("Building");
      Object.assign(b, data);
      return ok({ id });
    }
    const b: Building = { id: newId(), ...data, created_at: now() };
    s.buildings.push(b);
    return ok({ id: b.id });
  },

  async deleteBuilding(id) {
    const s = db();
    if (!s.buildings.some((b) => b.id === id)) return notFound("Building");
    const units = s.units.filter((u) => u.building_id === id).length;
    if (units) return fail(`This building still has ${units} unit${units === 1 ? "" : "s"}. Remove its units (and their leases) first.`);
    s.buildings = s.buildings.filter((b) => b.id !== id);
    return ok(null);
  },

  async saveUnit(id, input) {
    const s = db();
    const { data, errors } = validateUnit(input);
    if (Object.keys(errors).length) return invalid(errors);
    if (!s.buildings.some((b) => b.id === data.building_id)) return invalid({ building_id: "Select a building." });
    const existing = id ? s.units.find((u) => u.id === id) : undefined;
    if (id && !existing) return notFound("Unit");
    if (existing && existing.building_id !== data.building_id && s.leases.some((l) => l.unit_id === id)) {
      return invalid({ building_id: "This unit has leases, so it can't be moved to another building." });
    }
    if (s.units.some((u) => u.id !== id && u.building_id === data.building_id && u.unit_number.toLowerCase() === data.unit_number.toLowerCase())) {
      return invalid({ unit_number: "That building already has a unit with this number." });
    }
    if (existing) {
      Object.assign(existing, data);
      return ok({ id: existing.id });
    }
    const u: Unit = { id: newId(), ...data, created_at: now() };
    s.units.push(u);
    return ok({ id: u.id });
  },

  async deleteUnit(id) {
    const s = db();
    const unit = s.units.find((u) => u.id === id);
    if (!unit) return notFound("Unit");
    const leases = s.leases.filter((l) => l.unit_id === id).length;
    if (leases) return fail(`This unit has ${leases} lease${leases === 1 ? "" : "s"} on record, so it can't be deleted.`);
    s.units = s.units.filter((u) => u.id !== id);
    for (const t of s.tenants) if (t.unit_id === id) t.unit_id = null;
    return ok({ building_id: unit.building_id });
  },

  async saveTenant(id, input) {
    const s = db();
    const { data, errors } = validateTenant(input);
    if (Object.keys(errors).length) return invalid(errors);
    if (data.unit_id && !s.units.some((u) => u.id === data.unit_id)) return invalid({ unit_id: "Select a valid unit." });
    if (id) {
      const t = s.tenants.find((x) => x.id === id);
      if (!t) return notFound("Tenant");
      Object.assign(t, data);
      return ok({ id, first_name: t.first_name, last_name: t.last_name, email: t.email });
    }
    const t: Tenant = { id: newId(), ...data, created_at: now() };
    s.tenants.push(t);
    return ok({ id: t.id, first_name: t.first_name, last_name: t.last_name, email: t.email });
  },

  async deleteTenant(id) {
    const s = db();
    if (!s.tenants.some((t) => t.id === id)) return notFound("Tenant");
    if (s.leases.some((l) => l.tenant_ids.includes(id))) return fail("This tenant is on a lease, so they can't be deleted. Remove them from the lease first.");
    s.tenants = s.tenants.filter((t) => t.id !== id);
    return ok(null);
  },

  async templateInfo() {
    return ok(templateInfo());
  },

  async previewLease(payload, leaseId) {
    const checked = checkLease(payload, leaseId);
    if (!checked.ok) return checked;
    const v = values(checked.data, today());
    if ("ok" in v) return v as Result<never>;
    return ok({ blocks: buildBlocks(v) as Block[] });
  },

  async saveLease(payload, leaseId) {
    const s = db();
    const checked = checkLease(payload, leaseId);
    if (!checked.ok) return checked;
    const input = checked.data;
    const unit = s.units.find((u) => u.id === input.unit_id)!;
    const ts = now();
    if (leaseId) {
      const lease = s.leases.find((l) => l.id === leaseId)!;
      const versions = s.versions.get(leaseId) ?? [];
      const version = Math.max(0, ...versions.map((v) => v.version)) + 1;
      versions.push({ version, created_at: ts, input, signed_on: today() });
      s.versions.set(leaseId, versions);
      Object.assign(lease, fieldsOf(input, unit.building_id), { documents: [...lease.documents, { version, created_at: ts }] });
      return ok({ id: leaseId, version });
    }
    const id = newId();
    s.leases.push({ id, reference: newReference(), ...fieldsOf(input, unit.building_id), documents: [{ version: 1, created_at: ts }], created_at: ts });
    s.versions.set(id, [{ version: 1, created_at: ts, input, signed_on: today() }]);
    return ok({ id, version: 1 });
  },

  async downloadPdf(leaseId, version) {
    const s = db();
    const lease = s.leases.find((l) => l.id === leaseId);
    const versions = s.versions.get(leaseId) ?? [];
    const v = version ? versions.find((x) => x.version === version) : versions[versions.length - 1];
    if (!lease || !v) return notFound("Document");
    const vals = values(v.input, v.signed_on);
    if ("ok" in vals) return vals as Result<never>;
    const { renderLeasePdf } = await import("./pdf");
    await renderLeasePdf(buildBlocks(vals), {
      title: `Lease ${lease.reference} v${v.version}`,
      footer: `Lease ${lease.reference} · version ${v.version}`,
      filename: `Lease-${lease.reference}-v${v.version}.pdf`,
    });
    return ok(null);
  },
};
