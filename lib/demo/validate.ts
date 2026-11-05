/** Browser port of the server's input validation (server/app/validation.py and the route validators). */
import { centsFromInput, isIsoDate } from "../domain";
import type { LeasePayload, Values } from "../data-source/types";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^[0-9+().\-\s x]{7,40}$/i;

export class Validator {
  errors: Record<string, string> = {};
  constructor(private data: Values) {}
  private raw(field: string) {
    return (this.data[field] ?? "").toString().trim();
  }
  fail(field: string, message: string) {
    this.errors[field] ??= message;
  }
  text(field: string, label: string, { required = false, max = 2000 } = {}) {
    const v = this.raw(field);
    if (required && !v) this.fail(field, `${label} is required.`);
    else if (v.length > max) this.fail(field, `${label} is too long.`);
    return v;
  }
  email(field: string, label = "Email") {
    const v = this.raw(field).toLowerCase();
    if (!v) this.fail(field, `${label} is required.`);
    else if (!EMAIL.test(v) || v.length > 254) this.fail(field, "Enter a valid email address.");
    return v;
  }
  phone(field: string) {
    const v = this.raw(field);
    if (v && !PHONE.test(v)) this.fail(field, "Enter a valid phone number.");
    return v;
  }
  ok() {
    return Object.keys(this.errors).length === 0;
  }
}

export function validateBuilding(values: Values) {
  const v = new Validator(values);
  const data = {
    name: v.text("name", "Building name", { max: 120 }),
    address: v.text("address", "Street address", { required: true, max: 200 }),
    city: v.text("city", "City", { required: true, max: 100 }),
    state: v.text("state", "State", { required: true, max: 50 }).toUpperCase(),
    zip: v.text("zip", "ZIP code", { required: true, max: 20 }),
  };
  if (data.zip && !/^[A-Za-z0-9 -]{3,10}$/.test(data.zip)) v.fail("zip", "Enter a valid ZIP code.");
  return { data, errors: v.errors };
}

export function validateUnit(values: Values) {
  const v = new Validator(values);
  const data = { building_id: v.text("building_id", "Building"), unit_number: v.text("unit_number", "Unit number", { required: true, max: 40 }) };
  if (!data.building_id) v.fail("building_id", "Select a building.");
  return { data, errors: v.errors };
}

export function validateTenant(values: Values) {
  const v = new Validator(values);
  const data = {
    first_name: v.text("first_name", "First name", { required: true, max: 80 }),
    last_name: v.text("last_name", "Last name", { required: true, max: 80 }),
    email: v.email("email"),
    phone: v.phone("phone"),
    unit_id: (values.unit_id ?? "").trim() || null,
  };
  return { data, errors: v.errors };
}

export type LeaseInput = {
  unit_id: string;
  tenant_ids: string[];
  property_type: string;
  max_occupants: number;
  start_date: string;
  end_date: string;
  monthly_rent_cents: number;
  annual_rent_cents: number;
  first_payment_due: string;
  deposit_cents: number;
  security_deposit_due: string;
  other_conditions: string;
  vehicles: { make: string; model: string; plate: string }[];
  extra_fields: Record<string, string>;
};

/** Same rules as server/app/leases.py parse_input. */
export function validateLease(p: LeasePayload): { data: LeaseInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const fail = (k: string, m: string) => (errors[k] ??= m);
  const s = (v: string | undefined) => (v ?? "").trim();
  const date = (k: keyof LeasePayload, label: string) => {
    const v = s(p[k] as string);
    if (!v) fail(k, `${label} is required.`);
    else if (!isIsoDate(v)) fail(k, `${label} must be a valid date.`);
    return v;
  };
  const money = (k: keyof LeasePayload, label: string) => {
    const v = s(p[k] as string);
    if (!v) {
      fail(k, `${label} is required.`);
      return 0;
    }
    const c = centsFromInput(v);
    if (c == null) {
      fail(k, `${label} must be an amount like 1850 or 1850.00.`);
      return 0;
    }
    return c;
  };

  if (!s(p.unit_id)) fail("unit_id", "Select a unit.");
  const tenant_ids = [...new Set((p.tenant_ids ?? []).map((t) => t.trim()).filter(Boolean))];
  if (!tenant_ids.length) fail("tenant_ids", "Select at least one tenant.");
  const property_type = s(p.property_type);
  if (!property_type) fail("property_type", "Property type is required.");
  else if (!["Single Family", "Multi-Family"].includes(property_type)) fail("property_type", "Choose Single Family or Multi-Family.");
  const occ = Number(s(p.max_occupants));
  if (!s(p.max_occupants)) fail("max_occupants", "Maximum occupants is required.");
  else if (!Number.isInteger(occ) || occ < 1 || occ > 20) fail("max_occupants", "Maximum occupants must be between 1 and 20.");
  const start_date = date("start_date", "Lease start date");
  const end_date = date("end_date", "Lease end date");
  const monthly = money("monthly_rent", "Monthly rent");
  const annual = money("annual_rent", "Total rent");
  const first_payment_due = date("first_payment_due", "First payment due date");
  const deposit = money("security_deposit", "Security deposit");
  const security_deposit_due = date("security_deposit_due", "Security deposit due date");
  const other_conditions = s(p.other_conditions);
  if (other_conditions.length > 8000) fail("other_conditions", "Other conditions is too long.");
  const vehicles = (p.vehicles ?? [])
    .slice(0, 3)
    .map((c) => ({ make: s(c.make), model: s(c.model), plate: s(c.plate) }))
    .filter((c) => c.make || c.model || c.plate);
  if (start_date && end_date && !errors.start_date && !errors.end_date && end_date <= start_date) fail("end_date", "Lease end date must be after the start date.");
  if (!errors.monthly_rent && monthly <= 0) fail("monthly_rent", "Monthly rent must be greater than zero.");
  if (!errors.annual_rent && annual <= 0) fail("annual_rent", "Total rent must be greater than zero.");

  return {
    data: {
      unit_id: s(p.unit_id), tenant_ids, property_type, max_occupants: occ, start_date, end_date,
      monthly_rent_cents: monthly, annual_rent_cents: annual, first_payment_due, deposit_cents: deposit,
      security_deposit_due, other_conditions, vehicles, extra_fields: p.extra_fields ?? {},
    },
    errors,
  };
}
