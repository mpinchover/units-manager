"use client";

import { useApp } from "@/components/app-provider";
import { Card, PageHeader } from "@/components/ui";


export default function SettingsPageView() {
  const { user } = useApp().ctx;
  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Your account details." />
      <Card title="Account">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">Full name</label>
            <input id="name" className="input" value={user.name} disabled readOnly />
          </div>
          <div>
            <label htmlFor="email" className="label">Email address</label>
            <input id="email" type="email" className="input" value={user.email} disabled readOnly />
          </div>
        </div>
      </Card>
    </div>
  );
}
