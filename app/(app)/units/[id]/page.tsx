import Link from "next/link";
import { notFound } from "next/navigation";
import { getCtx, getPortfolio } from "@/lib/context";
import { Icon } from "@/components/icons";
import { Card, DetailList, PageHeader } from "@/components/ui";
import { LeaseList } from "@/components/lease-list";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteUnit } from "../actions";

export const metadata = { title: "Unit" };

export default async function UnitPage({ params }: PageProps<"/units/[id]">) {
  const ctx = await getCtx();
  const p = await getPortfolio();
  const u = p.unitById.get((await params).id);
  if (!u) notFound();
  const lease = u.currentLease;

  return (
    <>
      <PageHeader
        back={{ href: `/buildings/${u.building_id}`, label: u.building.displayName }}
        title={`Unit ${u.unit_number}`}
        description={u.building.fullAddress}
        actions={
          <>
            <Link href={`/units/${u.id}/edit`} className="btn-secondary">Edit</Link>
            <ConfirmButton action={deleteUnit.bind(null, u.id)} confirmText="Confirm delete">Delete</ConfirmButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card title="Unit details">
            <DetailList
              items={[
                ["Building", <Link key="b" href={`/buildings/${u.building_id}`} className="link">{u.building.displayName}</Link>],
                ["Unit", u.unit_number],
              ]}
            />
          </Card>

          <Card title="Tenants">
            {u.occupants.length === 0 ? (
              <p className="text-sm text-muted">No tenants.</p>
            ) : (
              <ul className="space-y-3">
                {u.occupants.map((t) => (
                  <li key={t.id} className="text-sm">
                    <Link href={`/tenants/${t.id}`} className="link">{t.first_name} {t.last_name}</Link>
                    <p className="text-muted">{t.email}{t.phone ? ` · ${t.phone}` : ""}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Current lease">
            {lease ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <Link href={`/leases/${lease.id}`} className="font-mono text-sm font-medium hover:underline">{lease.reference}</Link>
                </div>
                <DetailList
                  items={[
                    ["Tenant(s)", lease.tenantNames],
                    ["Monthly rent", ctx.formatMoney(lease.monthly_rent_cents)],
                    ["Start", ctx.formatDate(lease.start_date)],
                    ["End", ctx.formatDate(lease.end_date)],
                  ]}
                />
                <div className="mt-5 flex gap-2">
                  <Link href={`/leases/${lease.id}`} className="btn-secondary">View lease</Link>
                  <a href={`/api/leases/${lease.id}/pdf`} className="btn-secondary"><Icon name="download" /> Download PDF</a>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted">
                No current lease.{" "}
                <Link href={`/leases/new?unit=${u.id}`} className="link">Generate a lease</Link>
              </div>
            )}
          </Card>
          <Card title="Lease history" padded={false}>
            <LeaseList leases={u.leases} ctx={ctx} />
          </Card>
        </div>
      </div>
    </>
  );
}
