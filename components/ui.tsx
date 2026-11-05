import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <Icon name="chevronLeft" className="size-4" /> {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <div className="mt-1 text-sm text-muted">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({ title, actions, children, className = "", padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

const tones = {
  green: "bg-brand-50 text-brand-700 ring-brand-200",
  gray: "bg-zinc-50 text-zinc-600 ring-zinc-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  red: "bg-red-50 text-red-700 ring-red-200",
} as const;

export function Badge({ tone = "gray", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${tones[tone]}`}>
      {children}
    </span>
  );
}





export function EmptyState({ icon = "file", title, description, action }: { icon?: IconName; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icon name={icon} className="size-5" />
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function DetailList({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([k, v], i) => (
        <div key={i} className="min-w-0">
          <dt className="text-xs font-medium tracking-wide text-muted uppercase">{k}</dt>
          <dd className="mt-1 text-sm break-words">{v || <span className="text-muted">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}


export function BuildingIcon({ className = "size-10" }: { className?: string }) {
  return (
    <div className={`grid shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-500 ${className}`} aria-hidden>
      <Icon name="building" className="size-1/2" />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skeleton mb-2 h-7 w-48" />
      <div className="skeleton mb-6 h-4 w-72" />
      <div className="card p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton mb-3 h-9 w-full last:mb-0" />
        ))}
      </div>
    </div>
  );
}

/** Shown when a record doesn't exist (or was just deleted). */
export function Missing({ what, href, label }: { what: string; href: string; label: string }) {
  return (
    <div className="card">
      <EmptyState icon="file" title={`${what} not found`} description="It may have been deleted." action={<Link href={href} className="btn-secondary">{label}</Link>} />
    </div>
  );
}
