import Link from "next/link";
import { getPortfolio } from "@/lib/context";
import { applyList, parseList } from "@/lib/list";
import { Icon } from "@/components/icons";
import { BuildingIcon, EmptyState, PageHeader } from "@/components/ui";
import { Pagination, RowLink, SortHeader, TableShell } from "@/components/table";

export const metadata = { title: "Buildings" };

export default async function BuildingsPage({ searchParams }: PageProps<"/buildings">) {
  const p = await getPortfolio();
  const params = parseList(await searchParams, "name");
  const list = applyList(p.buildings, params, {
    sorters: {
      name: (b) => b.displayName,
      address: (b) => b.fullAddress,
      total: (b) => b.totalUnits,
    },
  });

  return (
    <>
      <PageHeader
        title="Buildings"
        description="All properties in your portfolio."
        actions={
          <Link href="/buildings/new" className="btn-primary">
            <Icon name="plus" /> Add Building
          </Link>
        }
      />
      {p.buildings.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="building"
            title="No buildings yet"
            description="Add your first building, then add its units."
            action={<Link href="/buildings/new" className="btn-primary"><Icon name="plus" /> Add your first building</Link>}
          />
        </div>
      ) : (
        <>
          <TableShell footer={<Pagination base="/buildings" params={params} {...list} />}>
            <thead className="border-b border-line bg-canvas/60">
              <tr>
                <SortHeader base="/buildings" params={params} k="name">Building</SortHeader>
                <SortHeader base="/buildings" params={params} k="address">Address</SortHeader>
                <SortHeader base="/buildings" params={params} k="total" className="text-right">Total units</SortHeader>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.rows.map((b) => (
                <tr key={b.id} className="hover:bg-canvas/60">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <BuildingIcon className="size-9" />
                      <RowLink href={`/buildings/${b.id}`}>{b.name || <span className="text-muted">—</span>}</RowLink>
                    </div>
                  </td>
                  <td className="td">{b.fullAddress}</td>
                  <td className="td text-right tabular-nums">{b.totalUnits}</td>
                  <td className="td">
                    <div className="flex items-start justify-end gap-1">
                      <Link href={`/buildings/${b.id}`} className="btn-ghost px-2.5 py-1.5">View</Link>
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
