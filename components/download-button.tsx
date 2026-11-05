"use client";

import { useState, useTransition } from "react";
import { useApp } from "./app-provider";
import { Icon } from "./icons";

/** Downloads a lease PDF from the active data source (generated in the browser in demo mode). */
export function DownloadPdfButton({ leaseId, version, className = "btn-primary" }: { leaseId: string; version?: number; className?: string }) {
  const { ds, check } = useApp();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = check(await ds.downloadPdf(leaseId, version));
            setError(res.ok ? null : res.error);
          })
        }
      >
        <Icon name="download" /> {pending ? "Preparing PDF…" : "Download PDF"}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
