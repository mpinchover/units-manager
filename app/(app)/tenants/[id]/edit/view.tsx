"use client";

import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { Missing } from "@/components/ui";
import { useMutations } from "@/components/use-mutations";
import { unitOptions } from "@/lib/options";
import { Card, PageHeader } from "@/components/ui";
import { TenantForm } from "../../tenant-form";


export default function EditTenantPageView() {
  // Fresh form on each visit via a link; back/forward still restores what was typed.
  const { bfcacheId } = useRouter();
  const params = useParams<{ id: string }>();
  const { p } = useApp();
  const m = useMutations();
  const t = p.tenantById.get(params.id);
  if (!t) return <Missing what="Tenant" href="/tenants" label="Back to tenants" />;
  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit ${t.fullName}`} back={{ href: `/tenants/${t.id}`, label: t.fullName }} />
      <Card>
        <TenantForm key={bfcacheId} action={m.saveTenant(t.id)} tenant={t} units={unitOptions(p)} cancelHref={`/tenants/${t.id}`} />
      </Card>
    </div>
  );
}
