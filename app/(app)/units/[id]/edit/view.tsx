"use client";

import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { Missing } from "@/components/ui";
import { useMutations } from "@/components/use-mutations";
import { Card, PageHeader } from "@/components/ui";
import { UnitForm } from "../../unit-form";


export default function EditUnitPageView() {
  // Fresh form on each visit via a link; back/forward still restores what was typed.
  const { bfcacheId } = useRouter();
  const params = useParams<{ id: string }>();
  const { p } = useApp();
  const m = useMutations();
  const unit = p.unitById.get(params.id);
  if (!unit) return <Missing what="Unit" href="/units" label="Back to units" />;
  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit unit ${unit.unit_number}`} back={{ href: `/units/${unit.id}`, label: `Unit ${unit.unit_number}` }} />
      <Card>
        <UnitForm key={bfcacheId}
          action={m.saveUnit(unit.id)}
          unit={unit}
          buildings={p.buildings.map((b) => ({ value: String(b.id), label: b.displayName, detail: b.fullAddress }))}
          cancelHref={`/units/${unit.id}`}
        />
      </Card>
    </div>
  );
}
