"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/buildings", label: "Buildings", icon: "building" },
  { href: "/units", label: "Units", icon: "door" },
  { href: "/tenants", label: "Tenants", icon: "users" },
  { href: "/leases", label: "Leases", icon: "file" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 px-2 text-[15px] font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-lg bg-brand-600 text-white">
        <Icon name="building" className="size-4" />
      </span>
      UnitManager
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5" aria-label="Main">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active ? "bg-brand-50 font-medium text-brand-800" : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <Icon name={item.icon} className={`size-[18px] ${active ? "text-brand-600" : ""}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Persistent sidebar on desktop; slide-over drawer on small screens. */
export function Sidebar({ footer }: { footer: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button className="btn-ghost px-2" onClick={() => setOpen(true)} aria-label="Open navigation">
          <Icon name="menu" className="size-5" />
        </button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-white px-3 py-5 lg:flex">
        <div className="mb-6">
          <Logo />
        </div>
        <NavLinks />
        <div className="mt-auto">{footer}</div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white px-3 py-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button className="btn-ghost px-2" onClick={() => setOpen(false)} aria-label="Close navigation">
                <Icon name="x" className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto">{footer}</div>
          </aside>
        </div>
      )}
    </>
  );
}
