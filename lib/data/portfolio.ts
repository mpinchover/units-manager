import { fullAddress, leaseCovers } from "../domain";

/* Raw Firestore documents as returned by the API (snake_case, string ids). */

export type Building = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  created_at: string;
};

export type Unit = {
  id: string;
  building_id: string;
  unit_number: string;
  created_at: string;
};

export type Tenant = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  unit_id: string | null;
  created_at: string;
};

export type LeaseDocument = { version: number; created_at: string };

export type Lease = {
  id: string;
  reference: string;
  unit_id: string;
  building_id: string;
  tenant_ids: string[];
  start_date: string;
  end_date: string;
  property_type: string;
  max_occupants: number;
  monthly_rent_cents: number;
  annual_rent_cents: number;
  first_payment_due: string;
  deposit_cents: number;
  security_deposit_due: string;
  other_conditions: string;
  vehicles: { make: string; model: string; plate: string }[];
  extra_fields: Record<string, string>;
  documents: LeaseDocument[];
  created_at: string;
};

export type RawPortfolio = {
  today: string;
  buildings: Building[];
  units: Unit[];
  tenants: Tenant[];
  leases: Lease[];
};

/* Derived views */

export type LeaseView = Lease & {
  unit: Unit;
  building: BuildingView;
  tenants: Tenant[];
  tenantNames: string;
  address: string;
};

export type UnitView = Unit & {
  building: BuildingView;
  /** The lease covering today, or else the next one to start. */
  currentLease: LeaseView | null;
  leases: LeaseView[];
  /** Tenants on the current lease, or tenants pre-assigned to this unit when it has none. */
  occupants: Tenant[];
};

export type TenantView = Tenant & {
  fullName: string;
  leases: LeaseView[];
  currentLease: LeaseView | null;
  unit: Unit | null;
  building: BuildingView | null;
};

export type BuildingView = Building & {
  units: UnitView[];
  totalUnits: number;
  displayName: string;
  fullAddress: string;
};

export type Portfolio = {
  today: string;
  buildings: BuildingView[];
  units: UnitView[];
  tenants: TenantView[];
  leases: LeaseView[];
  buildingById: Map<string, BuildingView>;
  unitById: Map<string, UnitView>;
  tenantById: Map<string, TenantView>;
  leaseById: Map<string, LeaseView>;
};

export function tenantName(t: { first_name: string; last_name: string }): string {
  return `${t.first_name} ${t.last_name}`.trim();
}

const byName = (a: Tenant, b: Tenant) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name);

/**
 * Derives cross-links (units → leases → tenants) from the raw documents.
 */
export function loadPortfolio(raw: RawPortfolio): Portfolio {
  const today = raw.today;
  const buildings: BuildingView[] = raw.buildings
    .map((b) => ({ ...b, units: [], totalUnits: 0, displayName: b.name || b.address, fullAddress: fullAddress(b) }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const buildingById = new Map(buildings.map((b) => [b.id, b]));
  const units = raw.units.filter((u) => buildingById.has(u.building_id));
  const unitRaw = new Map(units.map((u) => [u.id, u]));
  const tenantRaw = new Map(raw.tenants.map((t) => [t.id, t]));

  const leases: LeaseView[] = raw.leases
    .filter((l) => unitRaw.has(l.unit_id))
    .map((l) => {
      const unit = unitRaw.get(l.unit_id)!;
      const building = buildingById.get(unit.building_id)!;
      const tenants = l.tenant_ids.map((id) => tenantRaw.get(id)).filter((t): t is Tenant => !!t).sort(byName);
      return {
        ...l,
        documents: [...l.documents].sort((a, b) => a.version - b.version),
        unit,
        building,
        tenants,
        tenantNames: tenants.map(tenantName).join(", "),
        address: building.fullAddress,
      };
    })
    .sort((a, b) => b.start_date.localeCompare(a.start_date));
  const leaseById = new Map(leases.map((l) => [l.id, l]));

  const unitViews: UnitView[] = units.map((u) => {
    const unitLeases = leases.filter((l) => l.unit_id === u.id);
    const covering = unitLeases.find((l) => leaseCovers(l, today));
    const next = unitLeases.filter((l) => l.start_date > today).sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
    const currentLease = covering ?? next ?? null;
    return {
      ...u,
      building: buildingById.get(u.building_id)!,
      currentLease,
      leases: unitLeases,
      occupants: currentLease ? currentLease.tenants : raw.tenants.filter((t) => t.unit_id === u.id).sort(byName),
    };
  });
  const unitById = new Map(unitViews.map((u) => [u.id, u]));

  for (const b of buildings) {
    b.units = unitViews
      .filter((u) => u.building_id === b.id)
      .sort((x, y) => x.unit_number.localeCompare(y.unit_number, undefined, { numeric: true }));
    b.totalUnits = b.units.length;
  }

  const tenants: TenantView[] = [...raw.tenants].sort(byName).map((t) => {
    const tLeases = leases
      .filter((l) => l.tenant_ids.includes(t.id))
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
    const currentLease = tLeases.find((l) => leaseCovers(l, today)) ?? [...tLeases].reverse().find((l) => l.start_date > today) ?? null;
    const unit = currentLease ? unitById.get(currentLease.unit_id)! : t.unit_id ? (unitById.get(t.unit_id) ?? null) : null;
    return {
      ...t,
      fullName: tenantName(t),
      leases: tLeases,
      currentLease,
      unit,
      building: unit ? buildingById.get(unit.building_id)! : null,
    };
  });
  const tenantById = new Map(tenants.map((t) => [t.id, t]));


  return { today, buildings, units: unitViews, tenants, leases, buildingById, unitById, tenantById, leaseById };
}
