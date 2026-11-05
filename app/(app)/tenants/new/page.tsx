import { getPortfolio } from "@/lib/context";
import { unitOptions } from "@/lib/options";
import { Card, PageHeader } from "@/components/ui";
import { TenantForm } from "../tenant-form";
import { saveTenant } from "../actions";

export const metadata = { title: "Add tenant" };

export default async function NewTenantPage({ searchParams }: PageProps<"/tenants/new">) {
  const p = await getPortfolio();
  const sp = await searchParams;
  const unit = typeof sp.unit === "string" && p.unitById.has(sp.unit) ? sp.unit : "";
  const back = unit ? { href: `/units/${unit}`, label: `Unit ${p.unitById.get(unit)!.unit_number}` } : { href: "/tenants", label: "Tenants" };
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add tenant" back={back} />
      <Card>
        <TenantForm action={saveTenant.bind(null, null)} tenant={null} units={unitOptions(p)} defaultUnit={unit} cancelHref={back.href} />
      </Card>
    </div>
  );
}
