"use client";

import { ActionForm, Field, FormActions, Input, SubmitButton, useFormState, useValue } from "@/components/form";
import { Combobox, type Option } from "@/components/combobox";
import type { ActionState } from "@/lib/forms";

type T = { first_name: string; last_name: string; email: string; phone: string; unit_id: string | null } | null;

function UnitPicker({ options, initial }: { options: Option[]; initial: string }) {
  const value = useValue("unit_id", initial);
  const invalid = !!useFormState().errors?.unit_id;
  return (
    <Combobox key={value} name="unit_id" options={[{ value: "", label: "Not assigned" }, ...options]} defaultValue={value} placeholder="Search building or unit…" invalid={invalid} />
  );
}

export function TenantForm({
  action,
  tenant,
  units,
  defaultUnit,
  cancelHref,
}: {
  action: (s: ActionState, fd: FormData) => Promise<ActionState>;
  tenant: T;
  units: Option[];
  defaultUnit?: string;
  cancelHref: string;
}) {
  return (
    <ActionForm action={action}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field name="first_name" label="First name" required>
          <Input name="first_name" initial={tenant?.first_name} autoComplete="off" />
        </Field>
        <Field name="last_name" label="Last name" required>
          <Input name="last_name" initial={tenant?.last_name} autoComplete="off" />
        </Field>
        <Field name="email" label="Email" required>
          <Input name="email" type="email" initial={tenant?.email} autoComplete="off" />
        </Field>
        <Field name="phone" label="Phone number">
          <Input name="phone" type="tel" initial={tenant?.phone} autoComplete="off" />
        </Field>
        <Field
          name="unit_id"
          label="Building & unit"
          className="sm:col-span-2"
          hint="Where the tenant is expected to live."
        >
          <UnitPicker options={units} initial={tenant?.unit_id ? String(tenant.unit_id) : defaultUnit ?? ""} />
        </Field>
      </div>
      <FormActions cancelHref={cancelHref}>
        <SubmitButton>{tenant ? "Save changes" : "Add tenant"}</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
