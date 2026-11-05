/** Fake data the demo starts with (same sample set as server/app/seed.py, plus a few leases). */
import { addDays } from "../domain";
import type { Building, Tenant, Unit } from "../data/portfolio";
import type { LeaseInput } from "./validate";

const BUILDINGS = [
  { key: "quaker", name: "Quaker Lane Duplex", address: "53 Quaker Lane", city: "West Hartford", state: "CT", zip: "06119", units: ["1", "2"] },
  { key: "maple", name: "Maple Court", address: "123 Maple Ave", city: "Hartford", state: "CT", zip: "06105", units: ["1A", "1B", "2A", "2B"] },
  { key: "elm", name: "Elm Street House", address: "18 Elm Street", city: "Glastonbury", state: "CT", zip: "06033", units: ["Main"] },
];

// first, last, phone, assigned "building/unit"
const TENANTS: [string, string, string, string | null][] = [
  ["Ann", "Lee", "(860) 555-0101", "quaker/1"],
  ["Bob", "Ray", "(860) 555-0102", "quaker/1"],
  ["Carla", "Mendes", "(860) 555-0103", "maple/1A"],
  ["David", "Kim", "(860) 555-0104", "maple/2B"],
  ["Emily", "Novak", "(860) 555-0105", "maple/2B"],
  ["Frank", "Osei", "(860) 555-0106", "elm/Main"],
  ["Grace", "Patel", "(860) 555-0107", null],
  ["Henry", "Walsh", "(860) 555-0108", null],
  ["Isabel", "Ortiz", "(860) 555-0109", null],
  ["James", "Turner", "(860) 555-0110", null],
];

const unitId = (b: string, u: string) => `demo-unit-${b}-${u.toLowerCase()}`;
const tenantId = (i: number) => `demo-tenant-${String(i + 1).padStart(2, "0")}`;

/** One year starting `startOffset` days from today, $amount/month, deposit = one month. */
function lease(today: string, unit: string, tenants: number[], startOffset: number, monthly: number, type: string, cars: LeaseInput["vehicles"] = []): LeaseInput {
  const start = addDays(today, startOffset);
  const [y, m, d] = start.split("-").map(Number);
  const end = new Date(Date.UTC(y + 1, m - 1, d)).toISOString().slice(0, 10);
  return {
    unit_id: unit, tenant_ids: tenants.map(tenantId), property_type: type, max_occupants: Math.max(tenants.length, 2),
    start_date: start, end_date: end, monthly_rent_cents: monthly * 100, annual_rent_cents: monthly * 1200,
    first_payment_due: start, deposit_cents: monthly * 100, security_deposit_due: start,
    other_conditions: "", vehicles: cars, extra_fields: {},
  };
}

export function seedData(today: string) {
  const created_at = `${addDays(today, -200)}T12:00:00.000Z`;
  const buildings: Building[] = BUILDINGS.map((b) => ({ id: `demo-bldg-${b.key}`, name: b.name, address: b.address, city: b.city, state: b.state, zip: b.zip, created_at }));
  const units: Unit[] = BUILDINGS.flatMap((b) => b.units.map((u) => ({ id: unitId(b.key, u), building_id: `demo-bldg-${b.key}`, unit_number: u, created_at })));
  const tenants: Tenant[] = TENANTS.map(([first, last, phone, assigned], i) => ({
    id: tenantId(i), first_name: first, last_name: last, email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`, phone,
    unit_id: assigned ? unitId(...(assigned.split("/") as [string, string])) : null, created_at,
  }));
  const leases = [
    { reference: "PP-DEMO01", input: lease(today, unitId("quaker", "1"), [0, 1], -120, 1850, "Multi-Family", [{ make: "Subaru", model: "Outback", plate: "CT 4KX-219" }]) },
    { reference: "PP-DEMO02", input: lease(today, unitId("maple", "2b"), [3, 4], -300, 1600, "Multi-Family") },
    { reference: "PP-DEMO03", input: lease(today, unitId("elm", "main"), [5], 20, 2400, "Single Family", [{ make: "Toyota", model: "RAV4", plate: "CT 7JD-552" }]) },
  ];
  return { buildings, units, tenants, leases, created_at };
}
