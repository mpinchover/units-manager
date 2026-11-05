"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@/components/use-query";
import { useApp } from "@/components/app-provider";
import { useMutations } from "@/components/use-mutations";
import { unitOptions } from "@/lib/options";
import { Card, PageHeader } from "@/components/ui";
import { TenantForm } from "../tenant-form";


export default function NewTenantPageView() {
  // Fresh form on each visit via a link; back/forward still restores what was typed.
  const { bfcacheId } = useRouter();
  const searchParams = useQuery();
  const { p } = useApp();
  const m = useMutations();
  const sp = searchParams;
  const unit = typeof sp.unit === "string" && p.unitById.has(sp.unit) ? sp.unit : "";
  const back = unit ? { href: `/units/${unit}`, label: `Unit ${p.unitById.get(unit)!.unit_number}` } : { href: "/tenants", label: "Tenants" };
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add tenant" back={back} />
      <Card>
        <TenantForm key={bfcacheId} action={m.saveTenant(null)} tenant={null} units={unitOptions(p)} defaultUnit={unit} cancelHref={back.href} />
      </Card>
    </div>
  );
}
