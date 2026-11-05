"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { startSession } from "../actions";
import { DATA_SOURCE } from "@/lib/data-source/types";
import { onAuthStateChanged } from "firebase/auth";

type Mode = "signin" | "signup";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-login-credentials": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/email-already-in-use": "An account with this email already exists. Sign in instead.",
  "auth/weak-password": "Use at least 8 characters for your password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
  "auth/account-exists-with-different-credential": "This email is registered with a different sign-in method.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled for this project yet.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
};

function messageFor(err: unknown): string | null {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
  return MESSAGES[code] ?? "Sign-in failed. Please try again.";
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /** Exchange the Firebase user's fresh ID token for a server session, then enter the app. */
  // Demo mode: the Firebase session in the browser is the session, so skip the login page when signed in.
  useEffect(() => {
    if (DATA_SOURCE !== "demo") return;
    return onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/");
    });
  }, [router]);

  async function finish(user: User) {
    if (DATA_SOURCE === "api") {
      // API mode: trade the ID token for an httpOnly server session cookie.
      const result = await startSession(await user.getIdToken(true));
      await signOut(auth); // the server session is the source of truth from here on
      if (result.error) throw Object.assign(new Error(result.error), { serverMessage: result.error });
    }
    router.replace("/");
    router.refresh();
  }

  function fail(err: unknown) {
    const server = (err as { serverMessage?: string }).serverMessage;
    setError(server ?? messageFor(err));
    setBusy(null);
  }

  async function google() {
    setError(null);
    setNotice(null);
    setBusy("google");
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await finish(cred.user);
    } catch (err) {
      fail(err);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const errs: Record<string, string> = {};
    if (mode === "signup" && !name) errs.name = "Full name is required.";
    if (!email) errs.email = "Email is required.";
    if (!password) errs.password = "Password is required.";
    else if (mode === "signup" && password.length < 8) errs.password = "Use at least 8 characters.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy("email");
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await finish(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await finish(cred.user);
      }
    } catch (err) {
      fail(err);
    }
  }

  async function resetPassword(form: HTMLFormElement | null) {
    const email = String(new FormData(form ?? undefined).get("email") ?? "").trim();
    setError(null);
    if (!email) {
      setFieldErrors({ email: "Enter your email, then click “Forgot password?” again." });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      /* don't reveal whether the account exists */
    }
    setNotice("If an account exists for that email, a password reset link is on its way.");
  }

  const field = (name: string, label: string, type: string, autoComplete: string) => (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} type={type} autoComplete={autoComplete} className="input" aria-invalid={fieldErrors[name] ? true : undefined} />
      {fieldErrors[name] && <p className="mt-1.5 text-sm text-red-700">{fieldErrors[name]}</p>}
    </div>
  );

  return (
    <>
      <h1 className="text-xl font-semibold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        {mode === "signin" ? "Welcome back. Sign in to manage your properties." : "Start managing your buildings, tenants and leases."}
      </p>

      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-800">{notice}</div>}

      <button type="button" onClick={google} disabled={busy !== null} className="btn-secondary w-full">
        <GoogleIcon /> {busy === "google" ? "Signing in…" : "Continue with Google"}
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === "signup" && field("name", "Full name", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field("password", "Password", "password", mode === "signin" ? "current-password" : "new-password")}
        {mode === "signin" && (
          <button type="button" className="-mt-2 text-sm text-brand-700 hover:underline" onClick={(e) => resetPassword(e.currentTarget.form)}>
            Forgot password?
          </button>
        )}
        <button type="submit" disabled={busy !== null} className="btn-primary w-full">
          {busy === "email" ? (mode === "signin" ? "Signing in…" : "Creating account…") : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "signin" ? "New to UnitManager? " : "Already have an account? "}
        <button
          type="button"
          className="font-medium text-brand-700 hover:underline"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
            setFieldErrors({});
          }}
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </>
  );
}
