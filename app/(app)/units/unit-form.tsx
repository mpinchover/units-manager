"use client";

import { ActionForm, Field, FormActions, Input, SubmitButton, useFormState, useValue } from "@/components/form";
import { Combobox, type Option } from "@/components/combobox";
import type { ActionState } from "@/lib/forms";

type U = { building_id: string; unit_number: string } | null;

function BuildingPicker({ options, initial }: { options: Option[]; initial: string }) {
  const value = useValue("building_id", initial);
  const invalid = !!useFormState().errors?.building_id;
  return <Combobox key={value} name="building_id" options={options} defaultValue={value} placeholder="Search buildings…" invalid={invalid} />;
}

export function UnitForm({
  action,
  unit,
  buildings,
  defaultBuilding,
  cancelHref,
  next,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  unit: U;
  buildings: Option[];
  defaultBuilding?: string;
  cancelHref: string;
  next?: string;
}) {
  return (
    <ActionForm action={action}>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-6">
        <Field name="building_id" label="Building" required className="sm:col-span-4">
          <BuildingPicker options={buildings} initial={unit ? String(unit.building_id) : defaultBuilding ?? ""} />
        </Field>
        <Field name="unit_number" label="Unit number / name" required className="sm:col-span-2">
          <Input name="unit_number" initial={unit?.unit_number} placeholder="e.g. 2B" />
        </Field>
      </div>
      <p className="text-xs text-muted">Creating a unit doesn&apos;t create a tenant or lease. Add those separately when you&apos;re ready.</p>
      <FormActions cancelHref={cancelHref}>
        <SubmitButton>{unit ? "Save changes" : "Add unit"}</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
