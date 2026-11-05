import { notFound } from "next/navigation";
import { getPortfolio } from "@/lib/context";
import { Card, PageHeader } from "@/components/ui";
import { BuildingForm } from "../../building-form";
import { saveBuilding } from "../../actions";

export const metadata = { title: "Edit building" };

export default async function EditBuildingPage({ params }: PageProps<"/buildings/[id]/edit">) {
  const p = await getPortfolio();
  const building = p.buildingById.get((await params).id);
  if (!building) notFound();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit building" back={{ href: `/buildings/${building.id}`, label: building.displayName }} />
      <Card>
        <BuildingForm action={saveBuilding.bind(null, building.id)} building={building} cancelHref={`/buildings/${building.id}`} />
      </Card>
    </div>
  );
}
