import type { Portfolio } from "./data/portfolio";

/** Unit options for searchable dropdowns: "Building — Unit 2B". */
export function unitOptions(p: Portfolio) {
  return [...p.units]
    .sort((a, b) => a.building.displayName.localeCompare(b.building.displayName) || a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true }))
    .map((u) => ({
      value: String(u.id),
      label: `${u.building.displayName} — Unit ${u.unit_number}`,
      detail: u.building.fullAddress,
      buildingId: String(u.building_id),
    }));
}
