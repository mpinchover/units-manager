import { notFound } from "next/navigation";
import { getPortfolio } from "@/lib/context";
import { Card, PageHeader } from "@/components/ui";
import { UnitForm } from "../../unit-form";
import { saveUnit } from "../../actions";

export const metadata = { title: "Edit unit" };

export default async function EditUnitPage({ params }: PageProps<"/units/[id]/edit">) {
  const p = await getPortfolio();
  const unit = p.unitById.get((await params).id);
  if (!unit) notFound();
  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit unit ${unit.unit_number}`} back={{ href: `/units/${unit.id}`, label: `Unit ${unit.unit_number}` }} />
      <Card>
        <UnitForm
          action={saveUnit.bind(null, unit.id)}
          unit={unit}
          buildings={p.buildings.map((b) => ({ value: String(b.id), label: b.displayName, detail: b.fullAddress }))}
          cancelHref={`/units/${unit.id}`}
        />
      </Card>
    </div>
  );
}
