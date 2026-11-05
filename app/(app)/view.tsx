"use client";

import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { Icon, type IconName } from "@/components/icons";
import { BuildingIcon, Card, EmptyState, PageHeader } from "@/components/ui";


function Stat({ label, value, href, icon }: { label: string; value: number; href: string; icon: IconName }) {
  return (
    <Link href={href} className="card group flex items-center justify-between p-5 transition-colors hover:border-brand-300">
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      </div>
      <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
        <Icon name={icon} className="size-5" />
      </span>
    </Link>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: IconName }) {
  return (
    <Link href={href} className="card flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors hover:border-brand-300 hover:bg-brand-50/50">
      <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white">
        <Icon name={icon} className="size-4" />
      </span>
      {label}
    </Link>
  );
}

export default function DashboardView() {
  const { ctx, p } = useApp();


  return (
    <>
      <PageHeader title={`Welcome back, ${ctx.user.name.split(" ")[0]}`} description="Here's what's happening across your portfolio." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Buildings" value={p.buildings.length} href="/buildings" icon="building" />
        <Stat label="Units" value={p.units.length} href="/units" icon="door" />
        <Stat label="Tenants" value={p.tenants.length} href="/tenants" icon="users" />
        <Stat label="Leases" value={p.leases.length} href="/leases" icon="file" />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-muted">Quick actions</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickAction href="/buildings/new" label="Add Building" icon="building" />
        <QuickAction href="/tenants/new" label="Add Tenant" icon="users" />
        <QuickAction href="/units/new" label="Add Unit" icon="door" />
        <QuickAction href="/leases/new" label="Generate Lease" icon="file" />
      </div>

      <div className="mt-8">
        <Card title="Buildings" actions={<Link href="/buildings" className="link text-sm">View all</Link>} padded={false}>
          {p.buildings.length === 0 ? (
            <EmptyState
              icon="building"
              title="No buildings yet"
              description="Add your first building to get started."
              action={<Link href="/buildings/new" className="btn-primary"><Icon name="plus" /> Add Building</Link>}
            />
          ) : (
            <ul className="divide-y divide-line">
              {p.buildings.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <Link href={`/buildings/${b.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-canvas">
                    <BuildingIcon />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.displayName}</p>
                      <p className="truncate text-xs text-muted">{b.name ? b.fullAddress : `${b.city}, ${b.state}`}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted">
                      <p>
                        <span className="font-medium text-ink tabular-nums">{b.totalUnits}</span> unit{b.totalUnits === 1 ? "" : "s"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
