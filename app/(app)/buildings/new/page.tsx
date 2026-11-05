import { getCtx } from "@/lib/context";
import { Card, PageHeader } from "@/components/ui";
import { BuildingForm } from "../building-form";
import { saveBuilding } from "../actions";

export const metadata = { title: "Add building" };

export default async function NewBuildingPage() {
  await getCtx();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add building" back={{ href: "/buildings", label: "Buildings" }} />
      <Card>
        <BuildingForm action={saveBuilding.bind(null, null)} building={null} cancelHref="/buildings" />
      </Card>
    </div>
  );
}
