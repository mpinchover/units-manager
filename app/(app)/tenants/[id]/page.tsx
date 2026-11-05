import Link from "next/link";
import { notFound } from "next/navigation";
import { getCtx, getPortfolio } from "@/lib/context";
import { Card, DetailList, PageHeader } from "@/components/ui";
import { LeaseList } from "@/components/lease-list";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteTenant } from "../actions";

export const metadata = { title: "Tenant" };

export default async function TenantPage({ params }: PageProps<"/tenants/[id]">) {
  const ctx = await getCtx();
  const p = await getPortfolio();
  const t = p.tenantById.get((await params).id);
  if (!t) notFound();
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
            <ConfirmButton action={deleteTenant.bind(null, t.id)} confirmText="Confirm delete">Delete</ConfirmButton>
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
