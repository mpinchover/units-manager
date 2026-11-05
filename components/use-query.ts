"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

/** The URL's search params as a plain object (for list sorting and pagination). */
export function useQuery(): Record<string, string> {
  const sp = useSearchParams();
  return useMemo(() => Object.fromEntries(sp.entries()), [sp]);
}
