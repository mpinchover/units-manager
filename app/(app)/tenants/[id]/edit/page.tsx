import { notFound } from "next/navigation";
import { getPortfolio } from "@/lib/context";
import { unitOptions } from "@/lib/options";
import { Card, PageHeader } from "@/components/ui";
import { TenantForm } from "../../tenant-form";
import { saveTenant } from "../../actions";

export const metadata = { title: "Edit tenant" };

export default async function EditTenantPage({ params }: PageProps<"/tenants/[id]/edit">) {
  const p = await getPortfolio();
  const t = p.tenantById.get((await params).id);
  if (!t) notFound();
  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit ${t.fullName}`} back={{ href: `/tenants/${t.id}`, label: t.fullName }} />
      <Card>
        <TenantForm action={saveTenant.bind(null, t.id)} tenant={t} units={unitOptions(p)} cancelHref={`/tenants/${t.id}`} />
      </Card>
    </div>
  );
}
