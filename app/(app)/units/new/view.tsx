"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@/components/use-query";
import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { useMutations } from "@/components/use-mutations";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { UnitForm } from "../unit-form";


export default function NewUnitPageView() {
  // Fresh form on each visit via a link; back/forward still restores what was typed.
  const { bfcacheId } = useRouter();
  const searchParams = useQuery();
  const { p } = useApp();
  const m = useMutations();
  const sp = searchParams;
  const building = typeof sp.building === "string" && p.buildingById.has(sp.building) ? sp.building : "";
  const back = building ? { href: `/buildings/${building}`, label: p.buildingById.get(building)!.displayName } : { href: "/units", label: "Units" };
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add unit" back={back} />
      <Card>
        {p.buildings.length === 0 ? (
          <EmptyState icon="building" title="Add a building first" description="Units belong to a building." action={<Link href="/buildings/new" className="btn-primary">Add building</Link>} />
        ) : (
          <UnitForm key={bfcacheId}
            action={m.saveUnit(null)}
            unit={null}
            buildings={p.buildings.map((b) => ({ value: String(b.id), label: b.displayName, detail: b.fullAddress }))}
            defaultBuilding={building || (p.buildings.length === 1 ? String(p.buildings[0].id) : "")}
            cancelHref={back.href}
            next={building ? `/buildings/${building}` : undefined}
          />
        )}
      </Card>
    </div>
  );
}
