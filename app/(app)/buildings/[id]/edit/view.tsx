"use client";

import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { Missing } from "@/components/ui";
import { useMutations } from "@/components/use-mutations";
import { Card, PageHeader } from "@/components/ui";
import { BuildingForm } from "../../building-form";


export default function EditBuildingPageView() {
  // Fresh form on each visit via a link; back/forward still restores what was typed.
  const { bfcacheId } = useRouter();
  const params = useParams<{ id: string }>();
  const { p } = useApp();
  const m = useMutations();
  const building = p.buildingById.get(params.id);
  if (!building) return <Missing what="Building" href="/buildings" label="Back to buildings" />;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Edit building" back={{ href: `/buildings/${building.id}`, label: building.displayName }} />
      <Card>
        <BuildingForm key={bfcacheId} action={m.saveBuilding(building.id)} building={building} cancelHref={`/buildings/${building.id}`} />
      </Card>
    </div>
  );
}
