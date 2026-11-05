import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

async function Gate() {
  if (await getSession()) redirect("/");
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="skeleton h-72" />}>
      <Gate />
    </Suspense>
  );
}
