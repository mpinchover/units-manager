"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { Missing } from "@/components/ui";
import { useMutations } from "@/components/use-mutations";
import { Card, DetailList, PageHeader } from "@/components/ui";
import { LeaseList } from "@/components/lease-list";
import { ConfirmButton } from "@/components/confirm-button";


export default function TenantPageView() {
  const params = useParams<{ id: string }>();
  const { ctx, p } = useApp();
  const m = useMutations();
  const t = p.tenantById.get(params.id);
  if (!t) return <Missing what="Tenant" href="/tenants" label="Back to tenants" />;
  const currentLeases = t.leases.filter((l) => l.end_date >= p.today);
  const unitsOnLeases = [...new Map(currentLeases.map((l) => [l.unit.id, l])).values()];

  return (
    <>
      <PageHeader
        back={{ href: "/tenants", label: "Tenants" }}
        title={t.fullName}
        description={t.email}
        actions={
          <>
            <Link href={`/tenants/${t.id}/edit`} className="btn-secondary">Edit</Link>
            <ConfirmButton action={m.deleteTenant(t.id)} confirmText="Confirm delete">Delete</ConfirmButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card title="Contact">
            <DetailList
              items={[
                ["Email", <a key="e" className="link" href={`mailto:${t.email}`}>{t.email}</a>],
                ["Phone", t.phone],
              ]}
            />
          </Card>

          <Card title="Units">
            {unitsOnLeases.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {unitsOnLeases.map((l) => (
                  <li key={l.unit.id}>
                    <Link className="link" href={`/units/${l.unit.id}`}>{l.building.displayName} — Unit {l.unit.unit_number}</Link>
                  </li>
                ))}
              </ul>
            ) : t.unit ? (
              <div className="text-sm">
                <Link className="link" href={`/units/${t.unit.id}`}>{t.building?.displayName} — Unit {t.unit.unit_number}</Link>
                <p className="text-muted">Assigned (no active lease yet)</p>
              </div>
            ) : (
              <p className="text-sm text-muted">Not assigned to a unit.</p>
            )}
          </Card>
        </div>

        <Card title="Leases" className="lg:col-span-2" padded={false}>
          <LeaseList leases={t.leases} ctx={ctx} show="unit" />
        </Card>
      </div>
    </>
  );
}
