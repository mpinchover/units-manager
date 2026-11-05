import Link from "next/link";
import { getCtx, getPortfolio } from "@/lib/context";
import { applyList, parseList } from "@/lib/list";
import { Icon } from "@/components/icons";
import { EmptyState, PageHeader } from "@/components/ui";
import { Pagination, RowLink, SortHeader, TableShell } from "@/components/table";

export const metadata = { title: "Units" };

export default async function UnitsPage({ searchParams }: PageProps<"/units">) {
  const ctx = await getCtx();
  const p = await getPortfolio();
  const params = parseList(await searchParams, "building");
  const list = applyList(p.units, params, {
    sorters: {
      building: (u) => `${u.building.displayName} ${u.unit_number.padStart(8, "0")}`,
      unit: (u) => u.unit_number,
      tenant: (u) => u.currentLease?.tenantNames || null,
      rent: (u) => u.currentLease?.monthly_rent_cents ?? null,
      expiration: (u) => u.currentLease?.end_date ?? null,
    },
  });
  const base = "/units";

  return (
    <>
      <PageHeader
        title="Units"
        description="Every rental unit across your buildings."
        actions={<Link href="/units/new" className="btn-primary"><Icon name="plus" /> Add Unit</Link>}
      />
      {p.units.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="door"
            title="No units yet"
            description={p.buildings.length ? "Add the rentable units in your buildings." : "Start by adding a building, then add its units."}
            action={
              p.buildings.length ? (
                <Link href="/units/new" className="btn-primary"><Icon name="plus" /> Add your first unit</Link>
              ) : (
                <Link href="/buildings/new" className="btn-primary"><Icon name="plus" /> Add a building</Link>
              )
            }
          />
        </div>
      ) : (
        <>
          <TableShell footer={<Pagination base={base} params={params} {...list} />}>
            <thead className="border-b border-line bg-canvas/60">
              <tr>
                <SortHeader base={base} params={params} k="building">Building</SortHeader>
                <SortHeader base={base} params={params} k="unit">Unit</SortHeader>
                <SortHeader base={base} params={params} k="tenant">Tenant</SortHeader>
                <SortHeader base={base} params={params} k="rent" className="text-right">Monthly rent</SortHeader>
                <SortHeader base={base} params={params} k="expiration">Lease expiration</SortHeader>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.rows.map((u) => (
                <tr key={u.id} className="hover:bg-canvas/60">
                  <td className="td">
                    <Link href={`/buildings/${u.building_id}`} className="hover:text-brand-700 hover:underline">{u.building.displayName}</Link>
                  </td>
                  <td className="td"><RowLink href={`/units/${u.id}`}>{u.unit_number}</RowLink></td>
                  <td className="td">{u.currentLease?.tenantNames || <span className="text-muted">—</span>}</td>
                  <td className="td text-right tabular-nums">{u.currentLease ? ctx.formatMoney(u.currentLease.monthly_rent_cents) : <span className="text-muted">—</span>}</td>
                  <td className="td">{u.currentLease ? ctx.formatDate(u.currentLease.end_date) : <span className="text-muted">—</span>}</td>
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      <Link href={`/units/${u.id}`} className="btn-ghost px-2.5 py-1.5">View</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </>
      )}
    </>
  );
}
