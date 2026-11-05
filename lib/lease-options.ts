import type { Portfolio } from "./data/portfolio";

export function wizardOptions(p: Portfolio) {
  const buildings = p.buildings.map((b) => ({ value: String(b.id), label: b.displayName, detail: b.fullAddress }));
  const units = [...p.units]
    .sort((a, b) => a.building.displayName.localeCompare(b.building.displayName) || a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true }))
    .map((u) => ({
      value: String(u.id),
      label: `${u.building.displayName} — Unit ${u.unit_number}`,
      detail: u.building.fullAddress,
      buildingId: String(u.building_id),
      address: u.building.fullAddress,
      unitNumber: u.unit_number,
      buildingUnitCount: u.building.totalUnits,
    }));
  const tenants = p.tenants
    .map((t) => ({
      value: String(t.id),
      label: t.fullName,
      detail: [t.email, t.unit ? `${t.building?.displayName} — Unit ${t.unit.unit_number}` : null].filter(Boolean).join(" · "),
    }));
  return { buildings, units, tenants };
}
