import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Flash } from "@/components/flash";
import { AppProvider, Ready } from "@/components/app-provider";
import { Account } from "@/components/account";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AppProvider>
      <div className="min-h-screen">
        <Suspense fallback={null}>
          <Sidebar footer={<Account />} />
        </Suspense>
        <main className="lg:pl-60">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Ready>{children}</Ready>
          </div>
        </main>
        <Flash />
      </div>
    </AppProvider>
  );
}
