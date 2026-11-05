"use client";

import { ActionForm, Field, FormActions, Input, SubmitButton } from "@/components/form";
import type { ActionState } from "@/lib/forms";

type B = { name: string; address: string; city: string; state: string; zip: string; id: string } | null;

export function BuildingForm({ action, building, cancelHref }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; building: B; cancelHref: string }) {
  return (
    <ActionForm action={action}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-6">
        <Field name="name" label="Building name" className="sm:col-span-6" hint="A friendly name, e.g. “Maple Court”.">
          <Input name="name" initial={building?.name} />
        </Field>
        <Field name="address" label="Street address" required className="sm:col-span-6">
          <Input name="address" initial={building?.address} autoComplete="street-address" />
        </Field>
        <Field name="city" label="City" required className="sm:col-span-3">
          <Input name="city" initial={building?.city} />
        </Field>
        <Field name="state" label="State" required className="sm:col-span-1">
          <Input name="state" initial={building?.state} maxLength={50} />
        </Field>
        <Field name="zip" label="ZIP code" required className="sm:col-span-2">
          <Input name="zip" initial={building?.zip} inputMode="numeric" />
        </Field>
      </div>
      <FormActions cancelHref={cancelHref}>
        <SubmitButton>{building ? "Save changes" : "Add building"}</SubmitButton>
      </FormActions>
    </ActionForm>
  );
}
