import { getCtx } from "@/lib/context";
import { Card, PageHeader } from "@/components/ui";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user } = await getCtx();
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
