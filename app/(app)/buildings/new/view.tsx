"use client";

import { useRouter } from "next/navigation";
import { useMutations } from "@/components/use-mutations";
import { Card, PageHeader } from "@/components/ui";
import { BuildingForm } from "../building-form";


export default function NewBuildingPageView() {
  // Fresh form on each visit via a link; back/forward still restores what was typed.
  const { bfcacheId } = useRouter();
  const m = useMutations();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add building" back={{ href: "/buildings", label: "Buildings" }} />
      <Card>
        <BuildingForm key={bfcacheId} action={m.saveBuilding(null)} building={null} cancelHref="/buildings" />
      </Card>
    </div>
  );
}
