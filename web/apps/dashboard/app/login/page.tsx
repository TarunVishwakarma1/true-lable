"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Field, FormError, SubmitButton, TextField } from "../components/form";
import { AuthShell } from "../components/landing/auth-shell";
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
    <AuthShell
      title="Sign in"
      subtitle="For the team handling crash reports and label data."
      aside="Every correction made here is attributed and kept."
      footer={
        <>
          No account yet?{" "}
          <Link
            href="/register"
            className="text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg"
          >
            Request one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
    </AuthShell>
  );
}
