"use client";

import { createContext, use, useActionState, useEffect, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { ActionState } from "@/lib/forms";
import { Icon } from "./icons";

type Action = (state: ActionState, fd: FormData) => Promise<ActionState>;
const FormCtx = createContext<ActionState>({});

export function useFormState() {
  return use(FormCtx);
}

export function ActionForm({
  action,
  children,
  className = "space-y-5",
  onSuccess,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  onSuccess?: (state: ActionState) => void;
}) {
  const [state, formAction] = useActionState(action, {});
  useEffect(() => {
    window.dispatchEvent(new Event("pp:flash"));
    if (state.ok) onSuccess?.(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <FormCtx value={state}>
      <form action={formAction} className={className} noValidate>
        {state.message && (
          <div
            role={state.ok ? "status" : "alert"}
            className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${state.ok ? "border-brand-200 bg-brand-50 text-brand-800" : "border-red-200 bg-red-50 text-red-800"}`}
          >
            <Icon name={state.ok ? "check" : "alert"} className="mt-0.5 size-4 shrink-0" />
            {state.message}
          </div>
        )}
        {children}
      </form>
    </FormCtx>
  );
}

/** Value to show in an input: what the user just submitted (after a failed save), else the stored value. */
export function useValue(name: string, fallback: string | number | null | undefined = "") {
  const state = useFormState();
  return state.values?.[name] ?? (fallback == null ? "" : String(fallback));
}

export function Field({
  name,
  label,
  required,
  hint,
  children,
  className = "",
}: {
  name: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const error = useFormState().errors?.[name];
  return (
    <div className={className} data-invalid={error ? "" : undefined}>
      <label htmlFor={name} className="label">
        {label}
        {required ? <span className="text-red-600"> *</span> : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { name: string; initial?: string | number | null };
export function Input({ name, initial, className = "", ...rest }: InputProps) {
  const value = useValue(name, initial);
  const error = useFormState().errors?.[name];
  return (
    <input
      key={value}
      id={name}
      name={name}
      defaultValue={value}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${name}-error` : undefined}
      className={`input ${className}`}
      {...rest}
    />
  );
}

export function Textarea({ name, initial, rows = 3, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string; initial?: string | null }) {
  const value = useValue(name, initial);
  const error = useFormState().errors?.[name];
  return <textarea key={value} id={name} name={name} rows={rows} defaultValue={value} aria-invalid={error ? true : undefined} className="input" {...rest} />;
}

export function Select({ name, initial, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { name: string; initial?: string | number | null }) {
  const value = useValue(name, initial);
  const error = useFormState().errors?.[name];
  return (
    <select key={value} id={name} name={name} defaultValue={value} aria-invalid={error ? true : undefined} className="input" {...rest}>
      {children}
    </select>
  );
}

export function SubmitButton({ children, pendingText = "Saving…", className = "btn-primary", name, value }: { children: ReactNode; pendingText?: string; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value}>
      {pending && <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {pending ? pendingText : children}
    </button>
  );
}

export function FormActions({ cancelHref, children }: { cancelHref: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-line pt-5">
      <Link href={cancelHref} className="btn-secondary">
        Cancel
      </Link>
      {children}
    </div>
  );
}
