import Link from "next/link";
import { notFound } from "next/navigation";
import { getCtx, getPortfolio } from "@/lib/context";
import { Icon } from "@/components/icons";
import { Card, DetailList, PageHeader } from "@/components/ui";

export const metadata = { title: "Lease" };

export default async function LeasePage({ params }: PageProps<"/leases/[id]">) {
  const ctx = await getCtx();
  const p = await getPortfolio();
  const l = p.leaseById.get((await params).id);
  if (!l) notFound();


  return (
    <>
      <PageHeader
        back={{ href: "/leases", label: "Leases" }}
        title={<span>Lease <span className="font-mono">{l.reference}</span></span>}
        description={`${l.address} · Unit ${l.unit.unit_number}`}
      />


      <div className="max-w-4xl">
          <Card title="Lease details">
            <DetailList
              items={[
                ["Tenant(s)", l.tenants.length ? l.tenants.map((t, i) => (
                  <span key={t.id}>{i > 0 && ", "}<Link className="link" href={`/tenants/${t.id}`}>{t.first_name} {t.last_name}</Link></span>
                )) : "—"],
                ["Property", <Link key="u" className="link" href={`/units/${l.unit.id}`}>{l.building.displayName} — Unit {l.unit.unit_number}</Link>],
                ["Start date", ctx.formatDate(l.start_date)],
                ["End date", ctx.formatDate(l.end_date)],
                ["Property type", l.property_type],
                ["Maximum occupants", l.max_occupants ? String(l.max_occupants) : ""],
                ["Monthly rent", ctx.formatMoney(l.monthly_rent_cents)],
                ["Total rent", l.annual_rent_cents ? ctx.formatMoney(l.annual_rent_cents) : ""],
                ["First payment due", l.first_payment_due ? ctx.formatDate(l.first_payment_due) : ""],
                ["Security deposit", `${ctx.formatMoney(l.deposit_cents)}${l.security_deposit_due ? ` · due ${ctx.formatDate(l.security_deposit_due)}` : ""}`],
              ]}
            />
            {(l.vehicles ?? []).length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">Vehicles</p>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {l.vehicles.map((car, i) => (
                    <li key={i}>{[car.make, car.model].filter(Boolean).join(" ") || "—"}{car.plate && <span className="text-muted"> · {car.plate}</span>}</li>
                  ))}
                </ul>
              </div>
            )}
            {l.other_conditions && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">Other conditions</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{l.other_conditions}</p>
              </div>
            )}
          </Card>
          {l.documents.length > 0 && (
            <div className="mt-4">
              <a href={`/api/leases/${l.id}/pdf`} className="btn-primary">
                <Icon name="download" /> Download PDF
              </a>
            </div>
          )}
      </div>
    </>
  );
}
