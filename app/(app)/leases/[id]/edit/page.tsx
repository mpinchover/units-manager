import { notFound } from "next/navigation";
import { getPortfolio } from "@/lib/context";
import { wizardOptions } from "@/lib/lease-options";
import { leaseTemplateInfo } from "@/lib/lease-template";
import { PageHeader } from "@/components/ui";
import { LeaseWizard } from "../../lease-wizard";

export const metadata = { title: "Edit lease" };

const amount = (c: number | undefined) => (c ? (c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");

export default async function EditLeasePage({ params }: PageProps<"/leases/[id]/edit">) {
  const [p, template] = await Promise.all([getPortfolio(), leaseTemplateInfo()]);
  const l = p.leaseById.get((await params).id);
  if (!l) notFound();

  return (
    <>
      <PageHeader
        title={`Amend lease ${l.reference}`}
        description="Your changes are saved as a new PDF version when you download. Earlier versions are kept."
        back={{ href: `/leases/${l.id}`, label: l.reference }}
      />
      <LeaseWizard
        leaseId={l.id}
        {...wizardOptions(p)}
        {...template}
        initial={{
          building_id: l.building.id,
          unit_id: l.unit_id,
          property_type: l.property_type ?? "",
          tenant_ids: l.tenants.map((t) => t.id),
          max_occupants: l.max_occupants ? String(l.max_occupants) : "",
          start_date: l.start_date,
          end_date: l.end_date,
          monthly_rent: amount(l.monthly_rent_cents),
          annual_rent: amount(l.annual_rent_cents),
          first_payment_due: l.first_payment_due ?? "",
          security_deposit: amount(l.deposit_cents),
          security_deposit_due: l.security_deposit_due ?? "",
          other_conditions: l.other_conditions ?? "",
          vehicles: l.vehicles ?? [],
          extra_fields: l.extra_fields ?? {},
        }}
      />
    </>
  );
}
