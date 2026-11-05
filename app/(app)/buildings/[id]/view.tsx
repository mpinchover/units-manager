"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { Missing } from "@/components/ui";
import { useMutations } from "@/components/use-mutations";
import { ConfirmButton } from "@/components/confirm-button";
import { Icon } from "@/components/icons";
import { Card, DetailList, EmptyState, PageHeader } from "@/components/ui";
import { tenantName } from "@/lib/data/portfolio";


export default function BuildingPageView() {
  const params = useParams<{ id: string }>();
  const { ctx, p } = useApp();
  const m = useMutations();
  const b = p.buildingById.get(params.id);
  if (!b) return <Missing what="Building" href="/buildings" label="Back to buildings" />;

  return (
    <>
      <PageHeader
        back={{ href: "/buildings", label: "Buildings" }}
        title={b.displayName}
        description={b.fullAddress}
        actions={
          <>
            <Link href={`/buildings/${b.id}/edit`} className="btn-secondary">Edit</Link>
            <ConfirmButton action={m.deleteBuilding(b.id)} confirmText="Confirm delete">Delete</ConfirmButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Details" className="lg:col-span-1">
          <DetailList
            items={[
              ["Name", b.name],
              ["Street", b.address],
              ["City", b.city],
              ["State / ZIP", `${b.state} ${b.zip}`],
              ["Units", b.totalUnits],
            ]}
          />
        </Card>

        <Card
          title={`Units (${b.totalUnits})`}
          className="lg:col-span-2"
          padded={false}
          actions={
            <Link href={`/units/new?building=${b.id}`} className="btn-primary px-3 py-1.5">
              <Icon name="plus" /> Add Unit
            </Link>
          }
        >
          {b.units.length === 0 ? (
            <EmptyState icon="door" title="No units yet" description="Add the rentable units in this building." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead className="border-b border-line bg-canvas/60">
                  <tr>
                    <th className="th">Unit</th>
                    <th className="th">Tenant</th>
                    <th className="th">Lease expiration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {b.units.map((u) => (
                    <tr key={u.id} className="hover:bg-canvas/60">
                      <td className="td">
                        <Link href={`/units/${u.id}`} className="font-medium hover:text-brand-700 hover:underline">{u.unit_number}</Link>
                      </td>
                      <td className="td">{u.currentLease ? u.currentLease.tenants.map(tenantName).join(", ") : <span className="text-muted">—</span>}</td>
                      <td className="td">{u.currentLease ? ctx.formatDate(u.currentLease.end_date) : <span className="text-muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
