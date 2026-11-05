"use client";

import { useQuery } from "@/components/use-query";
import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { applyList, parseList } from "@/lib/list";
import { Icon } from "@/components/icons";
import { EmptyState, PageHeader } from "@/components/ui";
import { Pagination, RowLink, SortHeader, TableShell } from "@/components/table";


export default function TenantsPageView() {
  const searchParams = useQuery();
  const { ctx, p } = useApp();
  const params = parseList(searchParams, "name");
  const list = applyList(p.tenants, params, {
    sorters: {
      name: (t) => `${t.last_name} ${t.first_name}`,
      email: (t) => t.email,
      building: (t) => t.building?.displayName ?? null,
      unit: (t) => t.unit?.unit_number ?? null,
      leaseEnd: (t) => t.currentLease?.end_date ?? null,
    },
  });
  const base = "/tenants";

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Contact details and lease history for everyone you rent to."
        actions={<Link href="/tenants/new" className="btn-primary"><Icon name="plus" /> Add Tenant</Link>}
      />
      {p.tenants.length === 0 ? (
        <div className="card">
          <EmptyState icon="users" title="No tenants yet" description="Add your first tenant. You can assign them to a unit now or later." action={<Link href="/tenants/new" className="btn-primary"><Icon name="plus" /> Add your first tenant</Link>} />
        </div>
      ) : (
        <>
          <TableShell footer={<Pagination base={base} params={params} {...list} />}>
            <thead className="border-b border-line bg-canvas/60">
              <tr>
                <SortHeader base={base} params={params} k="name">Name</SortHeader>
                <SortHeader base={base} params={params} k="email">Email</SortHeader>
                <th className="th">Phone</th>
                <SortHeader base={base} params={params} k="building">Building</SortHeader>
                <SortHeader base={base} params={params} k="unit">Unit</SortHeader>
                <SortHeader base={base} params={params} k="leaseEnd">Lease end</SortHeader>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.rows.map((t) => (
                <tr key={t.id} className="hover:bg-canvas/60">
                  <td className="td">
                    <RowLink href={`/tenants/${t.id}`}>{t.fullName}</RowLink>
                  </td>
                  <td className="td">{t.email}</td>
                  <td className="td whitespace-nowrap">{t.phone || <span className="text-muted">—</span>}</td>
                  <td className="td">{t.building?.displayName ?? <span className="text-muted">—</span>}</td>
                  <td className="td">{t.unit ? <Link className="hover:underline" href={`/units/${t.unit.id}`}>{t.unit.unit_number}</Link> : <span className="text-muted">—</span>}</td>
                  <td className="td whitespace-nowrap">{t.currentLease ? ctx.formatDate(t.currentLease.end_date) : <span className="text-muted">—</span>}</td>
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      <Link href={`/tenants/${t.id}`} className="btn-ghost px-2.5 py-1.5">View</Link>
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
