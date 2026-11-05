import Link from "next/link";
import type { LeaseView } from "@/lib/data/portfolio";
import type { Ctx } from "@/lib/context";

/** Compact lease history table used on unit and tenant detail pages. */
export function LeaseList({ leases, ctx, show = "tenants" }: { leases: LeaseView[]; ctx: Ctx; show?: "tenants" | "unit" }) {
  if (leases.length === 0) return <p className="px-5 py-8 text-center text-sm text-muted">No leases yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px]">
        <thead className="border-b border-line bg-canvas/60">
          <tr>
            <th className="th">Lease</th>
            <th className="th">{show === "tenants" ? "Tenant(s)" : "Property / Unit"}</th>
            <th className="th">Term</th>
            <th className="th text-right">Rent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {leases.map((l) => (
            <tr key={l.id} className="hover:bg-canvas/60">
              <td className="td">
                <Link href={`/leases/${l.id}`} className="font-mono text-xs font-medium hover:text-brand-700 hover:underline">{l.reference}</Link>
              </td>
              <td className="td">{show === "tenants" ? l.tenantNames || "—" : `${l.building.address} · Unit ${l.unit.unit_number}`}</td>
              <td className="td whitespace-nowrap">{ctx.formatDate(l.start_date)} – {ctx.formatDate(l.end_date)}</td>
              <td className="td text-right tabular-nums">{ctx.formatMoney(l.monthly_rent_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
