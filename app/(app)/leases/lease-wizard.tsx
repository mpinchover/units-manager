"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Combobox, type Option } from "@/components/combobox";
import { ActionForm, Field, Input, SubmitButton } from "@/components/form";
import { Icon } from "@/components/icons";
import { useApp } from "@/components/app-provider";
import { useMutations } from "@/components/use-mutations";
import type { Block, LeasePayload, Vehicle } from "@/lib/data-source";

export type UnitOption = Option & { buildingId: string; address: string; unitNumber: string; buildingUnitCount: number };
export type ExtraField = { key: string; label: string };
export type WizardInitial = Omit<LeasePayload, "vehicles"> & { building_id: string; vehicles: Vehicle[] };

const STEPS = ["Property", "Tenants", "Rent & dates", "Vehicles & conditions", "Preview"] as const;
const PROPERTY_TYPES = ["Single Family", "Multi-Family"];
const OCCUPANTS = Array.from({ length: 10 }, (_, i) => String(i + 1));
const MONEY = /^\$?\s*[\d,]+(\.\d{1,2})?$/;

function stepFor(field: string): number {
  if (["unit_id", "property_type"].includes(field)) return 0;
  if (["tenant_ids", "max_occupants"].includes(field)) return 1;
  if (field === "other_conditions" || field.startsWith("vehicles") || field.startsWith("extra_fields")) return 3;
  return 2;
}

function addDays(d: string, n: number) {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
}

/** A complete date with a 4-digit year (date inputs can briefly hold partial or 5+ digit years while typing). */
const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`));

/** The same calendar date one year later (Feb 29 becomes Feb 28). */
function plusOneYear(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  const x = new Date(0);
  x.setUTCFullYear(y + 1, m - 1, day); // (Date.UTC would map years 0-99 to 1900-1999 while a year is being typed)
  if (x.getUTCMonth() !== m - 1) x.setUTCDate(0);
  return x.toISOString().slice(0, 10);
}

/** Number of monthly payments in a term (rounded to the nearest month). */
function paymentsIn(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${addDays(end, 1)}T00:00:00Z`);
  let months = (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth());
  const dayDiff = e.getUTCDate() - s.getUTCDate();
  if (dayDiff >= 15) months += 1;
  if (dayDiff <= -15) months -= 1;
  return Math.max(1, months);
}

function cents(v: string): number | null {
  const t = v.trim();
  return MONEY.test(t) ? Math.round(Number(t.replace(/[$,\s]/g, "")) * 100) : null;
}

const fmtAmount = (c: number) => (c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });


/** The filled-in lease as a document, with substituted values highlighted. */
function LeasePreview({ blocks, labels }: { blocks: Block[]; labels: Record<string, string> }) {
  return (
    <article className="mx-auto max-w-[8.5in] rounded-sm border border-line bg-white px-8 py-10 font-serif text-[15px] leading-relaxed text-zinc-900 shadow-sm sm:px-16 sm:py-14">
      {blocks.map((b, i) => (
        <p key={i} className={b.kind === "title" ? "mb-6 text-center text-xl font-bold tracking-wide" : "mb-3.5"}>
          {b.lines.map((line, j) => (
            <span key={j}>
              {j > 0 && <br />}
              {line.map((r, k) =>
                r.field ? (
                  <mark
                    key={k}
                    title={labels[r.field] ?? r.field}
                    className={`rounded px-0.5 ${r.empty ? "bg-zinc-100 text-zinc-400" : "bg-brand-50 font-semibold text-brand-900"}`}
                  >
                    {r.text}
                  </mark>
                ) : (
                  <span key={k}>{r.text}</span>
                ),
              )}
            </span>
          ))}
        </p>
      ))}
    </article>
  );
}

export function LeaseWizard({
  leaseId: initialLeaseId,
  buildings,
  units,
  tenants: initialTenants,
  extraFields,
  labels,
  initial,
}: {
  leaseId?: string;
  buildings: Option[];
  units: UnitOption[];
  tenants: Option[];
  extraFields: ExtraField[];
  labels: Record<string, string>;
  initial: WizardInitial;
}) {
  const [step, setStep] = useState(0);
  const [v, setV] = useState(initial);
  // Fields the user has typed into themselves; their defaults no longer follow their source fields.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tenants, setTenants] = useState(initialTenants);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [leaseId, setLeaseId] = useState(initialLeaseId);
  const [saved, setSaved] = useState<{ leaseId: string; version: number } | null>(null);
  const { ds, refresh, check } = useApp();
  const { createTenantInline } = useMutations();
  const [addingTenant, setAddingTenant] = useState(false);
  const [pending, start] = useTransition();
  const unitLocked = !!initialLeaseId; // an existing lease keeps its unit

  /**
   * Apply an edit, then update the defaults that depend on the edited field:
   * a new start date sets the end date (start + 1 year) and both due dates (= start) right away;
   * rent and dates update the total rent; rent sets the deposit; unit and tenants set type and occupants.
   * A field the user has typed into themselves keeps their value.
   */
  function set(patch: Partial<WizardInitial>) {
    const t = { ...touched };
    for (const k of Object.keys(patch)) t[k] = true;
    const next = { ...v, ...patch };
    const changed = (k: keyof WizardInitial) => k in patch;

    if (changed("unit_id") && !t.property_type) {
      const u = units.find((x) => x.value === next.unit_id);
      if (u) next.property_type = u.buildingUnitCount > 1 ? "Multi-Family" : "Single Family";
    }
    if (changed("tenant_ids") && !t.max_occupants && next.tenant_ids.length) {
      next.max_occupants = String(Math.min(10, next.tenant_ids.length));
    }
    if (changed("start_date") && isDate(next.start_date)) {
      if (!t.end_date) next.end_date = plusOneYear(next.start_date);
      if (!t.first_payment_due) next.first_payment_due = next.start_date;
      if (!t.security_deposit_due) next.security_deposit_due = next.start_date;
    }
    const monthly = cents(next.monthly_rent);
    if (changed("monthly_rent") && !t.security_deposit && monthly) next.security_deposit = fmtAmount(monthly);
    if (
      (changed("monthly_rent") || changed("start_date") || changed("end_date")) &&
      !t.annual_rent && monthly && isDate(next.start_date) && isDate(next.end_date) && next.end_date > next.start_date
    ) {
      next.annual_rent = fmtAmount(monthly * paymentsIn(next.start_date, next.end_date));
    }
    setV(next);
    setTouched(t);
    setErrors((e) => {
      const n = { ...e };
      for (const k of Object.keys(next) as (keyof WizardInitial)[]) if (next[k] !== v[k]) delete n[k];
      return n;
    });
    setSaved(null);
  }

  const unitChoices = useMemo(() => units.filter((u) => !v.building_id || u.buildingId === v.building_id), [units, v.building_id]);
  const unit = units.find((u) => u.value === v.unit_id);
  const selectedTenants = v.tenant_ids.map((id) => tenants.find((t) => t.value === id)).filter(Boolean) as Option[];

  function validateStep(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!v.unit_id) e.unit_id = "Select a unit.";
      if (!v.property_type) e.property_type = "Choose a property type.";
    }
    if (s === 1) {
      if (!v.tenant_ids.length) e.tenant_ids = "Select at least one tenant.";
      if (!v.max_occupants) e.max_occupants = "Choose the maximum number of occupants.";
    }
    if (s === 2) {
      const dates = [
        ["start_date", "Lease start date"],
        ["end_date", "Lease end date"],
        ["first_payment_due", "First payment due date"],
        ["security_deposit_due", "Security deposit due date"],
      ] as const;
      for (const [k, name] of dates) if (!v[k]) e[k] = `${name} is required.`;
      if (v.start_date && v.end_date && v.end_date <= v.start_date) e.end_date = "Lease end date must be after the start date.";
      const amounts = [
        ["monthly_rent", "Monthly rent"],
        ["annual_rent", "Total rent"],
        ["security_deposit", "Security deposit"],
      ] as const;
      for (const [k, name] of amounts) {
        if (!v[k].trim()) e[k] = `${name} is required.`;
        else if (cents(v[k]) == null) e[k] = "Enter an amount like 1850 or 1,850.00.";
      }
    }
    return e;
  }

  const payload = (): LeasePayload => {
    const { building_id: _building, ...rest } = v;
    void _building;
    return rest;
  };

  function handleFailure(res: { error: string; errors?: Record<string, string>; status?: number }) {
    setMessage(res.errors && res.status === 400 ? "Please fix the highlighted fields." : res.error);
    if (res.errors && Object.keys(res.errors).length) {
      setErrors(res.errors);
      setStep(Math.min(...Object.keys(res.errors).map(stepFor)));
    }
  }

  function showPreview() {
    setMessage(null);
    start(async () => {
      const res = check(await ds.previewLease(payload(), leaseId));
      if (!res.ok) return handleFailure(res);
      setBlocks(res.data.blocks);
      setStep(4);
      window.scrollTo({ top: 0 });
    });
  }

  function goTo(target: number) {
    for (let s = 0; s < Math.min(target, 4); s++) {
      const e = validateStep(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    setErrors({});
    if (target === 4) showPreview();
    else setStep(target);
  }

  function download() {
    setMessage(null);
    start(async () => {
      if (saved) {
        await ds.downloadPdf(saved.leaseId, saved.version);
        return;
      }
      const res = check(await ds.saveLease(payload(), leaseId));
      if (!res.ok) return handleFailure(res);
      setSaved({ leaseId: res.data.id, version: res.data.version });
      setLeaseId(res.data.id); // later edits become new versions of this lease, not duplicates
      await refresh();
      await ds.downloadPdf(res.data.id, res.data.version);
    });
  }

  const err = (k: string) => (errors[k] ? <p className="mt-1.5 text-sm text-red-700">{errors[k]}</p> : null);
  const label = (htmlFor: string, text: string, required = true) => (
    <label className="label" htmlFor={htmlFor}>
      {text} {required ? <span className="text-red-600">*</span> : <span className="font-normal text-muted">(optional)</span>}
    </label>
  );
  const dateField = (k: "start_date" | "end_date" | "first_payment_due" | "security_deposit_due", text: string, hint?: string) => (
    <div>
      {label(k, text)}
      <input id={k} type="date" className="input" aria-invalid={!!errors[k] || undefined} value={v[k]} onChange={(e) => set({ [k]: e.target.value })} />
      {errors[k] ? err(k) : hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
  const moneyField = (k: "monthly_rent" | "annual_rent" | "security_deposit", text: string, hint?: string) => (
    <div>
      {label(k, text)}
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">$</span>
        <input
          id={k}
          inputMode="decimal"
          className="input pl-7"
          placeholder="0.00"
          aria-invalid={!!errors[k] || undefined}
          value={v[k]}
          onChange={(e) => set({ [k]: e.target.value })}
        />
      </div>
      {errors[k] ? err(k) : hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );

  const alert = message && (
    <div role="alert" className="mx-auto mb-5 flex max-w-[8.5in] items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <Icon name="alert" className="mt-0.5 size-4 shrink-0" /> {message}
    </div>
  );

  if (step === 4 && blocks) {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="btn-secondary" onClick={() => setStep(3)} disabled={pending}>
            <Icon name="chevronLeft" /> Back to edit
          </button>
          <div className="flex flex-wrap items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-brand-800">
                <Icon name="check" className="size-4" /> Saved as version {saved.version}.
                <Link href={`/leases/${saved.leaseId}`} className="link">View lease</Link>
              </span>
            )}
            <button type="button" className="btn-primary" onClick={download} disabled={pending}>
              <Icon name="download" /> {pending ? "Preparing PDF…" : saved ? "Download again" : "Download PDF"}
            </button>
          </div>
        </div>
        {alert}
        {!saved && (
          <p className="mx-auto mb-4 max-w-[8.5in] text-sm text-muted">
            This is exactly what the PDF will contain. Highlighted text comes from your entries. Downloading saves{" "}
            {leaseId ? "a new version of this lease (earlier versions are kept)." : "the lease."}
          </p>
        )}
        <LeasePreview blocks={blocks} labels={labels} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <ol className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Steps">
        {STEPS.map((name, i) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => (i < step ? setStep(i) : goTo(i))}
              aria-current={i === step ? "step" : undefined}
              disabled={pending}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm whitespace-nowrap ${
                i === step ? "bg-white font-medium text-ink ring-1 ring-line" : "text-muted hover:text-ink"
              }`}
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  i < step ? "bg-brand-600 text-white" : i === step ? "bg-brand-100 text-brand-800" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {i < step ? <Icon name="check" className="size-3.5" /> : i + 1}
              </span>
              {name}
            </button>
          </li>
        ))}
      </ol>

      <div className="card p-5 sm:p-6 lg:col-span-3">
        {alert}

        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold">Property</h2>
            {unitLocked && <p className="text-sm text-muted">The property of an existing lease can&apos;t be changed.</p>}
            <div>
              <label className="label" htmlFor="building_id">Building</label>
              <Combobox
                id="building_id"
                options={buildings}
                value={v.building_id}
                disabled={unitLocked}
                onChange={(b) => set({ building_id: b, unit_id: unit?.buildingId === b ? v.unit_id : "" })}
                placeholder="Search buildings…"
              />
            </div>
            <div>
              {label("unit_id", "Unit")}
              <Combobox
                id="unit_id"
                options={unitChoices}
                value={v.unit_id}
                disabled={unitLocked}
                invalid={!!errors.unit_id}
                onChange={(id) => set({ unit_id: id, building_id: units.find((u) => u.value === id)?.buildingId ?? v.building_id })}
                placeholder={v.building_id ? "Search units…" : "Search all units…"}
                emptyText={v.building_id ? "This building has no units yet" : "No units yet"}
              />
              {err("unit_id")}
              {units.length === 0 && (
                <p className="mt-2 text-sm text-muted">
                  No units yet. <Link className="link" href="/units/new">Add a unit</Link> first.
                </p>
              )}
            </div>
            {unit && (
              <div className="rounded-lg bg-canvas px-4 py-3 text-sm">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">Property address on the lease</p>
                <p className="mt-1">
                  {unit.address}, Unit {unit.unitNumber}
                </p>
              </div>
            )}
            <div className="max-w-xs">
              {label("property_type", "Property type")}
              <select id="property_type" className="input" value={v.property_type} aria-invalid={!!errors.property_type || undefined} onChange={(e) => set({ property_type: e.target.value })}>
                <option value="">Choose…</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              {err("property_type")}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold">Tenants</h2>
            <div>
              {label("tenantPicker", "Tenants on this lease")}
              <Combobox
                id="tenantPicker"
                options={tenants.map((t) => ({ ...t, disabled: v.tenant_ids.includes(t.value) }))}
                value=""
                invalid={!!errors.tenant_ids}
                onChange={(id) => id && set({ tenant_ids: [...v.tenant_ids, id] })}
                placeholder="Search tenants by name or email…"
                emptyText="No matching tenants. Add a new one below."
              />
              {err("tenant_ids")}
            </div>
            {selectedTenants.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {selectedTenants.map((t) => (
                  <li key={t.value} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pr-1.5 pl-3 text-sm text-brand-800 ring-1 ring-brand-200">
                    {t.label}
                    <button
                      type="button"
                      aria-label={`Remove ${t.label}`}
                      className="rounded-full p-0.5 hover:bg-brand-100"
                      onClick={() => set({ tenant_ids: v.tenant_ids.filter((x) => x !== t.value) })}
                    >
                      <Icon name="x" className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted">Add everyone who will sign, using their full legal names.</p>

            <div className="rounded-lg border border-dashed border-line">
              {addingTenant ? (
                <div className="p-4">
                  <p className="mb-3 text-sm font-medium">New tenant</p>
                  <ActionForm
                    action={createTenantInline}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                    onSuccess={(s) => {
                      const d = s.data as { id: string; label: string; detail: string };
                      setTenants((ts) => [...ts, { value: d.id, label: d.label, detail: d.detail }]);
                      set({ tenant_ids: [...v.tenant_ids, d.id] });
                      setAddingTenant(false);
                    }}
                  >
                    <Field name="first_name" label="First name" required>
                      <Input name="first_name" autoFocus />
                    </Field>
                    <Field name="last_name" label="Last name" required>
                      <Input name="last_name" />
                    </Field>
                    <Field name="email" label="Email" required>
                      <Input name="email" type="email" />
                    </Field>
                    <Field name="phone" label="Phone">
                      <Input name="phone" type="tel" />
                    </Field>
                    <div className="flex justify-end gap-2 sm:col-span-2">
                      <button type="button" className="btn-secondary" onClick={() => setAddingTenant(false)}>
                        Cancel
                      </button>
                      <SubmitButton pendingText="Adding…">Add & select</SubmitButton>
                    </div>
                  </ActionForm>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50/60"
                  onClick={() => setAddingTenant(true)}
                >
                  <Icon name="plus" /> Add a new tenant
                </button>
              )}
            </div>

            <div className="max-w-xs">
              {label("max_occupants", "Maximum occupants")}
              <select id="max_occupants" className="input" value={v.max_occupants} aria-invalid={!!errors.max_occupants || undefined} onChange={(e) => set({ max_occupants: e.target.value })}>
                <option value="">Choose…</option>
                {OCCUPANTS.map((n) => (
                  <option key={n} value={n}>
                    {n} {n === "1" ? "person" : "people"}
                  </option>
                ))}
              </select>
              {errors.max_occupants ? err("max_occupants") : <p className="mt-1.5 text-xs text-muted">The most people allowed to live in the unit.</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-base font-semibold">Rent & dates</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {dateField("start_date", "Lease start")}
              {dateField("end_date", "Lease end", "Defaults to one year after the start.")}
              {moneyField("monthly_rent", "Monthly rent")}
              {moneyField(
                "annual_rent",
                "Total rent for the term",
                isDate(v.start_date) && isDate(v.end_date) && v.end_date > v.start_date
                  ? `${paymentsIn(v.start_date, v.end_date)} monthly payments, calculated for you. You can change it.`
                  : "Calculated from the monthly rent and term.",
              )}
              {dateField("first_payment_due", "First payment due", "Defaults to the lease start date.")}
              <div className="hidden sm:block" />
              {moneyField("security_deposit", "Security deposit", "Defaults to one month's rent.")}
              {dateField("security_deposit_due", "Security deposit due", "Defaults to the lease start date.")}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold">Vehicles</h2>
              <p className="mt-1 text-sm text-muted">Cars that will use the parking lot. Leave blank for none.</p>
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="grid grid-cols-1 gap-3 sm:grid-cols-[1.5rem_1fr_1fr_1fr] sm:items-end">
                  <span className="hidden pb-2.5 text-sm font-medium text-muted sm:block">{String.fromCharCode(97 + i)})</span>
                  {(["make", "model", "plate"] as const).map((part) => (
                    <div key={part}>
                      <label htmlFor={`car-${i}-${part}`} className={`label ${i > 0 ? "sm:sr-only" : ""}`}>
                        {part === "plate" ? "License plate" : part[0].toUpperCase() + part.slice(1)}
                      </label>
                      <input
                        id={`car-${i}-${part}`}
                        className="input"
                        placeholder={part === "make" ? "e.g. Honda" : part === "model" ? "e.g. Civic" : "e.g. ABC 1234"}
                        value={v.vehicles[i]?.[part] ?? ""}
                        onChange={(e) => {
                          const vehicles = [0, 1, 2].map((n) => ({ ...{ make: "", model: "", plate: "" }, ...v.vehicles[n] }));
                          vehicles[i] = { ...vehicles[i], [part]: e.target.value };
                          set({ vehicles });
                        }}
                      />
                      {err(`vehicles.${i}.${part}`)}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div>
              {label("other_conditions", "Other conditions", false)}
              <textarea
                id="other_conditions"
                rows={5}
                className="input"
                placeholder="Anything else that applies to this lease."
                value={v.other_conditions}
                onChange={(e) => set({ other_conditions: e.target.value })}
              />
              {errors.other_conditions ? err("other_conditions") : <p className="mt-1.5 text-xs text-muted">Leave blank to print “None.”</p>}
            </div>

            {extraFields.map((f) => (
              <div key={f.key}>
                {label(`extra-${f.key}`, f.label, false)}
                <input
                  id={`extra-${f.key}`}
                  className="input"
                  value={v.extra_fields[f.key] ?? ""}
                  onChange={(e) => set({ extra_fields: { ...v.extra_fields, [f.key]: e.target.value } })}
                />
                {err(`extra_fields.${f.key}`)}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
          <div>
            {step > 0 && (
              <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)} disabled={pending}>
                <Icon name="chevronLeft" /> Back
              </button>
            )}
          </div>
          {step < 3 ? (
            <button type="button" className="btn-primary" onClick={() => goTo(step + 1)}>
              Continue <Icon name="chevronRight" />
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={() => goTo(4)} disabled={pending}>
              <Icon name="file" /> {pending ? "Preparing preview…" : "Preview lease"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
