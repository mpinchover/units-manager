"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";

export type Option = { value: string; label: string; detail?: string; disabled?: boolean };

/**
 * Searchable dropdown. Submits its value through a hidden input named `name`.
 * Controlled when `value`/`onChange` are given, otherwise uncontrolled with `defaultValue`.
 */
export function Combobox({
  name,
  options,
  value: controlled,
  defaultValue = "",
  onChange,
  placeholder = "Select…",
  emptyText = "No matches",
  invalid,
  disabled,
  id,
}: {
  name?: string;
  options: Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
}) {
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return options;
    return options.filter((o) => terms.every((t) => `${o.label} ${o.detail ?? ""}`.toLowerCase().includes(t)));
  }, [options, query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (o: Option) => {
    if (o.disabled) return;
    if (controlled === undefined) setInner(o.value);
    onChange?.(o.value);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={root} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <div className="relative">
        <input
          ref={input}
          id={id ?? name}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className="input pr-9"
          placeholder={selected ? selected.label : placeholder}
          value={open ? query : selected?.label ?? ""}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onClick={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              if (open && filtered[active]) {
                e.preventDefault();
                choose(filtered[active]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
        />
        <Icon name="chevronDown" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
      </div>
      {open && !disabled && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line bg-white py-1 shadow-lg">
          {filtered.length === 0 && <li className="px-3 py-2 text-sm text-muted">{emptyText}</li>}
          {filtered.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${i === active ? "bg-brand-50" : ""} ${o.disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <span className="min-w-0">
                <span className="block truncate">{o.label}</span>
                {o.detail && <span className="block truncate text-xs text-muted">{o.detail}</span>}
              </span>
              {o.value === value && <Icon name="check" className="size-4 shrink-0 text-brand-600" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
