/** Server-side sort / paginate for list pages, driven by URL search params. */
export type SearchParams = Record<string, string | string[] | undefined>;
export type ListParams = { raw: Record<string, string>; sort: string; dir: "asc" | "desc"; page: number };

export const PAGE_SIZE = 20;

export function parseList(sp: SearchParams, defaultSort: string, defaultDir: "asc" | "desc" = "asc"): ListParams {
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const value = Array.isArray(v) ? v[0] : v;
    if (value) raw[k] = value;
  }
  return {
    raw,
    sort: raw.sort ?? defaultSort,
    dir: raw.dir === "asc" || raw.dir === "desc" ? raw.dir : defaultDir,
    page: Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1),
  };
}

export function applyList<T>(
  rows: T[],
  params: ListParams,
  opts: { sorters: Record<string, (row: T) => string | number | null> },
) {
  let filtered = rows;
  const sorter = opts.sorters[params.sort] ?? Object.values(opts.sorters)[0];
  if (sorter) {
    const mult = params.dir === "desc" ? -1 : 1;
    filtered = [...filtered].sort((a, b) => {
      const x = sorter(a);
      const y = sorter(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1; // empty values last
      if (y == null) return -1;
      if (typeof x === "number" && typeof y === "number") return (x - y) * mult;
      return String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" }) * mult;
    });
  }
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, pages);
  return { rows: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, page, pages };
}

export function withParams(base: string, raw: Record<string, string>, patch: Record<string, string | null>): string {
  const next = new URLSearchParams(raw);
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") next.delete(k);
    else next.set(k, v);
  }
  const s = next.toString();
  return s ? `${base}?${s}` : base;
}
