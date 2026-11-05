"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@/components/use-query";
import { useApp } from "@/components/app-provider";
import { wizardOptions } from "@/lib/lease-options";
import { useLeaseTemplate } from "@/components/use-lease-template";
import { PageHeader, SkeletonPage } from "@/components/ui";
import { LeaseWizard } from "../lease-wizard";


export default function NewLeasePageView() {
  // Fresh form on each visit via a link; back/forward still restores what was typed.
  const { bfcacheId } = useRouter();
  const searchParams = useQuery();
  const { p } = useApp();
  const template = useLeaseTemplate();
  const sp = searchParams;
  const unit = typeof sp.unit === "string" ? p.unitById.get(sp.unit) : undefined;
  const tenant = typeof sp.tenant === "string" ? p.tenantById.get(sp.tenant) : undefined;
  const tenantIds = tenant ? [tenant.id] : unit && !unit.currentLease ? unit.occupants.map((t) => t.id) : [];

  if (!template) return <SkeletonPage />;
  return (
    <>
      <PageHeader
        title="Generate lease"
        description="Fill in the lease details, preview the document, then download it as a PDF."
        back={unit ? { href: `/units/${unit.id}`, label: `Unit ${unit.unit_number}` } : { href: "/leases", label: "Leases" }}
      />
      <LeaseWizard key={bfcacheId}
        {...wizardOptions(p)}
        {...template}
        initial={{
          building_id: unit?.building_id ?? "",
          unit_id: unit?.id ?? "",
          property_type: unit ? (unit.building.totalUnits > 1 ? "Multi-Family" : "Single Family") : "",
          tenant_ids: tenantIds,
          max_occupants: tenantIds.length ? String(Math.min(10, tenantIds.length)) : "",
          start_date: "",
          end_date: "",
          monthly_rent: "",
          annual_rent: "",
          first_payment_due: "",
          security_deposit: "",
          security_deposit_due: "",
          other_conditions: "",
          vehicles: [],
          extra_fields: {},
        }}
      />
    </>
  );
}
