import Link from "next/link";
import { getCtx, getPortfolio } from "@/lib/context";
import { applyList, parseList } from "@/lib/list";
import { Icon } from "@/components/icons";
import { EmptyState, PageHeader } from "@/components/ui";
import { Pagination, SortHeader, TableShell } from "@/components/table";

export const metadata = { title: "Leases" };

export default async function LeasesPage({ searchParams }: PageProps<"/leases">) {
  const ctx = await getCtx();
  const p = await getPortfolio();
  const params = parseList(await searchParams, "end");
  const list = applyList(p.leases, params, {
    sorters: {
      tenants: (l) => l.tenantNames,
      property: (l) => l.address,
      unit: (l) => l.unit.unit_number,
      start: (l) => l.start_date,
      end: (l) => l.end_date,
      rent: (l) => l.monthly_rent_cents,
    },
  });
  const base = "/leases";

  return (
    <>
      <PageHeader
        title="Leases"
        description="Generate, download and track lease agreements."
        actions={<Link href="/leases/new" className="btn-primary"><Icon name="file" /> Generate Lease</Link>}
      />
      {p.leases.length === 0 ? (
        <div className="card">
          <EmptyState icon="file" title="No leases yet" description="Generate a lease PDF from a unit and its tenants." action={<Link href="/leases/new" className="btn-primary"><Icon name="file" /> Generate your first lease</Link>} />
        </div>
      ) : (
        <>
          <TableShell footer={<Pagination base={base} params={params} {...list} />}>
            <thead className="border-b border-line bg-canvas/60">
              <tr>
                <SortHeader base={base} params={params} k="tenants">Tenant(s)</SortHeader>
                <SortHeader base={base} params={params} k="property">Property</SortHeader>
                <SortHeader base={base} params={params} k="unit">Unit</SortHeader>
                <SortHeader base={base} params={params} k="start">Start</SortHeader>
                <SortHeader base={base} params={params} k="end">End</SortHeader>
                <SortHeader base={base} params={params} k="rent" className="text-right">Monthly rent</SortHeader>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.rows.map((l) => (
                <tr key={l.id} className="hover:bg-canvas/60">
                  <td className="td">
                    <Link href={`/leases/${l.id}`} className="font-medium hover:text-brand-700 hover:underline">{l.tenantNames || "—"}</Link>
                    <p className="font-mono text-xs text-muted">{l.reference}</p>
                  </td>
                  <td className="td">{l.building.address}</td>
                  <td className="td">{l.unit.unit_number}</td>
                  <td className="td whitespace-nowrap">{ctx.formatDate(l.start_date)}</td>
                  <td className="td whitespace-nowrap">{ctx.formatDate(l.end_date)}</td>
                  <td className="td text-right tabular-nums">{ctx.formatMoney(l.monthly_rent_cents)}</td>
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      <Link href={`/leases/${l.id}`} className="btn-ghost px-2.5 py-1.5">View</Link>
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
