"use client";

import { useEffect, useState } from "react";
import { useApp } from "./app-provider";

export type LeaseTemplate = { labels: Record<string, string>; extraFields: { key: string; label: string }[] };

/** The lease template's variables: labels for the preview and any extra free-text fields. Null while loading. */
export function useLeaseTemplate(): LeaseTemplate | null {
  const { ds, check } = useApp();
  const [template, setTemplate] = useState<LeaseTemplate | null>(null);
  useEffect(() => {
    let alive = true;
    ds.templateInfo().then((res) => {
      if (!alive || !check(res).ok || !res.ok) return;
      const labels = Object.fromEntries(res.data.fields.map((f) => [f.key, f.label]));
      setTemplate({ labels, extraFields: res.data.extra.map((key) => ({ key, label: labels[key] ?? key })) });
    });
    return () => {
      alive = false;
    };
  }, [ds, check]);
  return template;
}
