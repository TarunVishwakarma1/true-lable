"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, FormError, SubmitButton, TextField } from "../components/form";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface/40 px-4">
      <div className="w-full max-w-[380px]">
        <p className="text-center font-mono text-[13px] font-medium tracking-tight text-fg">
          True<span className="text-accent">Label</span>
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-bg p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h1 className="text-lg font-medium text-fg">Sign in to Dashboard</h1>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <FormError message={error} />
            <Field label="Email">
              <TextField
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password">
              <TextField
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <SubmitButton type="submit" loading={loading} loadingText="Signing in…">
              Sign in
            </SubmitButton>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          No account yet?{" "}
          <Link href="/register" className="text-fg underline underline-offset-4 hover:text-accent">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
