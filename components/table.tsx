import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icons";
import { PAGE_SIZE, withParams, type ListParams } from "@/lib/list";

export function SortHeader({ base, params, k, children, className = "" }: { base: string; params: ListParams; k?: string; children: ReactNode; className?: string }) {
  if (!k) return <th className={`th ${className}`}>{children}</th>;
  const active = params.sort === k;
  const nextDir = active && params.dir === "asc" ? "desc" : "asc";
  return (
    <th className={`th ${className}`} aria-sort={active ? (params.dir === "asc" ? "ascending" : "descending") : undefined}>
      <Link href={withParams(base, params.raw, { sort: k, dir: nextDir, page: null })} className="inline-flex items-center gap-1 hover:text-ink" scroll={false}>
        {children}
        {active && <Icon name={params.dir === "asc" ? "arrowUp" : "arrowDown"} className="size-3" />}
      </Link>
    </th>
  );
}

export function TableShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">{children}</table>
      </div>
      {footer}
    </div>
  );
}

export function Pagination({ base, params, page, pages, total }: { base: string; params: ListParams; page: number; pages: number; total: number }) {
  if (total === 0) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted">
      <span>
        {from}–{to} of {total}
      </span>
      {pages > 1 && (
        <div className="flex gap-2">
          {page > 1 ? (
            <Link className="btn-secondary px-2.5 py-1.5" href={withParams(base, params.raw, { page: String(page - 1) })} scroll={false}>
              <Icon name="chevronLeft" /> Prev
            </Link>
          ) : null}
          {page < pages ? (
            <Link className="btn-secondary px-2.5 py-1.5" href={withParams(base, params.raw, { page: String(page + 1) })} scroll={false}>
              Next <Icon name="chevronRight" />
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function RowLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`font-medium text-ink hover:text-brand-700 hover:underline ${className}`}>
      {children}
    </Link>
  );
}
