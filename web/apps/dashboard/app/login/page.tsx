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
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-[400px]">
        <p className="display text-center text-[26px] text-fg">
          True<span className="text-fg3">Label</span>
        </p>
        <p className="eyebrow mt-2.5 text-center">Operations console</p>

        <div className="mt-8 rounded-[20px] border border-line bg-surface p-7">
          <h1 className="display text-[27px] text-fg">Sign in</h1>
          <p className="mt-1.5 text-[13px] text-fg2">
            For the team handling crash reports and label data.
          </p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
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
            <SubmitButton type="submit" loading={loading} loadingText="Signing in…" className="mt-1">
              Sign in
            </SubmitButton>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] text-fg2">
          No account yet?{" "}
          <Link
            href="/register"
            className="text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg"
          >
            Request one
          </Link>
        </p>
      </div>
    </main>
  );
}
