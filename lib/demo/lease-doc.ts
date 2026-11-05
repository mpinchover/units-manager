/**
 * Browser port of server/app/lease_document.py + the value mapping in server/app/leases.py:
 * fills the lease template's {PLACEHOLDER} variables. Used in demo mode only.
 */
import type { Block, Run, TemplateInfo } from "../data-source/types";
import { LEASE_TEMPLATE } from "./lease-template";

const PLACEHOLDER = /\{([A-Z0-9_]+)\}/g;
export const BLANK = "________";

const CAR_FIELDS = Object.fromEntries(
  [1, 2, 3].flatMap((n) =>
    (["MAKE", "MODEL", "PLATE"] as const).map((part) => [
      `CAR_${n}_${part}`,
      { label: `Car ${n} ${part === "PLATE" ? "license plate" : part.toLowerCase()}`, required: false },
    ]),
  ),
);

export const KNOWN_FIELDS: Record<string, { label: string; required: boolean }> = {
  PROPERTY_TYPE: { label: "Property type", required: true },
  PROPERTY_ADDRESS: { label: "Property address", required: true },
  UNIT: { label: "Unit", required: true },
  TENANTS: { label: "Tenants", required: true },
  LEASE_START: { label: "Lease start", required: true },
  LEASE_END: { label: "Lease end", required: true },
  ANNUAL_RENT: { label: "Total rent for the term", required: true },
  MONTHLY_RENT: { label: "Monthly rent", required: true },
  FIRST_PAYMENT_DUE: { label: "First payment due", required: true },
  MAX_OCCUPANTS: { label: "Maximum occupants", required: true },
  SECURITY_DEPOSIT: { label: "Security deposit", required: true },
  SECURITY_DEPOSIT_DUE: { label: "Security deposit due", required: true },
  OTHER_CONDITIONS: { label: "Other conditions", required: false },
  LANDLORD_SIGNATURE_DATE: { label: "Landlord signature date", required: false },
  ...CAR_FIELDS,
};

export function placeholders(text = LEASE_TEMPLATE): string[] {
  return [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1]))];
}

export function templateInfo(): TemplateInfo {
  const keys = placeholders();
  return {
    fields: keys.map((key) => ({ key, ...(KNOWN_FIELDS[key] ?? { label: key.replace(/_/g, " ").toLowerCase(), required: false }) })),
    extra: keys.filter((k) => !(k in KNOWN_FIELDS)),
  };
}

/** Paragraphs (blank-line separated) of lines of runs; the first paragraph is the title. */
export function buildBlocks(values: Record<string, string>, text = LEASE_TEMPLATE): Block[] {
  return text
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n[ \t]*\n/)
    .map((para, i) => ({
      kind: i === 0 ? "title" : "paragraph",
      lines: para.split("\n").map((line) => {
        const runs: Run[] = [];
        let pos = 0;
        for (const m of line.matchAll(PLACEHOLDER)) {
          if (m.index! > pos) runs.push({ text: line.slice(pos, m.index) });
          const value = (values[m[1]] ?? "").trim();
          runs.push({ text: value || BLANK, field: m[1], empty: !value });
          pos = m.index! + m[0].length;
        }
        if (pos < line.length) runs.push({ text: line.slice(pos) });
        return runs;
      }),
    }));
}

const LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const formatLongDate = (d: string) => {
  const [y, m, day] = d.slice(0, 10).split("-").map(Number);
  return `${LONG_MONTHS[m - 1]} ${day}, ${y}`;
};
/** Money without "$" (the template supplies it). */
export const formatAmount = (cents: number) => (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
